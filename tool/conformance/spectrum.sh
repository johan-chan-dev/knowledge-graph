#!/usr/bin/env bash
# The local<->global spectrum, run against the movies space.
#
# Not a conformance test: nothing here asserts. It records **how far the tool
# reaches and what it costs**, so the same numbers can be produced again after
# an optimisation and compared. A baseline nobody can reproduce is a decoration,
# which is why this sits beside `import.sh` — the corpus it needs is built by
# the script next to it, from scratch, identically.
#
#   kg -C <space> space init && (cd <space> && … import.sh)   # 171 nodes
#   tool/conformance/spectrum.sh <space>
#
# The shape borrowed from BenchmarkQED's AutoQ: queries spanning local — one
# node — to global — the whole corpus. See docs/design/parked/benchmark.md.
set -uo pipefail

SPACE="${1:-}"
[ -n "$SPACE" ] || { echo "usage: spectrum.sh <space>" >&2; exit 2; }
K="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/build/kg"
[ -x "$K" ] || { echo "kg is not built — deno task --cwd tool compile" >&2; exit 2; }
command -v jq >/dev/null || { echo "jq is required" >&2; exit 2; }

kg() { "$K" -C "$SPACE" "$@"; }
ms() { local s=$1; echo $(( ($(date +%s%N) - s) / 1000000 )); }

# Best of three, everywhere. A single cold run measured the filesystem cache as
# much as the tool — 647 ms against 131 ms for the same load — and a baseline
# that noisy would hide any improvement it exists to reveal.
best() { local fn=$1 n b=999999 s c; for n in 1 2 3; do
  s=$(date +%s%N); $fn >/dev/null 2>&1; c=$(ms "$s"); [ "$c" -lt "$b" ] && b=$c; done; echo "$b"; }

# The whole graph in two calls. Every global row pays this once, and the figure
# is reported rather than hidden behind a cache — it is most of their cost.
ALL=$(mktemp); trap 'rm -f "$ALL"' EXIT
load() { kg nodes list | kg nodes --stdin --properties > "$ALL"; }
LOAD=$(best load)

row() { # id  question  mechanism  fn
  local id=$1 q=$2 m=$3 fn=$4 c out
  out=$($fn 2>&1)
  c=$(best "$fn")
  [ "$m" = "graph+jq" ] && c="${LOAD}+$c"
  printf '%-3s %-42s %-9s %9s  %s\n' "$id" "$q" "$m" "$c" "$out"
}

l1() { kg nodes match '({title: "Cloud Atlas"})' | jq -r '.[0].released'; }
l2() { kg nodes match '(:Person)-[:DIRECTED]->({title: "Cloud Atlas"})' \
       | jq -r '[.[] | select(.labels|index("Person")) | .name] | sort | join(", ")'; }
l3() { kg nodes match '(p)-[:ACTED_IN]->(m)<-[:DIRECTED]-(p)' \
       | jq -r '[.[] | select(.labels|index("Person")) | .name] | unique | join(", ")'; }
m1() { kg nodes match '(:Person {name: "Tom Hanks"})-[:ACTED_IN]->(:Movie)' \
       | jq '[.[] | select(.labels|index("Movie"))] | length'; }
# The anchor comes back in the subgraph, so it is subtracted. Getting this wrong
# yields 35, and 35 is wrong in a way nothing announces.
m2() { kg nodes match '(:Person {name: "Tom Hanks"})-[:ACTED_IN]->(:Movie)<-[:ACTED_IN]-(:Person)' \
       | jq -r '[.[] | select(.labels|index("Person")) | .name] | unique
                | map(select(. != "Tom Hanks")) | length | "\(.) co-actors"'; }
m3() { jq -r '[.[] | select(.labels|index("Person"))
               | select([(.links//[])[] | select(.type=="ACTED_IN" and .direction=="out")] | length > 3)]
               | length | "\(.) people"' "$ALL"; }
m4() { jq -r '[.[] | select(.labels|index("Person"))
               | select([(.links//[])[] | select(.type=="ACTED_IN" and .direction=="out")] | length > 0)
               | select([(.links//[])[] | select(.type=="DIRECTED" and .direction=="out")] | length == 0)]
               | length | "\(.) actors, none directed"' "$ALL"; }
g1() { jq -r '[.[] | {n: (.name // .title), c: ((.links//[])|length)}] | sort_by(-.c) | .[0:3]
               | map("\(.n)(\(.c))") | join(" ")' "$ALL"; }
g2() { jq -r '[.[] | select(.labels|index("Movie")) | ((.released|tonumber) - (.released|tonumber) % 10)]
               | group_by(.) | map("\(.[0])s=\(length)") | join(" ")' "$ALL"; }
g3() { echo "NO MECHANISM — no text, no summarisation"; }
g4() { echo "NO MECHANISM — no text, no summarisation"; }

echo "space: $SPACE   nodes: $(jq 'length' "$ALL")   whole-graph load: ${LOAD} ms"
echo
printf '%-3s %-42s %-9s %9s  %s\n' id question mechanism cost answer
row L1 "one property of one node"            pattern    l1
row L2 "one hop - who directed it"           pattern    l2
row L3 "two hops with a join"                pattern    l3
row M1 "count within one neighbourhood"      "patt+jq"  m1
row M2 "co-actors of one actor"              "patt+jq"  m2
row M3 "corpus-wide threshold"               "graph+jq" m3
row M4 "negation on the far node"            "graph+jq" m4
row G1 "the 3 most connected nodes"          "graph+jq" g1
row G2 "films by decade"                     "graph+jq" g2
row G3 "main themes of the corpus"           none       g3
row G4 "summarise it, and how it shifts"     none       g4
