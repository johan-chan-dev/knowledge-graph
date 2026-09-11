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
# in A                            # in B
links.supersedes: [<link-uuid>]   backlinks.supersedes: [<link-uuid>]
```

Three properties fall out of that arrangement, and no other one has all three:

| | |
|---|---|
| the link's own data exists **once** | so nothing can disagree about `since` |
| both directions are **one node read** | `backlinks` costs ~70 µs, not a scan |
| both endpoints have the **same shape** | no authoritative side to remember |

The alternative measured against it is a scan: 7 s over 100 000 nodes, 600 ms
over 10 000. Storing the back half is what buys that back, and the reason
Neo4j's index-free adjacency links relationships from both ends.

**JSON, not markdown with frontmatter.** A link carries no prose, so a body
would be dead weight — and JSON needs none of `frontmatter.ts`: no `2026-01-01`
becoming a date, no five spellings of null, no quoting rules to preserve
`'1.10'`. Not a speed argument: parsing is ~4% of a file read, measured.

**A link carries properties**, as Neo4j's relationships do — *"can have
properties, which further describe the relationship"* — and exactly one type,
also Neo4j's rule. That is why a link cannot be a list element: there would be
nowhere to put them.

## What it needs that does not exist

**The dot rule.** `links.supersedes` is refused today — `not a property name`.
[`structure.md`](../structure.md) designed the rule (*a dot can only follow a
reserved name*) for `body.lines` and nothing has implemented it. Relations are
what would.

**Two reserved names**, `links` and `backlinks`, spent permanently. By
`structure.md`'s test they qualify: edges becoming part of a node's shape is
named there as the example of the format growing.

**A surface the parser cannot express.** The natural form is
`kg node <a> link --as <type> --with-nodes <b> --with-prop since 2026-09-10` —
a variadic flag and a two-value repeated one, neither of which `parse-args`
does. [`arguments`](arguments.md) records the tokeniser that would, and
relations lean on it much harder than `--with-labels` did. Either that comes
first, or this ships a narrower surface.

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
a scope the surface had shed.

## What would trigger it

Wanting to say *A supersedes B* and have the tool know it. Two things already
wait: [`lifecycle`](lifecycle.md), because whether withdrawing a node is
deletion or a tombstone rests on what can reference it, and
[`validation`](validation.md), which notes that structured data is meanwhile
being flattened into properties — *"the workaround that would make relations
harder to add: the structure would already be living somewhere else."*

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
