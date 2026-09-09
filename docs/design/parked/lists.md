# Multiplicity on a dimension

> **Answered.** `auth in labels`, in the expression
> [search](search.md) describes. This page keeps the argument that got there,
> because it decides more than the operator's name.

## A list-valued property is not a container

`labels: [auth, pattern]` is the node saying two things on one dimension, the
way `kind: decision` says one. Nothing is holding anything: the list is how
multiplicity is stored, not what is meant.

That reading does the work in three places.

**It settles what the tool must not do.** *Does this node carry `auth` on the
`labels` dimension* is one question, and it stays one question whether the
dimension holds one value or several. So a single operator spanning both is not
obviously wrong — which is why it took a defect to see that it is.

**It is why the operator cannot infer.** If one predicate spanned both, `labels
= auth` against a list would answer *no match* where it means *wrong question* —
and that is the exact failure [batch 4](../../batches/4-stops-guessing.md)
removed `--where` for producing. Same shape, same silence, one layer up.

So the shape is declared by the operator instead: `=` compares a value, `in`
asks about membership, and each refuses the other's operand. Nothing is
inferred from what happens to be on disk.

**And it is why `contains` was the wrong word all along.** A container holds
elements; a dimension carries values. Every query language spells membership
`in` and keeps *contains* for text, and the metaphor is the reason — see
[search](search.md), where `contains` is finally free for the thing that really
does contain something.

## How long it took to see

Five reversals in one sitting. `--contains` was invented for this, given `-any`
and `-all` suffixes to disambiguate multiple values, reclaimed for the body once
*contains* turned out to read as prose, and finally dropped for `in`.

Every one of those rounds was arguing whether repeating a flag conjoined and
whether values inside one flag unioned — grammar questions, asked one binary
decision at a time. What ended it was not a better flag name. It was noticing
that a grammar answers them once.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
