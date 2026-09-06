# Design

Why this works the way it does. One argument per document, and only that
argument.

- [location](location.md) — nothing here is identified by where it sits
- [grouping](grouping.md) — a group is a word a node carries, and membership is never written down

## The one rule

**The specification states the rule. The design states the reason, and never
restates the rule.**

So [the spec](../spec/storage.md) says the id is the filename;
[location](location.md) says why a name outlives a path and never mentions
filenames at all. If a mechanic turns up in both, one of the copies is wrong,
and the two will drift.

References run one way. The spec cites a design document when a reader asks
*why is this so*. Nothing here cites the spec, because an argument that depended
on this month's command surface was never an argument.

## Scope

This covers what is built. It grows a document when a batch needs one, and not
before — the arguments for things that do not exist yet are unfalsifiable, and
writing them early only makes them harder to abandon.
