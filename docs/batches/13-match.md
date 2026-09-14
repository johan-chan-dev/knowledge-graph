# Batch 13 — match

**Done when** a pattern selects a subgraph in one command, and `find` is gone.

Needs [batch 12](12-vocabulary.md) first. A `match` shipped on the old
vocabulary would have people writing `(:person)-[:acted-in]->`, and every one of
those patterns breaks when the vocabulary lands.

## What it has to fix

**`find` folds two questions Cypher keeps apart.** A label test belongs to the
pattern, a property predicate to the condition — `find` puts both behind one
`and`:

```bash
kg nodes find '"Person" in labels and released > 2000'
```

Two questions of different natures joined by a connective that suggests they are
the same kind.

**Following a relation costs a `jq` step.** Questions 4, 10 and 12 of the
guide are answered, but by resolving entries and filtering them by hand.
Question 10 is four processes and two `jq` expressions for what is one
relationship.

**And a predicate cannot ask for a subgraph.** Measured on the imported movies
graph:

| selection | nodes | edges | internal |
|---|---|---|---|
| `find '"movie" in labels'` | 38 | 250 | **0** |
| the pattern `(:Person)-[:DIRECTED]->(:Movie where title = "Cloud Atlas")` | 4 | 29 | 6 |

A predicate selects nodes that happen to have edges; a pattern selects **both
ends of every relation it names**. Those 6 are the three `DIRECTED` relations
seen from each end — the pattern closes what it names, and nothing more. The
other 23 still dangle, which is correct: a selection closed over *every* edge
would be the whole connected component.

## What it should look like

```console
$ kg nodes match '(:Person)-[:DIRECTED]->(:Movie where title = "Cloud Atlas")'
01a09f8b-263b-7033-bab3-3dc6b88b66e7
01a09f8b-2b41-7e70-9a4b-6a4d3d2f1c88
01a09f8b-3102-7a55-8f3e-1b2c9e7a4d10
01a09f8b-54a0-7cb0-beec-5e78f58b4686

$ kg nodes match '(:Person)-[:DIRECTED]->(:Movie where title = "Cloud Atlas")' \
    | kg nodes --stdin --properties --json | jq -r '.[] | .name // .title'
Lana Wachowski
Lilly Wachowski
Tom Tykwer
Cloud Atlas
```

And the refusals, which are half of what it decides:

```console
$ kg nodes match '(:person)'
no such label: person — did you mean Person?

$ kg nodes match '(:Person)-[:DIRECTED]->'
unexpected end of pattern — an arrow needs a node after it

$ kg nodes match '(:Person)-[:directed]->(:Movie)'
no such relation type: directed — did you mean DIRECTED?
```

**Named, not linked:** `tool/tests/batches/13_test.ts`.

## What it returns

**Every matched node's id, deduplicated, one per line** — the same shape as
`nodes list`, for the same reason, and an empty result prints nothing and exits
`0`.

**Flat, and nothing is lost by that.** Returning *which `p` went with which `m`*
looks like the thing a pattern uniquely knows, but the graph already holds it:
`p`'s entry carries `type: DIRECTED, direction: out, neighbour: <m>`. Piped into
`kg nodes --stdin --properties --json`, the subgraph comes back with its edges
attached, and the binding is an index over ids in the consumer. Projection is
`jq`'s, exactly as [batch 11](11-resolution.md) settled.

**So variables are optional, and only ever express a join.** `(:Person)` needs
no name because nothing refers to it. A name earns its place when it appears
twice:

```
(p)-[:ACTED_IN]->(m)<-[:DIRECTED]-(p)      acted in a film they directed
```

There the repetition *is* the predicate.

## The grammar

| in | |
|---|---|
| node pattern | `(`, optional variable, optional `:Label`, optional `where <expression>`, `)` |
| relationship | `-[:TYPE]->`, `<-[:TYPE]-`, `-[:TYPE]-`; the type may be omitted |
| chaining | `(a)-[:X]->(b)-[:Y]->(c)` |
| a variable used twice | a join constraint |
| the condition | [batch 9](9-find.md)'s expression, unchanged — bare names, quoted values |

| out | why |
|---|---|
| `RETURN`, projection | ids one per line; the caller projects |
| aggregates, `WITH`, `ORDER BY` | not selection |
| `OPTIONAL MATCH` | absence is two-valued here; an optional match is where three-valued logic gets in |
| `{title: "Cloud Atlas"}` property maps | a **second** predicate language beside batch 9's, equality-only |
| `*1..3` variable length | below |

**The condition inside the node pattern is a dialect, and named as one.**
openCypher's `NodePattern` is `'(', [Variable], [NodeLabels], [Properties], ')'`
— no `WHERE`. Neo4j 5 added it; openCypher has not. The alternative is worse in
the direction that matters: a condition after the pattern forces **mandatory
variables** and qualified names — `(m:Movie) WHERE m.released > 2000` — where
the whole of batch 9's grammar is built on bare names. That is a deeper
divergence from ourselves than this one is from openCypher, and the rewrite
`(m:Movie where released > 2000)` → `(m:Movie) WHERE m.released > 2000` is one
mechanical pass. What does **not** survive such a pass is a second predicate
language, which is why the property map is out.

Everything else stays inside `UnescapedSymbolicName`, so **no pattern this tool
accepts ever needs a backtick** — batch 12 is what makes that true, and it is
the property that lets a pattern be pasted into a real engine unchanged.

## What validates it

**Question 10 of the guide** — *who directed Cloud Atlas* — which
[batch 11](11-resolution.md) closed in four processes and two `jq` expressions.
Here it is one command and one `jq`, and the expected three names are already
asserted against `movies.cypher` in
[`movies_test.ts`](../../tool/conformance/movies_test.ts).

**Question 12** — *everyone connected to Cloud Atlas*, 10 nodes — exercises the
untyped, undirected form in one pattern:

```bash
kg nodes match '(:Movie where title = "Cloud Atlas")-[]-()'
```

## The sequence

| | | why here |
|---|---|---|
| **1** | the pattern parser — grammar and refusals, no evaluation | every refusal above lands before a file is opened, which is batch 9's rule and is testable with no store |
| **2** | a single node pattern evaluates | at this point `match` answers everything `find` does; nothing is removed yet |
| **3** | the floor — an unknown label or type refuses and names its near neighbour | needs step 2 to have a lookup site; this is the site [batch 12](12-vocabulary.md) had nowhere to put |
| **4** | one relationship, in either direction, typed or not | the first thing `find` cannot do |
| **5** | chaining, and a repeated variable as a join | needs step 4; the only step that needs a notion of binding at all |
| **6** | `find` is removed, the conformance rewritten as patterns | last, so the guide's questions are rewritten **once** rather than at step 2 and again at step 5 |

## What it leaves

**Variable-length paths — `*1..3` — are their own batch, not a refusal.** That
is question 13, *everything three hops from Kevin Bacon*, and it is the one the
guide asks that no fixed pattern expresses. It is answerable today in four
calls, so leaving it out of this batch regresses nothing; what puts it in the
next one is that batch 13's loop already closes without it, and a seventh step
that is a traversal is exactly the size a batch is not allowed to be.

**The semantics are not deferred with it, because they can be settled now.**
Cypher's default, verbatim: *"By default, Cypher will only match a relationship
once inside a single pattern"*, and `REPEATABLE ELEMENTS` *"allows both nodes
and relationships to occur more than once in a given MATCH result"* — so a
**node may be revisited while a relationship may not**, and `ACYCLIC` is what
forbids the node repetition. Adopt the default unchanged, and
termination stops being something the implementation has to guard: a path cannot
be longer than the number of relations in the graph, so the upper bound in
`*1..3` is a filter on length rather than a fuse against looping.

What does not change is the return. `*` widens which nodes are reached; the
output is still their ids, flat, and reachability is still not a route.

**Paths.** Reachability is what this returns; *which route* is not, and a flat
id list cannot carry one. Same deferral, same reason.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · 13
