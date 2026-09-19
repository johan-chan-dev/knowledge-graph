#!/usr/bin/env bash
# One session per claim, against the graph an ingestion left. The session is a
# conversation — it delegates to the mechanics if it judges the search worth
# delegating, which is the system rather than half of it.
#
# The prompt states the three outcomes and nothing about how to look: the skill
# carries that, and telling it again would be measuring the prompt.
set -uo pipefail

usage() { echo "usage: answer.sh --run <dir> --plugin <dir> [--jobs N] [--only ID]" >&2; exit 2; }
RUN=""; PLUGIN=""; JOBS=4; ONLY=""
while [ $# -gt 0 ]; do case "$1" in
  --run) RUN="$2"; shift 2;; --plugin) PLUGIN="$2"; shift 2;;
  --jobs) JOBS="$2"; shift 2;; --only) ONLY="$2"; shift 2;; *) usage;; esac; done
[ -n "$RUN" ] && [ -n "$PLUGIN" ] || usage

SPACE="$RUN/space"; LOG="$RUN/answers"; CLAIMS="$RUN/inputs/claims_dev.jsonl"
mkdir -p "$LOG"

ask() {
  local id="$1" text out
  [ -s "$LOG/$id.json" ] && return 0
  text=$(jq -r --argjson i "$id" 'select(.id==$i) | .claim' "$CLAIMS")
  [ -n "$text" ] || { echo "no claim $id" >&2; return 1; }
  cat <<PROMPT | claude -p --plugin-dir "$PLUGIN" --output-format json --add-dir "$SPACE" > "$LOG/$id.json" 2>"$LOG/$id.err"
A knowledge base in this repository holds scientific literature. Say what it holds about this claim:

  "$text"

Three outcomes, and the third is said by saying nothing: the literature **supports** the claim, **refutes** it, or the base holds nothing that settles it — in which case the evidence is empty rather than carrying a third label.

Answer with one JSON object and nothing else after it:

  {"id": $id, "evidence": {"<doc_id>": {"label": "SUPPORT" or "CONTRADICT", "sentences": [<index>]}}, "rung": <n>}

\`sentences\` are indices into the source abstract as it shipped — the address of the evidence, not a paraphrase of it. \`rung\` is which step of the ladder produced the answer.
PROMPT
  printf '%s\n' "$id"
}
export -f ask; export LOG CLAIMS SPACE PLUGIN

ids=$(mktemp)
if [ -n "$ONLY" ]; then echo "$ONLY" > "$ids"; else jq -r .id "$CLAIMS" > "$ids"; fi

start=$(date +%s)
cd "$SPACE" && < "$ids" xargs -P "$JOBS" -I{} bash -c 'ask "$@"' _ {} >/dev/null

# The session's own text, with the object pulled out of it. Asked for cleanly,
# but a model that adds a sentence must not cost the run a claim.
for f in "$LOG"/*.json; do
  [ -s "$f" ] || continue
  jq -r '.result' "$f" | python3 -c '
import sys, json
# Balanced braces, not a regex: the object nests three deep — id, evidence,
# then each document — and a regex written for two levels silently matches
# nothing, which reads exactly like a session that answered nothing.
text = sys.stdin.read(); found = None
for i, ch in enumerate(text):
    if ch != "{": continue
    depth = 0
    for j in range(i, len(text)):
        if text[j] == "{": depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                try:
                    o = json.loads(text[i:j + 1])
                    if isinstance(o, dict) and "id" in o and "evidence" in o: found = o
                except Exception: pass
                break
if found: print(json.dumps(found))
'
done > "$RUN/answers.jsonl"
echo "$(wc -l < "$RUN/answers.jsonl" | tr -d ' ') answers in $(( $(date +%s) - start ))s → $RUN/answers.jsonl"
