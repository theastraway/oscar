// GET /api/stats — live corpus-scale numbers for the landing pages.
// Counts documents via the MIND developer API and nodes/relationships via a
// read-only Cypher count against the production graph. Heavily cached: the
// numbers move daily, not per-request.
export const config = { maxDuration: 60 };

const FLOORS = { documents: 38788, nodes: 721553, relationships: 1035084 };
const TTL_MS = 6 * 60 * 60 * 1000;
let cache = { at: 0, data: null };

async function cypherCount(statement) {
  const host = process.env.OSCAR_NEO4J_URI;
  const auth = Buffer.from(
    `${process.env.OSCAR_NEO4J_USERNAME}:${process.env.OSCAR_NEO4J_PASSWORD}`
  ).toString('base64');
  const r = await fetch(`https://${host}/db/neo4j/query/v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({ statement }),
  });
  if (!r.ok) throw new Error(`neo4j ${r.status}`);
  const d = await r.json();
  return d.data.values[0][0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  if (cache.data && Date.now() - cache.at < TTL_MS) {
    return res.status(200).json(cache.data);
  }
  const label = process.env.OSCAR_NEO4J_LABEL || 'user_oscar_cd8b8b8a';
  const base = process.env.OSCAR_MIND_BASE || 'https://mindapp.onrender.com/developer/v1';
  try {
    const [docs, nodes, relationships] = await Promise.all([
      fetch(`${base}/documents?limit=1`, {
        headers: { 'X-API-Key': process.env.OSCAR_MIND_API_KEY },
      }).then((r) => r.json()),
      cypherCount(`MATCH (n:\`${label}\`) RETURN count(n) AS c`),
      cypherCount(`MATCH (:\`${label}\`)-[r]->() RETURN count(r) AS c`),
    ]);
    const data = {
      documents: docs.total,
      nodes,
      relationships,
      measured_at: new Date().toISOString(),
    };
    cache = { at: Date.now(), data };
    return res.status(200).json(data);
  } catch (e) {
    // Serve the last-known verified floor rather than an error — the band must never be empty.
    return res.status(200).json(cache.data || { ...FLOORS, fallback: true });
  }
}
