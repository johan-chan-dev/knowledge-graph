#!/usr/bin/env bash
# The SciFact release, once. 3 MB, public, versioned — held by reference rather
# than vendored, which is the rule the skill states for a durable source.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out="${1:-$here/data}"
[ -f "$out/corpus.jsonl" ] && { echo "already at $out"; exit 0; }
mkdir -p "$out"
curl -sSL -o "$out/data.tar.gz" https://scifact.s3-us-west-2.amazonaws.com/release/latest/data.tar.gz
tar -xzf "$out/data.tar.gz" -C "$out" --strip-components=1
rm -f "$out/data.tar.gz"
printf '%s\n' "$out: $(wc -l < "$out/corpus.jsonl" | tr -d ' ') documents, $(wc -l < "$out/claims_dev.jsonl" | tr -d ' ') dev claims"
