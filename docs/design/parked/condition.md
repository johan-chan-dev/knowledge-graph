# The condition

```
kg nodes match '(m:Movie) where m.released > 2000'
```

**What [batch 14](../../batches/14-match.md) leaves out**, and the next thing
that would shrink what `jq` has to do.

## It is openCypher's `Expression`, not a return of ours

Batch 9 built one — bare names, quoted values, `and` / `or` / `not` / `in`,
comparison by an operator that declares its own literal. Batch 14 deletes it
with `find`, and the deletion is the point: grafting qualified names onto a
home-grown expression so it could serve a pattern would have built a third
thing, neither openCypher's nor ours, and it would have had to be unbuilt when
the real one arrived.

So the shape is fixed before anything is written:

```antlr
Where      : WHERE Expression ;
Match      : MATCH Pattern ( Where )? ;
```

**One clause, after the whole pattern.** That is what forces a variable where
there is a condition, and a qualified name — `m.released`, `oC_PropertyLookup`
being `'.' PropertyKeyName`. Batch 14 measured the cost of that and found it
smaller than it looks: on 39 queries from two of Neo4j's example datasets, 25
constrain with an inline map and only 6 of 23 `WHERE` conditions are a property
predicate on one node.

## The pattern predicate is the reason to build it

Of those 23 conditions, **6 are a pattern** — `NOT (p:Person)-[:PARTY_TO]->(:Crime)`,
`NOT EXISTS{ (u)-[:RATED]->(rec) }` — against **1** plain comparison. It is the
backbone of every recommendation (*what they have not seen*) and every
investigation (*keeps company with the guilty without being*), and it is the one
shape a pattern language cannot say without it: chaining does not negate.

**It costs no new engine.** It is batch 14's fixed-pattern matcher, asked for
existence rather than for bindings, with one variable already bound.

And under a closed world `not (pattern)` is **total** — the pattern matches or
it does not, with no third value. This is where SQL reaches for `NOT EXISTS` and
SPARQL for `OPTIONAL` + `!BOUND`, and where [absence](../absence.md) pays for
itself a second time.

## What it is blocked on

Nothing but a caller. The interim — a `jq` `select` over the resolved subgraph —
is one line, and batch 14 measured that `jq`'s total load goes **down** when
match ships: four of the guide's thirteen questions lose their script or their
join outright, six keep the filter they already had, none gains work.

So the trigger is the third time someone writes the same `select` by hand, not
the syntax being available.

## What it does not settle

`Expression` in openCypher is large — function calls, list comprehensions,
`CASE`, `IN` over a list, string operators like `CONTAINS`. Measured on the same
corpus, 10 of the 23 conditions use one. A batch that builds *the clause* is not
the same as one that builds all of that, and which subset earns its place is the
question this page does not answer.

[comparison](comparison.md) settled the operator semantics already — a value
that will not take its operator's type simply does not match — and those rules
are binding on whatever arrives here.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
