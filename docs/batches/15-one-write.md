# Batch 15 — one write

**Done when** a unit of meaning is written in one act, and a property may hold a
structure.

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

**And argv cannot carry a shape at all.** `set sources '[a, b]'` stores the
string `[a, b]` and `set config.port 8080` is refused, because the shell removed
the quoting before the tool saw anything and a name is not a path. So a list
exists only through `add`, and a structure does not exist.

## The rule the whole batch follows

> **A datum has a shape; an address has a path.**

**The two are orthogonal, not alternatives.** Every write is a place and a
thing, and `set` has always taken both — `set title "x"` is a path of length one
and a scalar.

```
kg node <id> set <path> <value>      a scalar, there
kg node <id> set <path> --stdin      an object, merged there
kg node <id> set --stdin             an object, merged at the root
kg node <id> delete <path>...        removed, there
kg nodes match '(… {<path>: "x"})'   compared, there
```

| | takes | because it |
|---|---|---|
| `node <id> --properties` | the stored shape, nested | **presents** a datum |
| `node <id> set [<path>] --stdin` | nested JSON, at a place | **writes** a datum |
| a pattern's map — `{config.port: "x"}` | a path and a scalar | **compares** a leaf |
| `node <id> delete <path>...` | paths | **addresses** leaves |

**The path is what keeps a pipe from transforming.** Data arrives unwrapped — a
configuration object, a response body, a fragment of a file — and without a path
it would have to be wrapped on the way in:

```bash
curl -s … | kg node "$S" set config --stdin        # and not: | jq '{config: .}' | …
```

A `jq` whose only job is to nest one level is a transformation step in a
pipeline where nothing else transforms anything.

## What it should look like

```console
$ kg node 01a0…7c2f set --stdin <<'JSON'
{ "title": "The vocabulary is openCypher's",
  "config": { "port": "8080", "host": "api.example.com" },
  "sources": ["batch-12", "batch-14"] }
JSON
set 3, replaced 0

$ kg node 01a0…7c2f set config --stdin <<< '{"port": "9090"}'
set 0, replaced 1

$ kg node 01a0…7c2f --properties
{
  "config": { "host": "api.example.com", "port": "9090" },
  "sources": ["batch-12", "batch-14"],
  "title": "The vocabulary is openCypher's"
}

$ kg nodes match '(:Service {config.port: "9090"})'
$ kg node 01a0…7c2f delete config.port sources
```

And the refusals, which are half of what it decides:

```console
$ kg node 01a0…7c2f set --stdin <<< '{"released": 2000}'
not a value: 2000 — a property is text, so write it quoted

$ kg node 01a0…7c2f set --stdin <<< '{"config": {"port": null}}'
not a value: null — a property is removed with `delete`, which is a verb

$ kg node 01a0…7c2f set --stdin <<< '{"labels": ["Decision"]}'
labels is reserved — it is how a node classifies, written with `label`
```

**Backed by** [`15_test.ts`](../../tool/tests/batches/15_test.ts), and by the
conformance import below.

## It is `set`, generalised — not a standard adopted

`set <name> <value>` writes one key, at the top, and leaves the others.
`set <path> --stdin` writes several, anywhere, and leaves the others. **Same
verb, same semantics, generalised along both axes at once** — how many keys, and
how deep the place. Neither axis is new in kind: the second key is the first one
again, and the second level is the first one again.

**RFC 7396 was the obvious shape and is the wrong one.** Its merge-patch makes
`null` mean *delete this key*, and inheriting that would reopen by the format a
door the design closed: [absence](../design/absence.md) settled that **absence
is a verb**, because argv cannot carry *no value* — every candidate arrives as a
legal one. JSON can carry it, so the original argument no longer holds by itself
and has to be retaken. It is retaken the same way it was settled: **one way to
remove a thing**, and that way is a verb.

What is taken from the RFC is the **deep** merge, and only because it is what
makes a shape an address.

## `delete` replaces `unset`

`unset <name>` removes one top-level property. `delete <path>...` removes
several, at any depth. It is a rename and a widening, not two verbs: **one way
to remove a thing**, which is the rule that refused `null` above.

| | today | after |
|---|---|---|
| one property | `unset title` | `delete title` |
| several | four commands | `delete title status score` |
| a leaf | not expressible | `delete config.port` |

`add` and `remove` keep their own job — growing a list **without the caller
knowing what is in it**, which no write of a whole value can do. They stay
top-level: a list inside a structure is replaced whole, by sending the shape.
Giving them paths as well is a widening nothing has asked for.

## What it reopens, and on those batches' own reasoning

**[Batch 3](3-lists.md) divided the verbs by shape.** *The shape follows from
the verb, not the argument count* — `set` is a scalar, `add` is a list, *so
neither has to be inferred*. A `set --stdin` that writes a list breaks that
division and keeps its reason: the verb had to carry the shape because argv
offered no other signal. JSON says it outright, so nothing is inferred.

**And the reading door refused a structure outright** — *config has no value*,
*sources holds something that is not a value*. That refusal was right while
nothing could write one and nothing could address one. Both change here, so the
door opens exactly as far as the writer goes: a value is a scalar, a list of
scalars, **or a map of either**, recursively.

What does not change is why a list is not a container. [Batch 9](9-find.md) put
it as *a list is a dimension, not a container* — two values on one dimension,
not a thing holding things. A map **is** a container, and that is the new
capability rather than a reinterpretation of the old one.

Both pages get the note, the way [9](9-find.md) and [11](11-resolution.md) did.

## Where the merge stops

**Deep through maps, and not into a list.** `{"config": {"port": "x"}}` merges
into `config`; `{"sources": ["a"]}` **replaces** `sources` whole.

That is not an exception, it is [batch 9](9-find.md)'s rule applied: *a list is
a dimension, not a container*. A map has sub-addresses to merge into because it
holds things; a list holds nothing, it says several things at once, so there is
nothing inside it for a path or a merge to reach. `add` and `remove` are how a
dimension changes without being restated, and they are unaffected.

The same line answers a path: `delete sources.0` is **refused**. An index is
not an address here, because position is not what a list means.

## What `set` says, and its arity

`set` names what it touched and **splits created from replaced** — `set note`
against `replaced note` — because that split is what the caller could not have
worked out without reading first. With several keys the split stays and the
names give way to counts, which is the same information at a size a person can
read: `set 3, replaced 0`.

Three forms, and the fourth is a refusal:

```
set <path> <value>       a scalar, there
set <path> --stdin       an object, merged there
set --stdin              an object, merged at the root
set <path> <value> --stdin   takes a value, or --stdin, and not both
```

The last is the message `nodes --properties` already gives for ids against
`--stdin`, and `set <path>` alone keeps the one it gives today — *needs a name
and a value*, now *needs a value or `--stdin`*.

## Three things the review found missing

**A nested key follows the word rule, at every depth.** `{"config": {"port-x":
"y"}}` is refused for the same reason `set port-x` is: a hyphen is a name that
needs quoting. And it is what keeps a path unambiguous — a `.` cannot occur in
a key at any level, so `config.port` can only ever be an address.

**An emptied container goes, and the tool already says so.** `remove tags b`
today answers *removed 1 from tags, tags is now unset* and leaves `{}` behind on
the node rather than an empty list. `delete config.port` does the same to
`config` when `port` was the last key — a map holding nothing is not a fact
about the node, it is the absence of one.

**The counts count leaves, not top-level keys.** `set config --stdin` with
`{"port": "9090"}` on a node that had `config.port` says `set 0, replaced 1` —
one leaf replaced, not one key touched. Counting keys would report `1` whether
the object carried one leaf or forty, which tells the caller nothing they did
not already send.

## The round trip needs a filter, and the page should say so

```bash
kg node "$ID" --properties | jq '.status = "live"' | kg node "$ID" set --stdin
labels is reserved — it is how a node classifies, written with `label`
```

**The output is not an input, and never was.** `--properties` prints the stored
shape **plus** the resolution — `neighbour` is computed, `labels` and `links`
belong to their own verbs, and the plural form adds `id`. So the obvious
pipeline refuses, loudly, and the filter is the correction:

```bash
kg node "$ID" --properties | jq 'del(.labels, .links) | .status = "live"' \
  | kg node "$ID" set --stdin
```

That refusal is right — a write that silently ignored three keys would be worse
— but a page that makes output and input the same format owes the reader the
sentence that they are still not the same object.

## Two things a path forces

**A path may not pass through a scalar.** `set config.port "x"` where `config`
holds `"abc"` is **refused**: replacing a value with a structure because a path
needed one to exist is the tool deciding what was meant, which
[batch 4](4-stops-guessing.md) removed it for.

**An object may land on a scalar or a list**, replacing it — that is what `set`
does to the place it is given, and naming the place is the whole of the
instruction. **The value it destroys is counted**, because losing one in silence
is what this tool refuses everywhere else: writing `{"a": {"deep": "x"}}` over a
scalar `a` answers `set 1, replaced 1`, not `set a.deep`.

**And `add` and `remove` say so when handed a path.** They take a name, so a
caller who writes `add config.tags c` is not misspelling anything — telling them
about hyphens would point at the wrong thing. The refusal names the verb's own
shape instead, and where a list inside a structure is changed: whole, with
`set`.

## `delete`, in full

| | |
|---|---|
| several paths | `delete title config.port` — one act, one write |
| an absent path | says so and succeeds, as `unset` does today: the end state asked for is the end state |
| a reserved name | refused, naming the slot's owner — `delete labels` says *written with `label`*, the message `unset labels` gives today. The slot belongs to a command, not to that command's inverse |
| an ill-formed path | refused before the node is opened — `config.`, `.port`, `a..b` |

## What it refuses, and most of it is not new

| in the object | what happens | decided by |
|---|---|---|
| `labels`, `links` | refused, naming the verb that writes them | reserved, and argv refuses them the same way |
| `id` | refused — it is not a property | printing it does not make it one |
| `2000`, `true` | refused | the tool does not decide that the number `2000` means the text `"2000"` — [batch 4](4-stops-guessing.md) |
| `null` | refused, naming `delete` | above |
| a key containing `.` **inside the object** | refused | there it is a name, and a name is not a path |

The numeral row is the same refusal [batch 14](14-match.md) put in a pattern's
map. Two places, one rule, and neither invented it.

**A refused key refuses the whole object.** The argument for this command is
that a unit of meaning is written at once; writing half of it would be losing
exactly what it came for.

## What a path costs in a pattern

[Batch 14](14-match.md)'s map takes a name. It has to take a path, and that is
the one place this batch reaches into the pattern grammar.

**It is a deliberate divergence, and it fails loudly.** openCypher has no nested
property and therefore no property path — `{config.port: "x"}` is not valid
there, because `.` is outside `ID_Continue`. **Backticks are not added**:
`` `config.port` `` *is* valid Cypher and means a property literally named
`config.port`, so a backticked pattern would parse elsewhere, run, and match
nothing. A form that refuses at the other parser is better than one that
silently means something else — and [naming](../design/naming.md) now says the
relationship is inspiration rather than conformance, which is what makes this
allowed.

**A path never collides with a name**, and the dot's meaning is decided by
position rather than by guessing:

| where a `.` appears | what it is |
|---|---|
| a key inside the JSON object | a **name**, and refused |
| an argument to `set` or `delete` | a **path** |
| a key in a pattern's map | a **path** |

A stored key cannot contain one, so the two vocabularies cannot overlap and
there is no precedence to define.

**A path to an absent leaf does not match**, exactly as an absent key does not —
[absence](../design/absence.md)'s two-valued rule, with no third value invented
for *the parent exists and the leaf does not*.

**And a path landing on a map does not match either.** `{config: "x"}` compares
a scalar against a structure and fails, which is the rule
[batch 14](14-match.md) already applies to a list: *a map compares a value, so a
property holding a list does not match one*.

## What validates it

`conformance/import.sh`, regenerated to write each node's properties in one
call. Counted before: **171 `node new`, 374 `set`, 253 `link`**. Measured after:
**1 036 lines against 1 239**, and every answer identical — the node count, the
relation count and all thirteen of the guide's, which is what makes it a check
rather than a rewrite.

The saving is smaller than the `set` count because a node with one property
trades one command for one command. What it buys there is not speed but the
thing the batch is for: the property arrives with the node rather than after
it.

The relations are untouched: one process each, and writing several nodes at once
is what this leaves.

## The sequence

| | | why here |
|---|---|---|
| **1** | a value may be a map — the reading door, and `document.ts` writing one back | self-contained, and what everything else needs on disk. Nothing writes one yet |
| **2** | reading a JSON object as properties — the refusals, no writing | needs step 1 to know what a value is. Every refusal lands before the node is opened, which is batch 9's rule |
| **3** | `set [<path>] --stdin` writes, deep-merging at the place named | needs step 2; one flush, so the unit of meaning is one write. A path with a scalar is the shape `set` already has |
| **4** | `delete <path>...`, replacing `unset` | needs step 1 for a path to have somewhere to point |
| **5** | a path in a pattern's map | the only step that touches [batch 14](14-match.md); it needs step 1 to have anything to reach |
| **6** | `convert.ts` emits one `set --stdin` per node | last, because it is the check and should run against a surface that stopped moving |

## What it leaves

**Writing several nodes at once.** One node is a unit of meaning; several are a
transaction, and this tool has none — `git` is the versioning and the tool never
commits. A command that half-wrote a hundred nodes would need something to roll
back to, and naming that is a different batch.

**A path in `add` and `remove`.** They stay top-level until someone wants a list
inside a structure grown rather than replaced.

**Exporting to a real engine.** A nested property is the first thing this store
holds that openCypher's data model refuses outright — not its grammar, its
types. Whoever writes an export decides whether to flatten, serialise or promote
to nodes, and that decision belongs there rather than here.

**Editing part of the body.** [partial-edits](../design/parked/partial-edits.md)
holds it, with the hash that guards a positional write. Same subject, the other
half of a node.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · [13](13-output.md) · [14](14-match.md) · 15
