# Filtering a list by value

`add` and `remove` ship in [batch 3](../../batches/3-lists.md). Asking *which
nodes carry `auth`* does not, and it is the obvious next question.

## Why it waits

The predicate is easy; naming it took five reversals in one sitting.
`--contains` was invented for it, given `-any` and `-all` suffixes to
disambiguate multiple values, then taken away entirely once *contains* turned
out to belong to the body — see [search](search.md). A vocabulary that moves
that much in an hour is being discovered, not refined.

So the flags that survived churn are the ones that ship, and this one has not
stopped moving.

## The shape, as far as it got

**One question over two representations.** *Does this node carry `auth` on the
`labels` dimension* is the same question whether the dimension holds one value
or several — so it is not two meanings of an operator, and `--where` handling
both is not the overloading it first looks like.

A list-valued property is **multiplicity on a dimension**, not a container
holding elements. `labels: [auth, pattern]` is the node saying two things on one
dimension, the way `kind: decision` says one. That reading is what makes
`contains` the wrong word for it and `--where` the plausible right one.

**What it would break.** Nothing silently — `--where labels=auth` against a list
currently refuses, so gaining membership semantics only turns a refusal into an
answer.

**What it would lose.** Asking *is this list exactly `[auth]`* becomes
inexpressible. Nothing wants it, and it would be a different predicate with its
own name.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
