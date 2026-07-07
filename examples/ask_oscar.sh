#!/usr/bin/env bash
# Ask Oscar a question from the command line (free tier — no key needed).
# Usage: ./ask_oscar.sh "How do I create a vector index in Neo4j?"

set -euo pipefail

QUESTION="${1:?Usage: ./ask_oscar.sh \"your question\"}"
URL="${OSCAR_API_URL:-https://oscar.theastraway.com/api/ask}"

AUTH_ARGS=()
if [[ -n "${OSCAR_API_KEY:-}" ]]; then
  AUTH_ARGS=(-H "Authorization: Bearer ${OSCAR_API_KEY}")
fi

curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  "${AUTH_ARGS[@]}" \
  -d "$(printf '{"question": %s}' "$(printf '%s' "$QUESTION" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')")" \
  | python3 -m json.tool
