# Relations

**A link between two nodes in one space.** Crossing a space boundary is a
different mechanism and is not here: across a repository a reference is a URL,
never a uuid, which is exactly what makes the storage below safe.

Until now relations were one word inside
[`further-out`](further-out.md), beside three unrelated things.

## A link is a record, and the endpoints point at it

```
.kg/links/<uuid>.json      { "type": "supersedes", "from": "<A>", "to": "<B>", "since": "2026-09-10" }
```

```yaml
# in both A and B, under one reserved name
links:
  - type: supersedes
    link: <link-uuid>
    direction: out        # `in` on the other end
```

Three properties fall out of that arrangement, and no other one has all three:

| | |
|---|---|
| the link's own data exists **once** | so nothing can disagree about `since` |
| both directions are **one node read** | `backlinks` is the same read filtered on `direction` |
| type and direction sit on the node | grouping costs no record reads |

The alternative measured against it is a scan: 7 s over 100 000 nodes, 600 ms
over 10 000. Storing an entry at both ends is what buys that back, and the
reason Neo4j's index-free adjacency links relationships from both ends.

**JSON for the record.** A link carries no prose, so a body would be dead
weight — and JSON needs none of `frontmatter.ts`: no `2026-01-01` becoming a
date, no five spellings of null, no quoting rules to preserve `'1.10'`. Not a
speed argument: parsing is ~4% of a file read, measured.

**A link carries properties**, as Neo4j's relationships do — *"can have
properties, which further describe the relationship"* — and exactly one type,
also Neo4j's rule. That is why an entry cannot be a bare id: there would be
nowhere to put them.

**The entries are a materialised index.** `type` appears on the node and in the
record, so they can disagree; the record wins and the entry is repaired.

## What it needs that does not exist

**A nested shape under one reserved name.** The reader refuses a list of maps
today and goes on refusing it for authored names; `links` is validated against
exactly `{type, link, direction}`. A reserved name's shape belongs to the
format, which is the same argument `body` rests on.

**One reserved name**, `links`, spent permanently. By
[`structure.md`](../structure.md)'s test it qualifies: edges becoming part of a
node's shape is named there as the example of the format growing.

**Per-command flag sets.** The surface wants two variadic flags and a valued
one — `--as <type> --with-nodes <b> <c> --with-properties k=v k2=v2`. What
blocks it is not the shapes but that `parse-args` is handed a union of every
flag in the tool, so belonging is enforced after the parse instead of being it.
[`arguments`](arguments.md) has the diagnosis; [batch
7](../../batches/7-relations.md) does it first.

## Open

**A three-file write can tear.** `link` touches A, B and the record, and
`atomically` renames one file. A half-failed write leaves an endpoint pointing
at a link the other end does not know about. The record is authoritative, so
what survives is a repairable index rather than a lost fact — but integrity
checking is itself parked.

**Dangling targets.** Refusing an unknown target matches `write`, which already
refuses an id that is not here. It also forbids linking forward to something
not yet written.

**Cycles.** [`sharing`](sharing.md) gets acyclicity from the sharing axis, which
does not apply inside one space. Whether `a supersedes b supersedes a` is
refused or merely wrong is undecided.

**Editing a link's properties.** The record has an id, so it is addressable —
but every command so far starts from a node, and `kg link <id> set` reintroduces
a scope the surface had shed. Settled for now by setting them at `link` time.

**Unlinking ends the link.** The record is deleted and both endpoints drop it. A
label outlives its last use because vocabulary records what has been said; a
link is the relationship itself, so an orphaned record nothing points at is
damage rather than history.

## What would trigger it

Wanting to say *A supersedes B* and have the tool know it. Two things already
wait: [`lifecycle`](lifecycle.md), because whether withdrawing a node is
deletion or a tombstone rests on what can reference it, and
[`validation`](validation.md), which notes that structured data is meanwhile
being flattened into properties — *"the workaround that would make relations
harder to add: the structure would already be living somewhere else."*

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
