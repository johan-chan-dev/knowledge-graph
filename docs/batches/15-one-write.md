# Batch 15 — one write

**Done when** a unit of meaning is written in one act.

## What it has to fix

**A thing that is one thing takes several commands.** *A decision with its
title, its status and the date it was taken* is one act; today it is four, and
each is a separate process that reads and rewrites the whole node. Measured:

```
a node with five properties : 6 processes, 0.48 s
rewrites of the file        : 6
```

**And the cost that matters is not the time.** Three of those four can succeed
while the fourth fails, and what is left is a node carrying a title and no
status — plausible, and nothing marks it as half-built. That is the class of
failure this tool has spent fourteen batches removing everywhere else: a state
that reads as an answer.

**An import feels the time too.** `conformance/import.sh` is 1 239 commands and
about fifty seconds, almost all of it process startup on a 70 MB binary.

**And argv cannot write a list at all.** `set sources '[a, b]'` stores the
string `[a, b]`, because the shell removed the quoting before the tool saw
anything. So `add` is the only way a list comes into being, even when the
caller knows the whole of it from the start.

## What it should look like

```console
$ kg node 01a0…7c2f set --stdin <<'JSON'
{ "title": "The vocabulary is openCypher's", "status": "settled",
  "sources": ["batch-12", "rfc-7396"] }
JSON
set 3

$ kg node 01a0…7c2f --properties
{
  "sources": ["batch-12", "rfc-7396"],
  "status": "settled",
  "title": "The vocabulary is openCypher's"
}
```

And the refusals, which are half of what it decides:

```console
$ kg node 01a0…7c2f set --stdin <<< '{"released": 2000}'
not a value: 2000 — a property is text, so write it quoted

$ kg node 01a0…7c2f set --stdin <<< '{"status": null}'
not a value: null — a property is removed with `unset`, which is a verb

$ kg node 01a0…7c2f set --stdin <<< '{"labels": ["Decision"]}'
labels is reserved — it is how a node classifies, written with `label`
```

**Named, not linked:** `tool/tests/batches/15_test.ts`.

## It is `set`, generalised — not a standard adopted

`set <name> <value>` writes one key and leaves the others. `set --stdin` writes
several and leaves the others. **Same verb, same semantics, a different number
of keys** — which is the symmetry `nodes --properties <id>...` and
`nodes --stdin --properties` already have.

**RFC 7396 was the obvious shape and is the wrong one.** Its merge-patch makes
`null` mean *delete this key*, and inheriting that would reopen by the format a
door the design closed: [absence](../design/absence.md) settled that **absence
is a verb**, because argv cannot carry *no value* — every candidate arrives as
a legal one. JSON can carry it, so the original argument no longer holds by
itself and has to be retaken. It is retaken the same way: one path to a thing,
and `unset` is that path.

So nothing is adopted. What the format buys is a list, and that is all.

| | argv | `--stdin` |
|---|---|---|
| several keys in one write | no | **yes** |
| a list written whole | no — `set sources '[a, b]'` is a string | **yes** |
| removing a key | `unset` | `unset` |
| growing a list without knowing it | `add` | `add` |

`add` and `remove` keep their own job: they change a list **without the caller
knowing what is in it**, which a write of the whole value cannot do.

## What it reopens in batch 3, and on batch 3's own reasoning

[Batch 3](3-lists.md) divided the verbs: *the shape follows from the verb, not
the argument count* — `set` and `unset` are about the property, `add` and
`remove` about its contents, *so one value passed to `set` is a scalar and one
passed to `add` is a single-element list, and neither has to be inferred*.

**A `set --stdin` that writes a list breaks that division.** It has to be said
rather than glossed, because the division is a shipped rule with a test behind
it.

It breaks the letter and keeps the reason. The rule exists so that **nothing is
inferred**: in argv the only signal available was the verb, because `set x a b`
would have made the tool count arguments and guess. JSON carries the shape
itself — `["a", "b"]` is a list because the author wrote brackets, and a
one-element list is `["a"]` rather than something to deduce. So the verb stops
having to carry what the format now says out loud.

What does not change is `add`: it grows a list **without the caller knowing what
is in it**, which no write of a whole value can do. The two verbs stop dividing
by shape and start dividing by what the caller knows.

Batch 3 gets the note, the way [9](9-find.md) and [11](11-resolution.md) did.

## What it refuses, and none of it is a new rule

| in the object | what happens | already decided by |
|---|---|---|
| `labels`, `links` | refused, naming the verb that writes them | they are reserved, and argv refuses them the same way |
| `id` | refused — it is not a property | `nodes --properties` prints it; that does not make it one |
| a nested object, a list of lists | refused | *nothing authored may nest*, `spec/storage.md`, and batch 3 refuses it at the reading door already |
| `2000`, `true` | refused | the tool does not decide that the number `2000` means the text `"2000"` — [batch 4](4-stops-guessing.md) |
| `null` | refused, naming `unset` | above |

The numeral row is the same refusal [batch 14](14-match.md) put in a pattern's
map — *a property is text on disk, so a map compares against a quoted string*.
Two places, one rule, and neither invented it.

**A refused key refuses the whole object.** The argument for this command is
that a unit of meaning is written at once; writing half of it would be losing
exactly what it came for.

## What validates it

`conformance/import.sh`, regenerated to write each node's properties in one
call. Counted: **171 `node new`, 374 `set`, 253 `link`** — so folding the
properties into their node's creation removes 374 processes and leaves 545,
a little over half. The node count, the relation count and all thirteen of the
guide's answers must come out identical, which is what makes it a check rather
than a rewrite.

The rest is the relations, which this batch does not touch: one process each,
and writing several nodes at once is what it leaves.

## The sequence

| | | why here |
|---|---|---|
| **1** | reading a JSON object as properties — the refusals, no writing | every refusal lands before the node is opened, which is batch 9's rule, and it is testable with no store |
| **2** | `set --stdin` writes, exclusive with a name and a value | needs step 1; one flush, so the unit of meaning is one write |
| **3** | a list is written whole | the one capability argv does not have, and the only one that is new |
| **4** | `convert.ts` emits one `set --stdin` per node | last, because it is the check and it should be run against a surface that stopped moving |

## What it leaves

**Writing several nodes at once.** One node is a unit of meaning; several are a
transaction, and this tool has none — `git` is the versioning and
[the tool never commits](11-resolution.md). A command that half-wrote a hundred
nodes would need something to roll back to, and naming that is a different
batch.

**Editing part of the body.** [partial-edits](../design/parked/partial-edits.md)
holds it, with the hash that guards a positional write. It is the same subject
one half of a node over, and it is parked rather than next.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · [13](13-output.md) · [14](14-match.md) · 15
