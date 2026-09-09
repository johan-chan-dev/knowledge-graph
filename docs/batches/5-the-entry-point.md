# Batch 5 — the entry point

**Done when** every command's shape is declared in one place, and the names the
tool holds facts under cannot be shadowed by a property.

Planned. No new capability — this closes the gap between what
[`design/structure.md`](../design/structure.md) claims and what the tool
enforces, and it puts the surface's shape somewhere a defect cannot hide.

## What it should look like

```console
$ kg node "$a" set body "something"
body is reserved — it is the node's content, written with `write`

$ kg node "$a" set created 2026-01-01
created is reserved — it is read from the id, and cannot be written

$ kg nodes list --properties
--properties belongs to `kg node <id>`

$ kg node "$a" frobnicate x
node <id> takes one action: write, set, unset, add, remove
```

The last one is a correction rather than an addition — today it says
`node <id> frobnicate takes no arguments`, which tells the caller `frobnicate`
is a property that happens to take none.

**Will be backed by** `batch 5 — the entry point`, as `5_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

## Reserved property names

`body` and `created` stop being writable. `set`, `unset`, `add` and `remove`
refuse them, and the refusal says where to go instead.

They are reserved because the tool holds those facts itself — one is the node's
other half, the other is arithmetic on its filename — and a property carrying
the same name shadows a fact rather than adding one. `structure.md` argues this
already; the tool has never enforced it, so today a node can carry a `body`
property sitting beside its actual body.

**Not the grammar's keywords.** `and`, `or`, `not` and `in` are reserved in
[batch 6](6-find.md), where the parser that needs them lives. Reserving them
here would be spending names — permanently, by `structure.md`'s own arithmetic —
for a batch that does not exist.

## A declared command table

One source for what each command takes: how many positional arguments, and which
flags are legal on it.

```
nodes list        —                    no flags
node new          —                    --stdin
node <id>         id                   --properties
node <id> write   id                   --stdin required
node <id> set     id, name, value      exactly two
node <id> add     id, name, value...   one or more
```

**Because that shape currently lives in three places, and all four argument
defects were disagreements between them.** Help reads a `FORMS` table; dispatch
is a chain of branches; arity is conditionals inside those branches. So:

| defect | which pair disagreed |
|---|---|
| `nodes list --properties` accepted and ignored | the flag was declared globally; nothing consulted the command |
| `node <id> frobnicate x` reported as an argumentless property | the arity check ran before the action was validated |
| `set title one two three` silently joined | no declared arity to violate |
| `--where` hand-parsed into clauses | a shape with no declaration |

One declaration removes those structurally rather than by being careful, which
is what a fourth round of care would have been.

## What a schema library does and does not buy

The entries are held with [Zod](https://jsr.io/@zod/zod). Worth being exact
about what that is worth, so the batch is not judged on the wrong thing:
**the table is the design, and the library is a convenience inside it.**

A schema validates a structure *after* parsing. It types the extraction —
`{ id, name, value }` — and it catches an argument of the wrong shape. It does
not catch a flag accepted where it means nothing; that comes from the table
being consulted at all.

So if the table earns itself and the library does not, the batch still
succeeded.

## What it does not do

**Nothing about reading a node.** `frontmatter.read`'s coercion stays as it is
and stays honestly named: it is robustness against YAML the tool did not write —
`42` unquoted comes back a number — not validation. Data is validated where it
enters, and by the time it is stored it has been.

**No node-content rules.** A practice declaring that a `decision` must carry a
`valid-until` is a different thing wearing the same word, and it is blocked on a
practice existing — see
[`design/parked/validation.md`](../design/parked/validation.md).

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · 5 · [6](6-find.md)
