"""Ask Oscar a question (free tier by default; set OSCAR_API_KEY for Pro).

Usage: python3 ask_oscar.py "When should I use a vector index vs full-text in Neo4j?"
"""

import json
import os
import sys
import urllib.request

URL = os.environ.get("OSCAR_API_URL", "https://oscar.theastraway.com/api/ask")


def ask(question: str) -> dict:
    headers = {"Content-Type": "application/json"}
    key = os.environ.get("OSCAR_API_KEY")
    if key:
        headers["Authorization"] = f"Bearer {key}"
    req = urllib.request.Request(
        URL, data=json.dumps({"question": question}).encode(), headers=headers
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.load(resp)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    result = ask(sys.argv[1])
    print(result["answer"])
    if "remaining_today" in result:
        print(f"\n[free tier — {result['remaining_today']} queries left today]")
