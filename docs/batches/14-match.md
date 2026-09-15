# Batch 14 — match

**Done when** a pattern selects a subgraph in one command, and `find` is gone —
the command and the grammar behind it.

Needs [batch 12](12-vocabulary.md) for the vocabulary and [batch 13](13-output.md) for the output, in that order. A `match` shipped on the old
vocabulary would have people writing `(:person)-[:acted-in]->`, and every one of
those patterns breaks when the vocabulary lands.

## What it has to fix

**`find` is a second selector with a grammar this project invented.** It reads
well, it was measured against the guide's thirteen questions, and it is still a
private language: `"Person" in labels and released > 2000` has no reader outside
this tool. A pattern says the same thing in a grammar a million queries already
use, and says the structural half — which `find` cannot say at all.

**Following a relation costs a `jq` step.** Questions 4, 10 and 12 of the guide
are answered, but by resolving entries and filtering them by hand. Question 10
is four processes and two `jq` expressions for what is one relationship, and
question 11 is marked *awkward* in `questions.md` because two hops need a
script.

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
[
  {
    "id": "01a09f8b-263b-7033-bab3-3dc6b88b66e7",
    "labels": ["Movie"],
    "links": [ … ],
    "title": "Cloud Atlas"
  },
  …
]

$ kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})' \
    | jq -r '.[] | select(.labels | index("Person")) | .name'
Lana Wachowski
Lilly Wachowski
Tom Tykwer
```

**Four nodes are the subgraph; three names are a projection of it.** The anchor
is in the match because a pattern returns both ends of what it names — that is
the point of it — so asking for one side is the caller's `select`. **That `jq`
is the `RETURN`**, and it is why the grammar does not need one: it says which
side and which field, which is exactly what a `RETURN` says.

And the refusals, which are half of what it decides:

```console
$ kg nodes match '(:person)'
no such label: person — did you mean Person?

$ kg nodes match '(:Person)-[:DIRECTED]->'
unexpected end of pattern — an arrow needs a node after it

$ kg nodes match '(:Person)-[:directed]->(:Movie)'
no such relation type: directed — did you mean DIRECTED?

$ kg nodes match '(:Movie) {released: 2000'
unclosed map — `{` needs a matching `}`

$ kg nodes match '(m:Movie) where m.released > 2000'
a pattern takes no condition — comparison, presence and negation are a `jq`
filter over what this returns, and `design/parked/condition.md` is why

$ kg nodes match 'MATCH (m:Movie) RETURN m'
MATCH is a clause, and this argument is the pattern alone — the command is the
MATCH, and `jq` is the RETURN
```

**The boundary refuses by naming itself.** A reader who knows Cypher writes
`where`, writes `MATCH`, asks for `*1..3` — and each used to answer with the
lexical symptom, *unexpected character: `>`*, or the hyphen rule to someone
asking about traversal. A refusal arrives exactly when the caller needs it,
which is what makes it the right place to hold the line between this tool and
`jq`: a page arrives at the start of a session, before they know they will.

**Backed by** [`14_test.ts`](../../tool/tests/batches/14_test.ts), and by the guide's
questions in [`movies_test.ts`](../../tool/conformance/movies_test.ts).

## What it returns

**The matched subgraph, resolved, as JSON** — every matched node with its
properties and its entries, deduplicated, in the shape
[batch 13](13-output.md) settled. An empty result is `[]` and exits `0`.

**Not ids, because it already has the data.** A pattern is matched by loading
the graph; handing back identities would make the caller parse the same files
again to get what the command had in memory and threw away. Measured on the
movies graph: **161 ms to match, 161 ms to resolve again — twice the work for
the same bytes.** A caller who wants only ids writes `jq -r '.[].id'`, which
costs nothing the command already paid.

**In creation order**, which is `nodes list`'s: an id sorts to the millisecond
because it is a uuid v7. A set has no order of its own, but a transcript does,
so the order is stated rather than left to fall out of whatever the evaluation
visited first.

**No projection, and none is missing.** Returning *which `p` went with which `m`*
looks like the thing a pattern uniquely knows, but the subgraph already carries
it: `p`'s entry is `type: DIRECTED, direction: out, neighbour: <m>`, so the
edges come back attached to the nodes and the binding is an index over ids in
the consumer.

**So variables are optional, and only ever express a join.** `(:Person)` needs
no name because nothing refers to it. A name earns its place when it appears
twice:

```
(p)-[:ACTED_IN]->(m)<-[:DIRECTED]-(p)      acted in a film they directed
```

There the repetition *is* the predicate.

## The grammar

**openCypher's, taken whole rather than paraphrased** — its own productions,
with the noise-only `SP?` removed:

```antlr
Pattern            : PatternPart ( ',' PatternPart )* ;
PatternPart        : ( Variable '=' PatternElement ) | PatternElement ;
PatternElement     : ( NodePattern ( RelationshipPattern NodePattern )* )
                       | ( '(' PatternElement ')' ) ;
NodePattern        : '(' Variable? NodeLabels? Properties? ')' ;
RelationshipDetail : '[' Variable? RelationshipTypes? RangeLiteral? Properties? ']' ;
RelationshipTypes  : ':' RelTypeName ( '|' ':'? RelTypeName )* ;
NodeLabels         : NodeLabel ( NodeLabel )* ;
Properties         : MapLiteral | Parameter ;
```

| in | |
|---|---|
| `(m:Movie)` | a node, its variable and its labels both optional |
| `(:Person:Director)` | several labels, **conjunctive** — `NodeLabels` is a repetition |
| `{title: "Cloud Atlas"}` | equality on properties, on a node **or** a relationship |
| `-[:DIRECTED]->` `<-[:DIRECTED]-` `-[:DIRECTED]-` | out, in, either way |
| `-[:ACTED_IN\|DIRECTED]->` | alternation of types |
| `-[r:ACTED_IN]->` | a relationship variable |
| `(a)-[:X]->(b), (b)-[:Y]->(c)` | several parts, which a single chain cannot express once a node has three edges in the pattern |
| `((a)-[:X]->(b))` | a parenthesised element |
| a variable used twice | a join constraint |

| out | why |
|---|---|
| `Where` | [parked](../design/parked/condition.md) — below, and it is a deferral rather than a decision |
| `RETURN`, projection | the piped `jq` is the `RETURN` — see above |
| aggregates, `WITH`, `ORDER BY` | the tool composes by pipes; putting them in the language is a second path to the same thing |
| `OPTIONAL MATCH` | it produces nulls, and absence here is two-valued — [absence](../design/absence.md) |
| `Parameter` in `Properties` | a pattern is one shell argument; there is nowhere for a parameter to come from |
| `Variable '=' PatternElement` — a path variable | a path is not what this returns, and [what it leaves](#what-it-leaves) says why |
| `RangeLiteral` — `*`, `*2`, `*..3`, `*1..3` | below |

Everything stays inside `UnescapedSymbolicName`, so **no name in a pattern ever
needs quoting** — [batch 12](12-vocabulary.md) made that true, and the reason is
[naming](../design/naming.md)'s own: a word two people must reach independently
cannot be one that needs quotes.

**What is borrowed is a grammar, not a promise.** This is openCypher's shape
because a great many readers already know it — measured, and the reason batch 12
took its vocabulary. It is not a conformance claim: nothing here undertakes that
a pattern written for `kg` runs elsewhere, and a later one will break it
deliberately where a property path is wanted. A divergence that fails at the
other parser is the kind to want; one that parses there and means something else
is not.

## What a match means

Two semantic rules, neither in the grammar, both openCypher's unchanged.

**A relationship binds at most once within one pattern.** Verbatim: *"By default,
Cypher will only match a relationship once inside a single pattern."* That rule
is what makes the guide's question 11 answerable:

```bash
kg nodes match '(:Person {name: "Tom Hanks"})-[:ACTED_IN]->(:Movie)<-[:ACTED_IN]-(:Person)'
```

Without it the second hop could return along the first edge, and Tom Hanks would
be his own co-actor. What that costs is measured under *What validates it*: it
is not the count of people, which the anchor already explains, but a film
leaving the subgraph when its only actor is the one the walk arrived from.

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

## What it costs

```
kg nodes list     reads the directory. Parses nothing
kg nodes match    parses every node and every link record
```

Two tiers, and the action names which — the line [batch 9](9-find.md) drew when
it made `find` an action rather than a flag, *because a flag would hide a
thousandfold cost behind an option*.

**Flat, and that is a property rather than a concession.** A pattern is matched
over an adjacency list, and building one means reading the store — so the cost
does not depend on the pattern's shape, and the worst case *is* the ordinary
case. Nothing degenerates, and nothing has to be explained.

Measured on the movies graph: **424 files, 171 ms**, 96 KB of resolved JSON at
578 bytes a node. That is the same work
`kg nodes list | kg nodes --stdin --properties` already does, which is why
`match` adds no cost class — it moves the join into the process that had the
data in memory anyway.

**The second read is not optional, and the reason is on disk.** A node's entry
is `{type, link, direction}`: `link` is the **record's** id, not the
neighbour's. `neighbour` is added at read time by
[batch 11](11-resolution.md)'s resolution. So a relationship cannot be followed
from a node alone.

**Where the cost actually is: parsing, not reading.** Reading all 424 files
takes **10 ms** against **143 ms** of work — **93% is parsing**, 7% is I/O. Two
levers follow, and both are parked rather than built: a reader that takes
`labels` and `links` without parsing an author's properties, and
[label-index](../design/parked/label-index.md), which would turn the entry point
from *parse every node* into *read one file*. `design/parked/query-language.md`
reasons in bytes and file reads and points at neither.

**The anchor is a join order, not a cost.** Which node pattern the matcher
enters at decides how much pointer-chasing it does in memory, and nothing about
how many files it opens. It earns a decision the day the index above exists;
until then, entering at the most constrained position is free to do and changes
nothing measurable.

## What validates it

**Question 10 of the guide** — *who directed Cloud Atlas* — which
[batch 11](11-resolution.md) closed in four processes and two `jq` expressions.
Here it is one command and one `jq`, the `jq` above, and the expected three
names are already asserted against `movies.cypher` in
[`movies_test.ts`](../../tool/conformance/movies_test.ts).

**Question 11** — *Tom Hanks' co-actors*, 34 — is the one `questions.md` marks
**awkward**, because two hops took a script. It becomes the single pattern in
*What a match means*, and it is what exercises relationship uniqueness — though
not in the way this page first claimed.

**Measured, and the claim was wrong.** The pattern returns 35 people, and 35 is
34 plus the anchor: that is the subtraction every guide answer needs, not the
rule. What the rule actually changes is the **films**:

| | |
|---|---|
| films Tom Hanks acted in | **12** |
| films the two-hop pattern returns | **11** |
| the missing one | *The Polar Express*, where he is the only actor |

With the rule, the third position on that film can only bind Tom Hanks along
the edge already walked, so the pattern has no solution there and the film
leaves the subgraph. Without it the film would stay. The node set is what
changes, and it changes where a relation has nowhere else to go.

**Question 12** — *everyone connected to Cloud Atlas*, 10 — exercises the
untyped, undirected form:

```bash
kg nodes match '(:Movie {title: "Cloud Atlas"})-[]-()' \
  | jq -r '.[] | select(.title != "Cloud Atlas") | .name'
```

**Both guide answers are the match minus its anchor**, and that is arithmetic
rather than a discrepancy: 4 nodes for 3 directors, 11 for 10 neighbours. Every
question in the guide asks for one side of a relation, while the command returns
the relation. Naming the subtraction is the honest way to use them as
validators — hiding it inside a `.name // .title` that happens to print whatever
field exists is how this page first got the counts wrong.

## What `find` takes with it

The command goes, and so does the grammar under it — `expression.ts`,
`expression_test.ts` and the evaluator, 435 lines. **Not extended, deleted.**
Grafting qualified names onto a home-grown expression to make it serve a
pattern would have built a hybrid that is neither; openCypher has its own
`Expression`, and [condition](../design/parked/condition.md) is where that one is argued.

Four of the conformance's seven selections are patterns already:

| `find` | becomes |
|---|---|
| `'"Person" in labels'` | `(:Person)` |
| `'"Movie" in labels'` | `(:Movie)` |
| `'title = "Cloud Atlas"'` | `({title: "Cloud Atlas"})` |
| `'name = "Tom Hanks"'` | `({name: "Tom Hanks"})` |
| `'released > 2000'`, `'released > 2010'`, `'…and…'` | a `jq` `select` |

**The three comparisons are the interim cost, and it is an interim.** Until
`where` lands they are a `select` over the resolved array, which is one line
rather than the eleven a pattern costs in `jq` today. `jq`'s load across the
thirteen questions goes down, not up: four questions lose their script or their
join entirely, six keep the filter they already had, and none gains work.

**Batch 9's loop still closes, in a different spelling.** Its *done when* is
*you can ask which nodes match a condition over their properties*, and
`match '({title: "Cloud Atlas"})'` still does that for equality, with the rest
left to [condition](../design/parked/condition.md). So [`9_test.ts`](../../tool/tests/batches/9_test.ts) is
rewritten rather than retired, and [9-find.md](9-find.md) says what replaced it.

## The sequence

| | | why here |
|---|---|---|
| **1** | the pattern parser — grammar and refusals, no evaluation | every refusal above lands before a file is opened, which is batch 9's rule and is testable with no store |
| **2** | a single node pattern evaluates — labels and map | at this point `match` answers four of the conformance's seven selections; nothing is removed yet |
| **3** | the floor — an unknown label or type refuses and names its near neighbour | needs step 2 to have a lookup site; this is the site [batch 12](12-vocabulary.md) had nowhere to put. Both halves read a directory, because 12 gave a relation type the same store a label has — without it this step would scan every link record to learn the vocabulary |
| **4** | one relationship — direction, type alternation, its own map and variable | the first thing `find` cannot do |
| **5** | chaining, several parts, and a repeated variable as a join | needs step 4; the only step that needs a notion of binding at all. The anchor is chosen here, because before it there is one node pattern and nothing to choose between |
| **6** | `find` and the expression are removed; the conformance and `9_test.ts` rewritten | last, so the guide's questions are rewritten **once** rather than at step 2 and again at step 5 |

**The near neighbour is the slug.** `person` folds to `person.md`, which holds
`Person` — one file read, no distance metric, and a word whose fold names
nothing simply gets `no such label: Persn`.

**And `vocabulary.ts` needs one read-only addition for it.** `read` answers
`absent` when the slug holds a different word, deliberately — asking about
`sci_fi` must not come back with `SciFi`'s description — so it cannot say who
holds the file. `ensure` knows, and writes. Step 3 adds the reader that only
looks: *which word holds this word's slug*.

## What it leaves

**The `where` clause — [parked](../design/parked/condition.md), and a deferral rather than a decision.** The
condition is a `jq` `select` in the meantime, and the page's transcripts say so
where it would go. This is written down because this repository has twice let an
interim read as doctrine: [batch 9](9-find.md) wrote *Traversal — deliberately
never grows* and [batch 11](11-resolution.md) wrote *a label word does not
move*, and both needed a note added afterwards when a later batch reversed them.

What it would implement is openCypher's `Expression`, not a return of ours —
which is also what brings the **pattern predicate**, `where not (p)-[:PARTY_TO]->(:Crime)`.
Measured on 39 queries from two of Neo4j's example datasets, that shape is 6 of
the 23 `WHERE` conditions and a plain property comparison is 1, so it is the
dominant real use rather than a corner. It costs no new engine: the same
fixed-pattern matcher, asked for existence with one variable already bound. And
under a closed world `not (pattern)` is total — no third value — which is where
[absence](../design/absence.md) pays for itself a second time.

**Variable-length paths — `*1..3`.** That is question 13, *everything three hops
from Kevin Bacon*, and it is the one the guide asks that no fixed pattern
expresses. It is answerable today in four calls, so leaving it out regresses
nothing; what puts it in its own batch is not a step count but a kind — every
step above is a parser or a lookup, and this one is a traversal engine.

`RangeLiteral` has four forms, not one: `*` unbounded, `*2` exactly two, `*..3`
up to three, `*1..3` between. The syntax is a line; what it needs behind it is
the thing.

**Its semantics are settled above rather than deferred with it**, and they are
what makes a traversal terminate: a relationship binds at most once, so a path
cannot be longer than the number of relations in the graph, and the bound in
`*1..3` filters a length rather than serving as a fuse against looping.

**Paths.** Reachability is what this returns; *which route* is not, and a flat
id list cannot carry one. Same deferral, same reason — and it is why the path
variable `p = (a)-[:X]->(b)` is out of the grammar above: a set of nodes cannot
carry a route, whatever shape it is printed in.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · [13](13-output.md) · 14
