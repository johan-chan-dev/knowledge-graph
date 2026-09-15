---
name: kg
description: >-
  Work with a kg knowledge graph — a repository's decisions, notes, tools and
  the relations between them, held as markdown with typed frontmatter. Use when
  a repository contains a `.kg/` directory, when a task is about recording or
  retrieving what a project has decided and why, or whenever work involves
  atomic notes with typed frontmatter, decision records, or a graph of typed
  relations. Carries the recipes that combine `kg` with `jq`: the tool selects
  by structure, `jq` computes. Reach for it before hand-editing any frontmatter
  — every rule has a verb that writes it correctly by construction.
---

# kg

A store of nodes, the words that classify them, and the typed relations between
them. Markdown with YAML frontmatter on disk; JSON on the way out.

**This page holds only what the tool cannot tell you itself.** Its refusals name
the boundary when you reach it, and `docs/` in the plugin's repository argues
why everything is the way it is. What neither can carry is the habit nobody is
refused for skipping, and the `jq` a question needs once the pattern has done
its half.

## First, three commands

```bash
kg labels list      # the words that classify a node
kg types list       # the words that name a relation
kg nodes list | head -1 | xargs -I{} kg node {} --properties
```

Roughly 0.2 s, and the vocabulary is in front of you. **Do this before writing a
pattern.** Measured across 23 models on a real query language: a request that
matches the schema succeeds 89% of the time, one that has to guess it, 17%. The
gap is the whole reason this section is first.

Words are **case-sensitive and stored as written** — `Person` and `person` are
two different labels, and a pattern spells what `labels list` prints.

## The division of labour

| | does |
|---|---|
| **a pattern** | structure and equality — labels, relation types, direction, property maps, paths |
| **`jq`** | comparison, presence, negation, aggregation, projection |

A pattern is the `MATCH`; the `jq` after it is the `RETURN`. There is no `WHERE`
clause — say it and the tool tells you so.

## Selecting

```bash
# every node carrying a word
kg nodes match '(:Movie)'

# equality, with or without a label
kg nodes match '({title: "Cloud Atlas"})'

# a relation — and both its ends come back
kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})'

# the same relation read from the other end — direction is the arrow, and a
# pattern pointing the wrong way matches nothing rather than guessing
kg nodes match '(:Movie)<-[:DIRECTED]-(:Person)'

# alternation, and a map on the relation itself
kg nodes match '(:Person)-[:ACTED_IN|DIRECTED]->(:Movie)'
kg nodes match '(:Person)-[:ACTED_IN {roles: "Neo"}]->(:Movie)'

# a chain, and a variable used twice is a join: acted in a film they directed
kg nodes match '(p)-[:ACTED_IN]->(m)<-[:DIRECTED]-(p)'

# several parts, for a node with three edges in the pattern — one chain cannot
# cover them without walking an edge twice, which the uniqueness rule forbids
kg nodes match '(p:Person)-[:ACTED_IN]->(:Movie), (p)-[:DIRECTED]->(:Movie)'

# a path into a structure
kg nodes match '(:Service {config.port: "8080"})'
```

**A pattern returns both ends of every relation it names**, resolved, as JSON —
so the anchor is in the result and the edges come back attached. Asking for one
side is the caller's `select`, which is why almost every recipe below has one.

**A relationship binds at most once inside one pattern.** That is what keeps a
two-hop pattern from coming back along the edge it arrived on — and it is why
*co-actors* excludes the actor themselves.

## Computing — the recipes

Every one of these was run against a 171-node graph.

```bash
# project one side
kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})' \
  | jq -r '.[] | select(.labels | index("Person")) | .name'

# a comparison
kg nodes match '(:Movie)' | jq '[.[] | select((.released|tonumber) > 2000)] | length'

# a presence test
kg nodes match '(:Person)' | jq -r '[.[] | select(.born == null) | .name]'

# count by relation type, for one node
kg node "$ID" --properties \
  | jq '[.links[] | .type] | group_by(.) | map({(.[0]): length}) | add'

# a negated pattern, when it is about the node's own edges — one line
kg nodes match '(:Person)-[:ACTED_IN]->(:Movie)' \
  | jq '[.[] | select(.labels|index("Person"))
        | select((.links//[]) | any(.type=="DIRECTED" and .direction=="out") | not)]'
```

**Where `jq` alone stops.** The recipes above work because a resolved node
carries its own entries, with `type`, `direction` and `neighbour`. As soon as a
negated pattern constrains the **far** node, you need its properties too — and a
match returns only the subgraph it named:

```bash
# actors who directed no film released after 2010
kg nodes match '(:Person)-[:ACTED_IN]->(:Movie)' > sub.json
kg nodes list | kg nodes --stdin --properties > all.json
jq -s '(.[1] | INDEX(.id)) as $by
  | [ .[0][] | select(.labels|index("Person"))
      | select( [ (.links//[])[] | select(.type=="DIRECTED" and .direction=="out")
                  | $by[.neighbour] | select((.released|tonumber) > 2010) ] | length == 0 ) ]' \
  sub.json all.json
```

The whole graph loads in two calls — 171 nodes in about 0.2 s — so this is
ordinary rather than heroic at the sizes this tool is for.

## Writing

**Never hand-edit frontmatter.** Every rule here has a verb that keeps it by
construction, and a file edited by hand puts the rules back to being checked
afterwards, which is what the verbs exist to remove.

```bash
ID=$(kg node new --with-labels Decision)          # an id, on stdout
printf 'the prose\n' | kg node new --stdin --with-labels Decision

kg node "$ID" set title "The vocabulary is openCypher's"
kg node "$ID" set --stdin <<'JSON'
{ "status": "settled", "config": { "port": "8080" }, "sources": ["batch-12"] }
JSON
kg node "$ID" set config --stdin <<< '{"port": "9090"}'   # merged there
kg node "$ID" set config.tls.ca "here"                    # a scalar at a path

kg node "$ID" add sources rfc-7396      # a list grows without being restated
kg node "$ID" delete config.tls sources # several paths, any depth

kg node "$A" link --as SUPERSEDES --with-nodes "$B" --with-properties 'since=2026-09'
kg node "$ID" label Decision            # using a word is what creates it
printf 'what it means here\n' | kg type SUPERSEDES write --stdin
```

**A place and a thing.** Every write names where and what: `set title "x"` is a
path of length one, `set config --stdin` is a path and an object, `set --stdin`
is the root and an object. The merge is deep through maps and replaces a list
whole — `add` and `remove` are how a list's items move.

**A record is a document of properties**, so `kg link <id>` takes the same
`set`, `delete`, `add` and `remove`.

## The output is not an input

`--properties` prints the stored shape **plus** the resolution: `neighbour` is
computed, `labels` and `links` have their own verbs, and the plural form adds
`id`. The obvious round trip refuses rather than dropping them quietly:

```bash
kg node "$ID" --properties | jq 'del(.labels, .links) | .status = "live"' \
  | kg node "$ID" set --stdin
```

## Refusals worth knowing before you meet them

| | |
|---|---|
| `no such label: person — did you mean Person?` | the vocabulary is case-sensitive; `labels list` prints it |
| `a property is text, so write it quoted` | `{released: 2000}` never matches — the store holds text |
| `labels is reserved — written with \`label\`` | the tool's slots have their own verbs |
| `this verb takes a name, not a path` | `add` and `remove` are top-level; a nested list is replaced with `set` |
| `a pattern takes no condition` | that half is `jq`'s |
| `a variable-length path is not built` | `*1..3` — a fixed pattern plus one call per hop, today |

## Exit codes

`0` done · `1` refused, the argument broke a rule and nothing was read · `2`
absent, well-formed and not here · `4` the command's form is wrong.

**An empty answer is `[]` and exits `0`.** A query and its negation partition
the space: absence reads as false, so there is no third value to check for.

## If `kg` is not there

The binary is built rather than downloaded — `deno task --cwd tool compile` in
the plugin's repository, about 7 s the first time, with Deno the only
dependency. The session hook says so when it is missing or older than its
source.
