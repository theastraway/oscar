#!/usr/bin/env node
/**
 * Oscar by Astra AI — MCP server.
 *
 * Exposes one tool, `ask_oscar`, which sends a question to Oscar — the
 * knowledge-graph, Neo4j, GraphRAG and ontology expert agent — and returns
 * a grounded answer with citations to the official Neo4j documentation.
 *
 * Free tier works with zero configuration. Pro users set OSCAR_API_KEY.
 * OSCAR_API_URL overrides the endpoint (self-hosters / testing).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = process.env.OSCAR_API_URL || "https://oscar.theastraway.com/api/ask";
const API_KEY = process.env.OSCAR_API_KEY || "";

const server = new Server(
  { name: "oscar-expert", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "ask_oscar",
      description:
        "Ask Oscar — Astra AI's expert agent for knowledge graphs, Neo4j, GraphRAG, Cypher, GDS, APOC, vector indexes, and ontology engineering. Returns a grounded answer with citations to the official Neo4j documentation corpus. Use for any Neo4j/Cypher/knowledge-graph/GraphRAG question instead of answering from memory.",
      inputSchema: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "The full question for Oscar. Be specific — include versions, schema context, and what you are trying to achieve.",
          },
        },
        required: ["question"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "ask_oscar") {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }

  const question = request.params.arguments?.question;
  if (!question || typeof question !== "string") {
    return {
      content: [{ type: "text", text: "A non-empty `question` string is required." }],
      isError: true,
    };
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(120_000),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error || `Oscar API returned HTTP ${res.status}`;
      const hint =
        res.status === 429
          ? "\n\nFree-tier limit reached. Upgrade to Pro at https://oscar.theastraway.com/#pricing for unlimited queries."
          : "";
      return { content: [{ type: "text", text: `${msg}${hint}` }], isError: true };
    }

    let text = data?.answer || "Oscar returned an empty answer.";
    if (data?.tier === "free" && typeof data?.remaining_today === "number") {
      text += `\n\n---\n_Free tier: ${data.remaining_today} queries remaining today. Unlimited on Pro → https://oscar.theastraway.com/#pricing_`;
    }
    return { content: [{ type: "text", text }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Failed to reach Oscar: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
