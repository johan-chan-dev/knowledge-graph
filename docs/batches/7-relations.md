# Batch 7 — relations

**Done when** a node can say how it stands to another node, and both ends can
be asked.

Planned. The design and its argument are in
[`design/parked/relations.md`](../design/parked/relations.md); this is what the
batch builds and what it leaves.

## What it should look like

```console
$ kg node "$a" link --as supersedes --with-nodes "$b"
01a08e3f-4c21-7bb0-9e7a-5d2f8c1a4e90

$ kg node "$a" link --as cites --with-nodes "$b" "$c" --with-prop since 2026-09-10
01a08e40-1f77-7a3e-b2c4-9e81d5a0f3b2
01a08e41-88b3-7c19-a7de-0b4f2e6c9d15

$ kg node "$a" links
cites        01a08e40-1f77-…  → 01a084f0-63be-…
cites        01a08e41-88b3-…  → 01a084f0-6401-…
supersedes   01a08e3f-4c21-…  → 01a084f0-63be-…

$ kg node "$b" backlinks
cites        01a08e40-1f77-…  ← 01a084f0-631b-…
supersedes   01a08e3f-4c21-…  ← 01a084f0-631b-…

$ kg node "$a" unlink --as supersedes --with-nodes "$b"
unlinked 1
```

And the refusals:

```console
$ kg node "$a" link --as supersedes --with-nodes 01a08000-0000-7000-8000-000000000000
no such node: 01a08000-… in knowledge-graph

$ kg node "$a" link --with-nodes "$b"
--as needs a type

$ kg node "$a" set links.supersedes x
links is reserved — a relation is written with `link`
```

**Will be backed by** `batch 7 — relations`, as `7_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

## It has to build the tokeniser first

The surface above needs a variadic flag (`--with-nodes`) and a repeated
two-value one (`--with-prop`). `parse-args` does neither.
[`design/parked/arguments.md`](../design/parked/arguments.md) already argues the
answer — let the table declare each flag's *shape* as well as its name, and
tokenise from that, replacing `parse-args` rather than working around it.

[Batch 6](6-labels.md) bent `--with-labels` around the parser it had. Doing that
twice is how a workaround becomes the shape, and `--with-prop` has no plausible
hack at all. So the tokeniser is the batch's first move, not a later tidy-up.

## And the dot rule, which nothing has ever used

`links.supersedes` is refused today — *not a property name*.
[`structure.md`](../design/structure.md) designed the rule that a dot may follow
a reserved name, for `body.lines`, and nothing has exercised it since. Relations
are what make it real.

## What it decides

**A link is a record**, `.kg/links/<uuid>.json`, holding its type, both
endpoints and its properties **once**. Each endpoint carries the link's id under
`links.<type>` or `backlinks.<type>`, so both directions are a single node read
rather than a scan — ~70 µs against 7 s over 100 000 nodes.

**Two reserved names**, `links` and `backlinks`. By `structure.md`'s test they
qualify: edges becoming part of a node's shape is named there as the example of
the format growing.

**A link carries properties and exactly one type**, both Neo4j's rules. That is
why it cannot be a list element — there would be nowhere to put them.

**The commands start from the node**, never from the link. A directed edge is
not symmetric, and the source is where the caller is standing.

## What it does not do

**Nothing across spaces.** A cross-boundary reference is a URL, not a uuid, so
links never leave a space — which is exactly what makes storing both halves
safe. Multi-space is [batch 9](README.md).

**No querying by relation.** [Batch 8](8-find.md) asks about one node's
properties, and says so: traversal arrives as a command, not as pattern syntax.

**No editing a link after the fact.** The record has an id, so it is
addressable, but every command here starts from a node and `kg link <id> set`
would reintroduce a scope the surface shed. Set the properties at `link` time
or make a new one.

**No integrity checking.** A `link` touches three files and `atomically` renames
one, so a half-failed write leaves an endpoint pointing at a link the other end
does not know about. The record is authoritative, so what survives is a
repairable index rather than a lost fact — repairing it is
[`further-out`](../design/parked/further-out.md)'s.

**No opinion about cycles.** `a supersedes b supersedes a` is wrong and not
refused. [`sharing`](../design/parked/sharing.md) gets acyclicity from the
sharing axis, which does not apply inside one space.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · 7 · [8](8-find.md)
