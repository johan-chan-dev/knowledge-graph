#!/usr/bin/env bash
# One session per document. The record goes in verbatim — rendering it would be
# a decision taken on the agent's behalf, and the protocol gives material and
# purpose, never form.
#
# Documents per session is a variable, not a cost knob: at 1 the graph is the
# only continuity between documents, which is the claim under test. Higher, and
# the agent sees several at once and can model across them without the base.
#
# Parallel since batch 16: concurrent updates to a node are cumulative.
set -uo pipefail

usage() { echo "usage: ingest.sh --run <dir> --plugin <dir> [--jobs N] [--limit N]" >&2; exit 2; }
RUN=""; PLUGIN=""; JOBS=4; LIMIT=0
while [ $# -gt 0 ]; do case "$1" in
  --run) RUN="$2"; shift 2;; --plugin) PLUGIN="$2"; shift 2;;
  --jobs) JOBS="$2"; shift 2;; --limit) LIMIT="$2"; shift 2;; *) usage;; esac; done
[ -n "$RUN" ] && [ -n "$PLUGIN" ] || usage

SPACE="$RUN/space"; LOG="$RUN/ingest"
mkdir -p "$LOG"
[ -d "$SPACE/.kg" ] || { echo "no space at $SPACE — run.sh makes it" >&2; exit 2; }

PROMPT_HEAD='This abstract joins a knowledge base that will later be put to scientific claims: it must be able to say whether the literature it holds supports them, refutes them, or does not address them — and to name the sentences that settle it.

The base is shared and already holds whatever earlier documents left in it.

Nobody reviews this run, so you do not hold the pen: whatever this document should leave behind, **propose it to the kg mechanics agent, which contests and writes**. You decide what matters; it decides what the graph can bear.

Two properties of the material, not of the shape you should give it. The abstract is an array and **the index is the address** — it ships as it is, including where one element holds two sentences, and renumbering it makes every later annotation point at the wrong text. And a claim is warranted by the element that says it, not by what you already know.

Here is the document, verbatim from the corpus. Decide what it should leave behind, if anything.

'

# The id travels, not the record: BSD xargs allows 255 bytes per substitution
# and a corpus line is about 1 600. The worker pulls its own line back out.
one() {
  local id="$1" line
  [ -s "$LOG/$id.json" ] && return 0          # resumable: already done
  line=$(jq -c --argjson i "$id" 'select(.doc_id==$i)' "$CORPUS")
  [ -n "$line" ] || { echo "no document $id in $CORPUS" >&2; return 1; }
  printf '%s%s\n' "$PROMPT_HEAD" "$line" \
    | claude -p --plugin-dir "$PLUGIN" --output-format json \
        --add-dir "$SPACE" > "$LOG/$id.json" 2>"$LOG/$id.err"
  printf '%s\n' "$id"
}
export -f one; export PROMPT_HEAD LOG SPACE PLUGIN

CORPUS="$RUN/inputs/corpus.jsonl"; export CORPUS
src=$(mktemp)
if [ "$LIMIT" -gt 0 ]; then jq -r .doc_id "$CORPUS" | head -"$LIMIT" > "$src"
else jq -r .doc_id "$CORPUS" > "$src"; fi

# The elapsed time is computed after the work, not inside the pipeline that
# does it: an arithmetic expansion there is evaluated when the line is built,
# and reports zero however long the run takes.
start=$(date +%s)
cd "$SPACE" || exit 1
done_count=$(< "$src" xargs -P "$JOBS" -I{} bash -c 'one "$@"' _ {} | wc -l | tr -d ' ')
echo "$done_count documents ingested in $(( $(date +%s) - start ))s"
