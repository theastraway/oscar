# Oscar MCP Setup

Oscar ships as a standard [Model Context Protocol](https://modelcontextprotocol.io) server over stdio. It exposes one tool:

- **`ask_oscar(question)`** — sends your question to Oscar and returns a grounded answer with citations to the official Neo4j documentation.

## Claude Code

```bash
claude mcp add oscar -- npx -y github:theastraway/oscar
```

With a Pro key:

```bash
claude mcp add oscar -e OSCAR_API_KEY=your-key-here -- npx -y github:theastraway/oscar
```

## Claude Desktop

Edit `claude_desktop_config.json` (Settings → Developer → Edit Config):

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

Omit the `env` block entirely to use the free tier.

## Cursor

Add to `.cursor/mcp.json` in your project (or global Cursor settings):

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

## Any other MCP client

Command: `npx -y github:theastraway/oscar` (stdio transport). Node 18+ required.

## Environment variables

| Var | Required | Default | Purpose |
|---|---|---|---|
| `OSCAR_API_KEY` | No | — | Pro tier key. Without it you're on the free tier (10 queries/day). |
| `OSCAR_API_URL` | No | `https://oscar.theastraway.com/api/ask` | Endpoint override. |

## Prompting tips

- Include your Neo4j version and deployment (Aura vs self-hosted) — the docs differ.
- Paste your schema (labels, relationship types, key properties) for modeling questions.
- Ask one focused question per call; chain follow-ups.

## Troubleshooting

- **429 responses** — free-tier daily limit reached. Upgrade at [oscar.theastraway.com/#pricing](https://oscar.theastraway.com/#pricing).
- **`npx` can't find the package** — ensure Node 18+ (`node --version`) and network access to github.com.
- **Slow first call** — `npx` installs on first run; subsequent calls are fast.
