# Withdrawing a node

`node remove` and `node retire` both wait on the same unanswered question:
whether withdrawing a node is deletion or a tombstone. The argument that an
identity is never withdrawn rests on relations, and relations do not exist yet —
so deletion is honest while nothing can reference a node, and becomes wrong the
moment they do. Building it now means building it twice.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
