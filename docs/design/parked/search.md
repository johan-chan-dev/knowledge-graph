# Searching

Retrieval over prose, and presence tests over properties. Designed 2026-09-08,
built by nothing.

```
kg nodes list --contain-expression <regex>     the body matches
kg nodes list --contain-properties <names>     these properties are present
kg nodes list --without-properties <names>     none of these are
```

## What *contains* means, and where it belongs

There are four things that could be the container, and a filter can be written
at any of them:

| | contains what |
|---|---|
| the space | nodes |
| the node | properties |
| a property's value | several values |
| the value | characters |

**The bottom rung is the one people mean.** Asked *does this node contain
`auth`*, a reader of a knowledge tool reads it as *does its prose*. Spending the
word on list membership steals it from its obvious sense — the same reservation
[`find`](../../spec/api.md) gets for retrieval.

**And *contains* is presence, not comparison.** *Contains X* asks whether X is
there; it does not compare a key to a value. That is what separates this family
from `--where`, and what caught a defect in the shipped surface: `--where
<name>` with no operator was a presence test wearing a comparison word, so it
was removed in [batch 3](../../batches/3-lists.md).

So each flag here names its own target and asks only about presence. No flag
scopes another, and all of them are cumulative with `--where` and each other,
by the rule that every filter conjoins.

## Rules, not questions

**Names may share a flag; values may not.** `--contain-properties "kind
valid-until"` is safe space-delimited because a property name is a token —
`[a-z0-9]+(-[a-z0-9]+)*` — and cannot contain a space. The same delimiter over
*values* is what was rejected, since a value is arbitrary text and `cite: Smith,
J.; Jones, A.` is legal. Same reasoning, opposite conclusion, because the two
live under different rules.

**A pattern that will not compile refuses before a file is opened**, at exit
`1`, by the rule that validation precedes lookup. The flavour is whatever
`RegExp` the runtime provides — a fact to state, not a choice.

**A pathological pattern can hang.** Filtering already opens every node; a regex
over every body is the first thing here that can fail to terminate rather than
merely be slow, and Deno offers no regex timeout. There is no non-backtracking
engine without a dependency, so this is recorded rather than solved.

**`--contain-expression` searches the body only.** A regex over property values
has no flag and no caller; it would be `--contain-values` if one appears.

**Scope with nothing to scope is refused.** `--contain-properties` alone is a
presence test and stands on its own; there is no form where one flag is
meaningless without another.

## What it replaced

`--without` shipped in batch 2 and was removed in batch 3 — never asked for, no
caller. It returns here as `--without-properties`, plural like its counterpart,
so the pair is symmetric and neither needs repeating to take several names.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
