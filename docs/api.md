# Oscar REST API

Base URL: `https://oscar.theastraway.com/api`

## POST /ask

Ask Oscar a question. Returns a grounded answer with citations to the official Neo4j documentation corpus.

### Request

```
POST /api/ask
Content-Type: application/json
Authorization: Bearer <key>   # Pro/Team only — omit for free tier
```

```json
{ "question": "How do I create a vector index in Neo4j? Give the exact Cypher DDL." }
```

Constraints: `question` is a non-empty string, max 2,000 characters.

### Response — 200

```json
{
  "answer": "To create a vector index in Neo4j, use CREATE VECTOR INDEX ... [citations]",
  "mode": "hybrid",
  "tier": "free",
  "remaining_today": 9
}
```

`remaining_today` appears on the free tier only.

### Errors

| Status | Meaning |
|---|---|
| 400 | Missing/invalid/too-long `question` |
| 401 | Invalid API key (omit the header to use the free tier) |
| 429 | Free-tier limit reached (per-IP daily, or global daily capacity) |
| 502 / 504 | Upstream knowledge base unreachable or timed out — retry |

### Tiers

| Tier | Auth | Limit |
|---|---|---|
| Free | none | 10 queries/day per IP (soft), global daily cap |
| Pro | `Authorization: Bearer <key>` | Unlimited (fair use) |
| Team | `Authorization: Bearer <key>` | Unlimited (fair use), multiple keys |

Get a key: [oscar.theastraway.com/#pricing](https://oscar.theastraway.com/#pricing)

### Examples

curl:

```bash
curl -X POST https://oscar.theastraway.com/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Which GDS algorithm should I use for community detection on a 10M-node graph?"}'
```

Python:

```python
import requests

r = requests.post(
    "https://oscar.theastraway.com/api/ask",
    json={"question": "MERGE vs CREATE in Cypher — when does MERGE create duplicates?"},
    headers={"Authorization": "Bearer YOUR_KEY"},  # omit for free tier
    timeout=120,
)
print(r.json()["answer"])
```
