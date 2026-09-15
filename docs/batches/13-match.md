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
| `find '"Movie" in labels'` | 38 | 250 | **0** |
| the pattern `(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})` | 4 | 29 | 6 |

A predicate selects nodes that happen to have edges; a pattern selects **both
ends of every relation it names**. Those 6 are the three `DIRECTED` relations
seen from each end — the pattern closes what it names, and nothing more. The
other 23 still dangle, which is correct: a selection closed over *every* edge
would be the whole connected component.

## What it should look like

```console
$ kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})'
01a09f8b-263b-7033-bab3-3dc6b88b66e7
01a09f8b-2b41-7e70-9a4b-6a4d3d2f1c88
01a09f8b-3102-7a55-8f3e-1b2c9e7a4d10
01a09f8b-54a0-7cb0-beec-5e78f58b4686

$ kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})' \
    | kg nodes --stdin --properties --json \
    | jq -r '.[] | select(.labels | index("Person")) | .name'
Lana Wachowski
Lilly Wachowski
Tom Tykwer
```

**The four ids are the subgraph; the three names are a projection of it.** The
anchor is in the match because a pattern returns both ends of what it names —
that is the point of it — so asking for one side is the caller's `select`.
**That `jq` is the `RETURN`**, and it is why the grammar does not need one: it
says which side and which field, which is exactly what a `RETURN` says.

And the refusals, which are half of what it decides:

```console
$ kg nodes match '(:person)'
no such label: person — did you mean Person?

$ kg nodes match '(:Person)-[:DIRECTED]->'
unexpected end of pattern — an arrow needs a node after it

$ kg nodes match '(:Person)-[:directed]->(:Movie)'
no such relation type: directed — did you mean DIRECTED?

$ kg nodes match '(:Movie) where released > 2000'
not a name: released — a condition after the pattern names which node it is
about, as `m.released`
```

**Named, not linked:** `tool/tests/batches/13_test.ts`.

## What it returns

**Every matched node's id, deduplicated, one per line** — the same shape as
`nodes list`, for the same reason, and an empty result prints nothing and exits
`0`.

**In the natural order**, which is `nodes list`'s: an id sorts into creation
order, to the millisecond, because it is a uuid v7. A set has no order of its
own and a caller piping into `kg nodes --stdin` does not need one — but a
transcript does, or it is flaky, so the order is stated rather than left to fall
out of whatever the evaluation happened to visit first.

**And no `--json`.** `kg nodes find` carries the flag and nothing here replaces
it. A list of uuids is already shell-shaped, so wrapping it in an array adds a
format without adding a fact — and `jq -R` is right there for a caller who wants
one.

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

**openCypher's, taken whole rather than paraphrased** — these are its own
productions, with the noise-only `SP?` removed:

```antlr
NodePattern        : '(' Variable? NodeLabels? Properties? ')' ;
RelationshipDetail : '[' Variable? RelationshipTypes? RangeLiteral? Properties? ']' ;
RelationshipTypes  : ':' RelTypeName ( '|' ':'? RelTypeName )* ;
NodeLabels         : NodeLabel ( NodeLabel )* ;
Properties         : MapLiteral | Parameter ;
Match              : ( OPTIONAL )? MATCH Pattern ( Where )? ;
Where              : WHERE Expression ;
```

| in | |
|---|---|
| `(m:Movie)` | a node, its variable and its labels both optional |
| `(:Person:Director)` | several labels, **conjunctive** — `NodeLabels` is a repetition |
| `{title: "Cloud Atlas"}` | equality on properties, on a node **or** a relationship |
| `-[:DIRECTED]->` `<-[:DIRECTED]-` `-[:DIRECTED]-` | out, in, either way |
| `-[:ACTED_IN\|DIRECTED]->` | alternation of types |
| `-[r:ACTED_IN]->` | a relationship variable, so a `where` can reach its properties |
| `(a)-[:X]->(b)-[:Y]->(c)` | chaining |
| a variable used twice | a join constraint |
| `where <expression>` | **one clause, after the whole pattern** |
| `m.released` | a qualified name, which the expression gains here |

| out | why |
|---|---|
| `RETURN`, projection | the piped `jq` is the `RETURN` — see above |
| aggregates, `WITH`, `ORDER BY` | the tool composes by pipes; putting them in the language is a second path to the same thing |
| `OPTIONAL MATCH` | it produces nulls, and absence here is two-valued — [absence](../design/absence.md) |
| `Parameter` in `Properties` | a pattern is one shell argument; there is nowhere for a parameter to come from |
| `RangeLiteral` — `*`, `*2`, `*..3`, `*1..3` | below |

**The condition goes after the pattern, not inside a node.** An earlier draft of
this page put it inside — `(m:Movie where released > 2000)` — to keep
[batch 9](9-find.md)'s bare names, and called the divergence a dialect. Taking
openCypher whole costs a variable and a qualified name on comparisons, and buys
three things:

- **The map absorbs the common case.** Measured on 39 queries from two of
  Neo4j's own example datasets: 25 use an inline map, and only 6 of the 23
  `WHERE` conditions are a property predicate on a single node. So the
  variable-and-qualification cost is paid on a minority of patterns, not on
  most of them.
- **One condition can relate two nodes.** `where p.born < m.released` has no
  spelling at all when each condition sees only its own node. Rare — 2 of those
  23 — but a ceiling the inline form cannot be lifted past.
- **It is what the writer already emits.** A reader trained on Cypher writes the
  trailing clause without being told; the inline form has to be taught each
  time, and the measured gap between *the request matches the schema* and *the
  writer must guess it* is 89% against 17%.

Everything stays inside `UnescapedSymbolicName`, so **no pattern this tool
accepts ever needs a backtick** — [batch 12](12-vocabulary.md) is what made that
true, and it is the property that lets a pattern be pasted into a real engine
unchanged.

## What a match means

Two semantic rules, neither of them in the grammar, both openCypher's unchanged.

**A relationship binds at most once within one pattern.** Verbatim: *"By default,
Cypher will only match a relationship once inside a single pattern."* That rule
is what makes the guide's question 11 answerable:

```bash
kg nodes match '(:Person {name: "Tom Hanks"})-[:ACTED_IN]->(:Movie)<-[:ACTED_IN]-(:Person)'
```

Without it the second hop could return along the first edge, and Tom Hanks would
be his own co-actor. The expected answer is 34 **because** the rule holds.

**A node may bind more than once.** `REPEATABLE ELEMENTS` *"allows both nodes and
relationships to occur more than once"* and `ACYCLIC` forbids the node half, so
the default permits it. It is what makes a self-loop expressible:

```bash
kg nodes match '(d:Decision)-[:SUPERSEDES]->(d)'
```

A decision replacing itself — a data error findable only if a pattern may bind
one node twice. The same permission bites the other way, and is worth knowing
rather than discovering: in `(p:Person)-[:KNOWS]-(friend)`, `friend` may be `p`.

A variable used twice is a different thing from a node binding twice: the first
is a constraint the author wrote, the second is what the engine is allowed to do
with two separate variables.

## What validates it

**Question 10 of the guide** — *who directed Cloud Atlas* — which
[batch 11](11-resolution.md) closed in four processes and two `jq` expressions.
Here it is one command and one `jq`, the `jq` above, and the expected three
names are already asserted against `movies.cypher` in
[`movies_test.ts`](../../tool/conformance/movies_test.ts).

**Question 12** — *everyone connected to Cloud Atlas*, 10 nodes — exercises the
untyped, undirected form:

```bash
CA=$(kg nodes match '(:Movie {title: "Cloud Atlas"})')
kg nodes match '(:Movie {title: "Cloud Atlas"})-[]-()' \
  | kg nodes --stdin --properties --json \
  | jq -r --arg anchor "$CA" '.[] | select(.id != $anchor) | .name // .title'
```

**Both guide answers are the match minus its anchor**, and that is arithmetic
rather than a discrepancy: 4 ids for 3 directors, 11 for 10 neighbours. Every
question in the guide asks for one side of a relation, while the command returns
the relation. Naming the subtraction is the honest way to use them as
validators — hiding it inside a `.name // .title` that happens to print whatever
field exists is how this page first got the counts wrong.

## The sequence

| | | why here |
|---|---|---|
| **1** | the pattern parser — grammar and refusals, no evaluation | every refusal above lands before a file is opened, which is batch 9's rule and is testable with no store |
| **2** | a qualified name in the expression — `m.released` | [batch 9](9-find.md)'s grammar is built on bare names, and a condition after the pattern has to say which node it is about. Self-contained, and testable without a pattern |
| **3** | a single node pattern evaluates — labels, map, `where` | needs step 2 for the condition; at this point `match` answers everything `find` does, and nothing is removed yet |
| **4** | the floor — an unknown label or type refuses and names its near neighbour | needs step 3 to have a lookup site; this is the site [batch 12](12-vocabulary.md) had nowhere to put. Both halves read a directory, because 12 gives a relation type the same store a label has — without it this step would scan every link record to learn the vocabulary, and only the label half would be free |
| **5** | one relationship — direction, type alternation, its own map and variable | the first thing `find` cannot do |
| **6** | chaining, and a repeated variable as a join | needs step 5; the only step that needs a notion of binding at all |
| **7** | `find` is removed, the conformance and `9_test.ts` rewritten as patterns | last, so the guide's questions are rewritten **once** rather than at step 3 and again at step 6 |

**Batch 9's loop still closes, in a different spelling.** Its *done when* is
*you can ask which nodes match a condition over their properties*, and
`match '(m) where m.released > 2000'` still does that — so
[`9_test.ts`](../../tool/tests/batches/9_test.ts) is rewritten rather than
retired, and [9-find.md](9-find.md) gains the note that 13 replaced the command
without replacing the question.

## What it leaves

**Variable-length paths — `*1..3` — are their own batch, not a refusal.** That
is question 13, *everything three hops from Kevin Bacon*, and it is the one the
guide asks that no fixed pattern expresses. It is answerable today in four
calls, so leaving it out of this batch regresses nothing; what puts it in the
next one is not a step count but a kind — every step above is a parser or a
lookup, and this one is a traversal engine.

`RangeLiteral` has four forms, not one: `*` unbounded, `*2` exactly two, `*..3`
up to three, `*1..3` between. The syntax is a line; what it needs behind it is
the thing.

**Its semantics are settled above rather than deferred with it**, and they are
what makes a traversal terminate: a relationship binds at most once, so a path
cannot be longer than the number of relations in the graph, and the bound in
`*1..3` filters a length rather than serving as a fuse against looping.

What does not change is the return. `*` widens which nodes are reached; the
output is still their ids, flat, and reachability is still not a route.

**Paths.** Reachability is what this returns; *which route* is not, and a flat
id list cannot carry one. Same deferral, same reason.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · 13
