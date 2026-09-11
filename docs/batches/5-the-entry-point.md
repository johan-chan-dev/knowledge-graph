# Batch 5 — the entry point

**Done when** every command's shape is declared in one place, and the names the
tool holds facts under cannot be shadowed by a property.

Built. No new capability — this closed the gap between what
[`design/structure.md`](../design/structure.md) claims and what the tool
enforces, and it put the surface's shape somewhere a defect cannot hide.

## The loop

```console
$ kg node "$a" set body something
body is reserved — it is the node's content, written with `write`

$ kg node "$a" unset body
body is reserved — it is the node's content, written with `write`

$ kg node "$a" set created 2026-01-01
created is reserved — it is read from the id, and cannot be written

$ kg nodes list --properties
--properties belongs to `kg node <id>`

$ kg node "$a" whatever x
node <id> takes one action: write, set, unset, add, remove

$ kg node "$a" set title
node <id> set needs a name and a value

$ kg node "$a" set title one two three
node <id> set takes one value — quote it if it contains spaces
```

The unknown action is a correction rather than an addition. It used to be
reported as `takes no arguments` — describing it as a property that happens to
take none, rather than as a word the tool does not know.

**Backed by** `batch 5 — the entry point`, in
[`tool/tests/batches/5_test.ts`](../../tool/tests/batches/5_test.ts).

## Reserved property names

`body` and `created` are refused by `set`, `unset`, `add` and `remove`, and the
refusal says where the fact actually lives.

They are reserved because the tool holds those facts itself — one is the node's
other half, the other is arithmetic on its filename — and a property carrying
the same name shadows a fact rather than adding one. `structure.md` argued this
already; the tool had never enforced it, so a node could carry a `body` property
sitting beside its actual body.

**The reservation is on writing.** A file that already carries `body:` still
reads and still lists. The reader is robustness against YAML the tool did not
write, and turning it into a second gate would make a file unreadable for
carrying a name that was legal when it was written.

**Not the grammar's keywords.** `and`, `or`, `not` and `in` are reserved in
[batch 8](8-find.md), where the parser that needs them lives. Reserving them
here would be spending names — permanently, by `structure.md`'s own arithmetic —
for a batch that does not exist.

## A declared command table

`tool/src/surface.ts` holds one entry per command: its form, its scope, whether
a second positional is an id, its arity, which flags are legal on it, and what
it runs. Help, matching, checking and dispatch all read those entries.

**Because that shape used to live in three places.** Help read a `FORMS` list;
dispatch was a chain of branches; arity was conditionals inside those branches.
Every argument defect the tool has had was a disagreement between them.

All four are fixed. They are set out here as the evidence that the arrangement
was the cause, rather than the care taken with it:

| defect | fixed in | which pair disagreed |
|---|---|---|
| `--where` hand-parsed into clauses | 4 | a shape with no declaration |
| `set title one two three` silently joined | 4 | no declared arity to violate |
| `nodes list --properties` accepted and ignored | 4 | the flag was declared globally; nothing consulted the command |
| an unknown action reported as an argumentless property | 5 | the arity check ran before the action was validated |

Three of the four were caught one at a time by [batch 4](4-stops-guessing.md),
which is the point: a fourth round of care would have found a fifth.

One declaration removes those structurally rather than by being careful, which
is what a fourth round of care would have been.

**Dispatch is in the entry too.** A `run` on each command was the last place the
table could be complete and the program still not reach it — a `switch` can omit
a case; a table whose entries carry their own behaviour cannot.

### What is still prose, and how it is held

Two fields restate the shape in words a schema cannot produce: `form`, which is
what help prints, and `arity`, which is what a wrong count says. `set` refusing
a second value is really about shell quoting, and no tuple knows that.

So they are checked rather than trusted.
[`src/surface_test.ts`](../../tool/src/surface_test.ts) types each command's own
`form` back at the matcher and requires it to match that command and satisfy its
schema. A form and a rule that disagree fail the suite.

## What a schema library bought

The entries are held with [Zod](https://jsr.io/@zod/zod). Worth being exact, so
the batch is not credited to the wrong thing: **the table is the design, and the
library is a convenience inside it.**

What it earned: one place per argument kind, saying what a name is and what a
value is, with the refusal message attached to the rule rather than to the
caller. `Name` carries the reserved check, so every verb that takes a name
refuses `body` without any of them mentioning it.

What it did not: a flag accepted where it means nothing is not a schema failure
at all — that comes from the table being consulted. Nor does it decide exit
codes. A wrong count is `4` and a wrong argument is `1`, because one means the
caller does not know the form and the other that it broke a rule, and only the
tool knows which of Zod's issues is which.

## What it does not do

**Nothing about reading a node.** The entry point this batch declared is argv,
and the reading path was left exactly as it was. What arrives from disk raises a
different question from what arrives from the shell — one is about a block
somebody may have hand-edited, the other about the shape of an argument list —
and answering both in one batch would have made neither legible.

**No node-content rules.** A practice declaring that a `decision` must carry a
`valid-until` is a different thing wearing the same word, and it is blocked on a
practice existing — see
[`design/parked/validation.md`](../design/parked/validation.md).

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · 5 · [8](8-find.md)
