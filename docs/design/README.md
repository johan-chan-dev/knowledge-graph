# Design

Why this works the way it does. One argument per document, and only that
argument.

- [location](location.md) — nothing here is identified by where it sits
- [vocabulary](vocabulary.md) — a word a node carries, and membership is never written down
- [structure](structure.md) — the tool may name its own parts, and each name is spent permanently
- [absence](absence.md) — a property is absent, and that is all it means
- [boundaries](boundaries.md) — data is checked where it enters, and once
- [material](material.md) — a node is a stage, not a record
- [parked/](parked/) — argued, and not settled enough to build

## The line between here and the spec

**`design/` holds what survives a rewrite. [`spec/`](../spec/) holds what the
tool does, and why it does it that way.**

*A reference is a name, not a path* is true of any store that keeps material
somewhere. *`new` and `write` are different operations* dies the day those
commands are renamed. The first is an argument; the second is a fact about a
surface, and it is unreadable without its reason attached — so the reason stays
beside it rather than being exiled here.

The older form of this rule said the spec states rules and the design states
reasons. That was wrong in practice: the spec is full of reasons, because a rule
without one reads as arbitrary. What actually distinguishes the two is how long
the argument outlives the code.

Either may cite the other where it is useful. What must not happen is the same
mechanic written down twice — if a command's shape appears here and there, one
copy is wrong and the two will drift.

**Nothing here describes what is not built.** An argument for something
unbuilt is not settled enough to specify, so it lives in
[`parked/`](parked/) until a batch makes it real.

## Scope

A document here grows when a batch needs one, and not before. An argument for
something that does not exist is unfalsifiable, and writing it early only makes
it harder to abandon.

[`parked/`](parked/) is where that pressure is released. Something argued but
not built goes there — held, dated, and out of the way of anything describing a
tool that exists.

---

[docs](../README.md) · design · [spec](../spec/) · [batches](../batches/)
