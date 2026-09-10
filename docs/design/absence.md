# A property is absent, and that is all it means

There is exactly one way for a node not to carry something: the key is not
there. No null, no empty marker, no second kind of nothing. This argues why one
is the right number here — a **choice**, with a name and a price, not something
the format forced.

## The choice has a name: the closed world

Absence reads as false and `not` flips it. That is the **Closed World
Assumption** (Reiter, *On Closed World Data Bases*, 1978), implemented as
**negation as failure** (Clark, 1978). `not retired` means *the corpus does not
say retired* — never *retired is false*. It is the semantics of Datalog, Prolog
and ordinary database query answering, so the company is orthodox rather than
eccentric.

**It is not entailed by having no schema.** An earlier version of this page
argued that it was, and that was wrong — the two axes are independent:

| | two-valued | three-valued |
|---|---|---|
| schema'd | Date & Darwen's null-free model, via 6NF | SQL |
| schemaless | Datalog, Prolog — and this tool | **SPARQL**, **Cypher** |

RDF has no slots whatever, and SPARQL still evaluates `FILTER` three-valued with
*error* as the third value, so `FILTER(?x > 5)` and `FILTER(!(?x > 5))` both drop
an unbound solution. Cypher deletes a property when it is set to null — exactly
this tool's storage model — and is three-valued regardless. Slotlessness neither
entails two-valued logic nor argues for it.

Nor is *unknown* beyond a schemaless store's reach: Wikidata says both
`somevalue` and `novalue` at statement level, with no schema anywhere.

## Why it is the right choice anyway

**Three-valued logic is not the principled alternative it appears to be.**
Libkin proved SQL's version does not compute certain answers correctly — it
returns answers that are not certain, and misses ones that are (*SQL's
Three-Valued Logic and Certain Answers*, TODS 41(1), 2016). The real theory of
incomplete information is conditional tables (Imieliński & Lipski, JACM 1984),
which three values approximate badly. Declining it forfeits no rigour.

**And no expressive power is lost.** Kleene's strong three-valued logic is not
functionally complete: no combination of `and`, `or` and `not` can test for the
third value, since all three are monotone. That is why SQL needs `IS NULL` — a
mandatory escape hatch rather than a wart. This tool has the same escape hatch
already, because key presence is directly testable. Same completeness, one truth
value fewer.

**The sprawl is what the other road actually costs.** `IS NULL`, `COALESCE`,
`NULLIF`, `NULLS FIRST/LAST`, `IS DISTINCT FROM`, `UNIQUE NULLS NOT DISTINCT`,
and a per-aggregate rule about skipping. SQL's null is three-valued in
comparison yet value-like in grouping, sorting and duplicate elimination, and it
is that incoherence rather than any one operator that Date and Darwen indict.

## The price, named

**Non-monotonicity.** Adding a node can falsify an answer already given — `not
owner` was true of a node until someone wrote an owner. Nothing concluded under
a closed world is stable as the graph grows, and for a corpus written by hand
over time, where absence usually means *not written down yet*, that is the
sharpest objection there is. It is why RDF and OWL chose the open world.

Three consequences, stated rather than discovered:

**A closed-world answer is safe to act on and unsafe to store.** Materialising
one — writing *these twelve decisions have no owner* into a node — bakes in a
fact the next commit may contradict.

**`not` does not distribute into a comparison.** `not (score > 0.7)` includes a
node with no score; `score <= 0.7` does not.

**A mistyped name is indistinguishable from an absence.** `scroe: 9` is a node
lacking `score`, and every query agrees. A schema'd store fails fast on an
unknown column and this one cannot — the standing complaint against every
schemaless store, and it is about names rather than values.

## What JavaScript got wrong, and it is not having two

JavaScript has two absences, split on *who caused it*: `undefined` is the system
saying nothing is here, `null` is the author saying it. The axis is
documentary — and no operator derives anything from it:

| | `null` | `undefined` |
|---|---|---|
| `>= 0` | **true** | false |
| default parameter | passes through | takes the default |
| `JSON.stringify` | kept | dropped |
| `??` · `?.` · `==` | *identical* | *identical* |

Half the language treats them as one thing and half as two, and the half that
separates them does so on no principle: `null >= 0` is true because `null`
coerces to zero, which has nothing to do with who wrote it.

So the failure is not the count. It is splitting absence along an axis with no
logical consequence, while lacking the one that has consequences. A schema is
what makes a single absence sufficient — with a declared slot, *who left it
empty* carries no information, which is why SQL needs no second marker and
happily lets an author write `NULL` directly. Without that anchor, JavaScript
reached for intent as a substitute, and intent does not propagate.

A tempting shorthand — *SQL's `NULL` is `undefined` plus a schema* — does not
survive contact. Most nulls a query meets were **made by operations**, not left
in a declared slot: an outer join fabricates them, `MAX` over an empty set
returns one, a `CASE` with no matching branch yields one. The missing conjunct
is **propagation**, and propagation is what produces three-valued logic,
independently of any schema.

Which is this tool's warning too. The day it aggregates, or traverses
optionally, it meets the same question — *what is the average confidence over
nodes citing X, when nothing cites X?* — and having no schema will not answer it.

| | absences | split on | does the split propagate? |
|---|---|---|---|
| SQL | 1 | schema's promise vs the data | yes — that is its logic |
| JavaScript | 2 | who caused it | **no** |
| TypeScript | 2, now mandatory | who caused it, checked early | no — erased before evaluation |
| here | 1 | — | — |

**TypeScript does not move that row, and it is worth saying why**, because it
looks like it should. Its schema constrains what may be written and is gone
before anything runs — a value typed `number | null` still compares `null >= 0`
as true and `null > 0` as false. SQL's schema is present *at evaluation*, which
is the only place an absence rule can be enforced.

It also models the split rather than healing it: `string | null` and
`string | undefined` stay distinct, so strict checking makes the inherited
distinction mandatory instead of removing it. And `a?: string` cannot separate
*key absent* from *key present holding undefined* without a compiler flag —
the instance/schema line resurfacing inside the type system.

The two are not the same kind of schema. SQL's **guarantees slots**, so absence
has one degree of freedom. TypeScript's **describes which slots may be absent**,
which is a faithful description of the mess rather than an anchor against it.

This is why the tool is written in TypeScript and still validates at runtime:
`frontmatter.ts` refuses YAML null because node files arrive from disk, and
[`spec/api.md`](../spec/api.md)'s argument shapes are checked because argv
arrives from the shell. Both are boundaries a compile-time schema never reaches.

## Nothing-as-a-value stays expressible

The refusal is of a second *absence*, never of the intent behind one:

```
kind: null   refused    an author may not write an absence
kind: ~      refused    nor spell one differently
kind:        refused    nor by leaving it blank
kind: ""     accepted   an author may write nothing as a value
```

An empty string is a value. It compares, sorts and matches like every other
value, and a query asking for it gets a straight answer. What it never becomes
is a hole that comparison has to route around — which is the whole difference,
and why the line sits here rather than one step earlier.

## Where the missing level actually lives

A practice supplies what the substrate will not. *Every decision carries a
`valid-until`* is a schema claim, and a practice can look for its violations by
narrowing first — asking for decisions, then for the ones lacking the key. The
substrate answers both halves without learning why either matters.

**But that is detection, not a schema.** Such a question is evaluated after
resolution, node by node, against whatever exists at that moment. The
universally quantified claim is nowhere: not stored, not checked for coherence,
and not applied to a node written a minute later. It lives only in whoever
asked. Where a generalisation could be held is the open question in
[parked/validation.md](parked/validation.md), and this is the sharpest statement
of what is missing from it.

The consequence for the tool is small and worth naming: **absence is decided by
looking, never by inference.** An evaluator that writes a comparison the natural
way inherits the host language's answer — and in JavaScript `undefined > 0` and
`undefined <= 0` are both false, which is the right result reached for the wrong
reason. Presence is checked because it is a fact, not because a coercion happens
to agree.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · [vocabulary](vocabulary.md) · [structure](structure.md) · absence · [parked](parked/)
