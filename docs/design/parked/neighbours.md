# Reaching a node's neighbours in one call

> **Shipped, then parked.** `kg node <id> links` and `kg node <id> backlinks`
> were built by [batch 7](../../batches/7-relations.md) and removed again: they
> are a shortcut over two primitives, and the foundation is settled before its
> shortcuts.

## What they did that the primitives do not

A node's frontmatter carries, for each relation, `{type, link, direction}` —
where `link` is the **record's** uuid, not the neighbour's. The node at the
other end is in the record, not in the node's own file.

```
kg node <id> --properties     type, direction, and the record's uuid
kg link <id>                  type, from, to — the far end is here
```

So reaching the neighbours is **N+1 reads**: the node, then one record per
relation. The two commands did that loop inside one process and printed the far
end as a third column.

**No selector can replace it.** A flag on `kg node <id> --properties` can only
project what the file holds, and the neighbour's id is not in the file. This is
a join, not a projection.

## What it costs to park them

Two of the guide's thirteen questions — *who directed Cloud Atlas*, and
*everyone connected to it* — were one pipeline each because the third column
existed. They become the loop again.

Measured: a file read is about **69 µs** and a process is about **80 ms**, so
the loop is cheap **inside** one process and expensive across many. Cloud Atlas
has ten relations: ten reads, well under a millisecond, against ten processes if
a caller writes the loop in shell.

That is the shape of what a shortcut here buys — not speed on disk, but
processes not spawned.

## What would unpark it

The foundation being settled: what `kg node <id> --properties` returns, and
whether anything consumes ids. A command that fuses two reads is worth having
once both reads are stable, and not before — otherwise the fusion is what gets
maintained while the parts are still moving.

## Spelling, if it returns

Not as an action. `links` and `backlinks` were actions while `--properties` was
a flag, and all three answer *which view of this node*. `spec/api.md`'s rule
puts reading a resource as implicit and the aspect as a selector — so
`kg node <id> --links`, or nothing.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
