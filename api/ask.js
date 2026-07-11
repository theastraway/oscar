/**
 * Oscar public query API — Vercel serverless function.
 *
 * POST /api/ask  { "question": "..." }
 *
 * Tiers:
 *  - Free: no auth required. Soft per-IP daily limit + global daily cap.
 *  - Pro:  Authorization: Bearer <key>, where <key> is in OSCAR_PRO_KEYS
 *          (comma-separated env var). No limits (fair use).
 *
 * The upstream MIND tenant key (OSCAR_MIND_API_KEY) never leaves the server.
 * Rate limiting is in-memory per lambda instance — a soft gate, not a
 * security boundary; the hard cap is the tenant's credit balance upstream.
 */

// Oscar runs on its OWN dedicated MIND web service (oscar-mind.onrender.com) so its
// heavy corpus ingest + massive KG never share the shared m-i-n-d.ai backend's LLM
// worker pool — that co-location was starving Oscar chat (queries queued ~100s behind
// the never-ending ingest and hit the proxy timeout). Isolated process = isolated pool.
const MIND_BASE = process.env.OSCAR_MIND_BASE || "https://oscar-mind.onrender.com/developer/v1";
const FREE_PER_IP_PER_DAY = parseInt(process.env.OSCAR_FREE_PER_IP || "10", 10);
const FREE_GLOBAL_PER_DAY = parseInt(process.env.OSCAR_FREE_GLOBAL || "1000", 10);
const MAX_QUESTION_CHARS = 2000;

const ipCounts = new Map();
let globalCount = 0;
let windowDay = new Date().toISOString().slice(0, 10);

function rollWindow() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== windowDay) {
    windowDay = today;
    ipCounts.clear();
    globalCount = 0;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const question = req.body?.question;
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "Body must include a non-empty `question` string." });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return res.status(400).json({ error: `Question too long (max ${MAX_QUESTION_CHARS} chars).` });
  }

  const upstreamKey = process.env.OSCAR_MIND_API_KEY;
  if (!upstreamKey) {
    return res.status(500).json({ error: "Server misconfigured: upstream key missing." });
  }

  // Tier resolution
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const proKeys = (process.env.OSCAR_PRO_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const isPro = bearer && proKeys.includes(bearer);

  let remainingToday = null;
  if (!isPro) {
    if (bearer) {
      return res.status(401).json({
        error: "Invalid API key. Check your key, or use the free tier by omitting the Authorization header.",
      });
    }
    rollWindow();
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const used = ipCounts.get(ip) || 0;
    if (globalCount >= FREE_GLOBAL_PER_DAY) {
      return res.status(429).json({
        error: "Free tier is at capacity for today. Try again tomorrow or upgrade to Pro.",
        upgrade: "https://oscar.theastraway.com/#pricing",
      });
    }
    if (used >= FREE_PER_IP_PER_DAY) {
      return res.status(429).json({
        error: `Free tier limit reached (${FREE_PER_IP_PER_DAY} queries/day). Upgrade to Pro for unlimited queries.`,
        upgrade: "https://oscar.theastraway.com/#pricing",
      });
    }
    ipCounts.set(ip, used + 1);
    globalCount += 1;
    remainingToday = FREE_PER_IP_PER_DAY - used - 1;
  }

  try {
    // `local` (focused graph search) is far faster than `hybrid` and keeps chat responsive.
    const mode = typeof req.body?.mode === "string" ? req.body.mode : "local";
    const upstream = await fetch(`${MIND_BASE}/query`, {
      method: "POST",
      headers: { "X-API-Key": upstreamKey, "Content-Type": "application/json" },
      body: JSON.stringify({ query: question, mode }),
      signal: AbortSignal.timeout(110_000),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("Upstream error", upstream.status, text.slice(0, 300));
      return res.status(502).json({ error: "Oscar's knowledge base is unreachable right now. Try again shortly." });
    }

    const data = await upstream.json();
    const out = {
      answer: data.response || "",
      mode: data.mode || "hybrid",
      tier: isPro ? "pro" : "free",
    };
    if (remainingToday !== null) out.remaining_today = remainingToday;
    return res.status(200).json(out);
  } catch (err) {
    console.error("Proxy failure", err?.message);
    return res.status(504).json({ error: "Oscar took too long to answer. Try again." });
  }
}
