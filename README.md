# Oscar — the Knowledge Graph Expert Agent

**By [Astra AI](https://theastraway.com) · [oscar.theastraway.com](https://oscar.theastraway.com)**

Oscar is an AI expert agent for **knowledge graphs, Neo4j, GraphRAG, Cypher, and ontology engineering**. He is grounded in the complete official Neo4j documentation corpus — Cypher Manual, Operations Manual, Graph Data Science (GDS), APOC, GenAI plugin, Getting Started, Drivers, and Aura — and answers with **citations to the official docs**. A 24/7 ingestion loop of new ML research papers keeps his knowledge current.

No hallucinated Cypher. No stale answers. Receipts on everything.

## Quickstart — MCP (2 minutes, free, no signup)

### Claude Code

```bash
claude mcp add oscar -- npx -y github:theastraway/oscar
```

### Claude Desktop / Cursor / any MCP client

Add to your MCP config (`claude_desktop_config.json`, `.cursor/mcp.json`, etc.):

```json
{
  "mcpServers": {
    "oscar": {
      "command": "npx",
      "args": ["-y", "github:theastraway/oscar"]
    }
  }
}
```

That's it. Your agent now has an `ask_oscar` tool. Try:

> "Ask Oscar how to create a vector index in Neo4j."

### Pro tier

Set your key and the limits disappear:

```json
{
  "mcpServers": {
    "oscar": {
      "command": "npx",
      "args": ["-y", "github:theastraway/oscar"],
      "env": { "OSCAR_API_KEY": "your-key-here" }
    }
  }
}
```

Get a key at [oscar.theastraway.com](https://oscar.theastraway.com/#pricing).

## Quickstart — REST API

```bash
curl -X POST https://oscar.theastraway.com/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "When should I use a vector index vs a full-text index in Neo4j?"}'
```

Pro (unlimited):

```bash
curl -X POST https://oscar.theastraway.com/api/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OSCAR_API_KEY" \
  -d '{"question": "Design a GraphRAG retrieval strategy for a legal-documents graph."}'
```

Response:

```json
{
  "answer": "…grounded answer with citations to the official Neo4j docs…",
  "mode": "hybrid",
  "tier": "free",
  "remaining_today": 9
}
```

## What Oscar knows

| Corpus | Coverage |
|---|---|
| Cypher Manual | Full query-language syntax and semantics |
| Operations Manual | Deployment, clustering, backup, security |
| Graph Data Science (GDS) | Algorithms, embeddings, pipelines, projections |
| APOC | The real procedures — no inventions |
| GenAI plugin | Vector indexes, embeddings, similarity functions |
| Getting Started + Drivers | Modeling basics, language drivers |
| Aura | Managed-cloud specifics |
| ML research feed | New papers ingested 24/7 (GraphRAG, agent memory, graph ML) |

Oscar is backed by [MIND](https://m-i-n-d.ai), Astra AI's persistent memory and knowledge-graph platform.

## Pricing

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | 10 cited queries/day via API & MCP — no signup |
| **Pro** | $20/mo | Unlimited fair-use queries, priority latency |
| **Team / API** | $99/mo | 5 seats, dedicated API keys, higher rate limits |

Upgrade at [oscar.theastraway.com](https://oscar.theastraway.com/#pricing).

## Repo layout

- `index.js` — the MCP server (stdio). `npx -y github:theastraway/oscar`
- `api/ask.js` — the hosted query API (Vercel serverless)
- `public/` — [oscar.theastraway.com](https://oscar.theastraway.com)
- `docs/` — [MCP setup](docs/mcp.md) · [REST API](docs/api.md)
- `examples/` — curl, Python

## Environment variables

| Var | Where | Purpose |
|---|---|---|
| `OSCAR_API_KEY` | MCP client env | Pro key (optional — free tier needs nothing) |
| `OSCAR_API_URL` | MCP client env | Override endpoint (testing/self-host) |

## License

MIT © Astra AI, Inc.
