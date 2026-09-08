# Batch 2 — nodes carry properties

**Done when** you could annotate a node and find it again by its annotation.

Shipped. The commands are in [`spec/api.md`](../spec/api.md).

## What it was for

A node had a body and nothing else. Properties are the first thing that makes
the frontmatter structure rather than an empty fence, and everything a practice
will ever record about a node lives there.

## What building it forced

**How much a filter may express.** Three predicates: equals, present, absent.
No comparison operators, no `or`, and no negated values — `--without a=1` has
two defensible readings, so it would need a rule nobody remembers, where absence
and inequality are different questions with single answers.

That boundary is a description of what is built, not a permanent one.
Comparison is a coherent addition when something needs it, and the operator can
carry the type without the storage taking a side — see
[`design/parked/comparison.md`](../design/parked/comparison.md).

**Whether a value has a type.** It does not. Text in, text out, compared as
text. The serialiser quotes only what would otherwise change type coming back,
so `'42'` and `'2027-01-01'` keep their quotes while `hello world` stays bare —
and those quotes preserve that the tool was handed text rather than decide what
the text means.

**Which half of a node stdout carries.** One or the other, never both.
`--properties` swaps which, and stderr stays about the operation either way. A
separate command for reading properties would have been a third way to ask a
question `read` already answers.

## What it settled

**The tool compares strings and understands nothing.** It does not know what
`decided-by` names, only whether the text matches. That is slot discipline
applied to reading, and it is what lets a practice invent a field the substrate
has never heard of.

**A damaged node is reachable for the first time.** Filtering opens every file
where a bare listing is a directory read, so a listing skips an unparseable node
and names it on stderr while exiting `0`, and a command naming that node exits
`1`. One damaged file must not make a space unfindable; reporting is not the
same as failing.

## What it revealed, late

`write` preserves properties by splitting the file and rejoining it, and every
batch 1 test ran that path with an **empty** frontmatter block — so the preserve
step was unverified in precisely the place where a bug destroys data. Batch 2 is
the first thing that could observe it.

It also left a live defect. The reader flattens every parsed value with
`String(value)`, so a hand-written list becomes a scalar on the next unrelated
write:

```
before   labels: [auth, pattern]
$ kg node <id> set other x
after    labels: 'auth,pattern'
```

The serialiser was configured for lists a batch early and the reader never
caught up. That gap is the bug, and it is what
[batch 3](3-lists.md) fixes by construction.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · 2 · [3](3-lists.md)
