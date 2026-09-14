# Batch 11 — resolution

**Done when** a set of ids becomes their data in one call, with no loop.

## What it has to fix

Nine of the guide's thirteen questions turn on `find`, and
[batch 9](9-find.md) answered them. Three of those answers are still a shell
loop spawning one process per node, because the tool can produce ids and cannot
consume them:

```bash
for id in $(kg nodes find 'released > 2000'); do
  kg node "$id" --properties | sed -n 's/^title: //p'
done
```

Measured on the imported movies graph: **10.7 s for 133 nodes, against 0.66 s
for one process reading all 171.** Sixteen times, and it is not file reads —
`find` alone is 0.47 s of that 0.66 s. It is process spawns, about 80 ms each.

The `sed` is the other half. `--properties` returns every property as YAML, so
every caller re-parses the tool's own output to get one value back out.

## What it should look like

```console
$ kg nodes find 'released > 2000' | kg nodes --stdin --properties --json | jq -r '.[].title'
The Matrix Reloaded
Cloud Atlas
…
```

**The plural is the singular with its ids on stdin.** Same flag, same meaning;
only where the ids come from changes:

```
kg node <id> --properties          one id, in argv
kg nodes --stdin --properties      many ids, on stdin
```

**No projection.** An earlier version of this page had the command take names —
`kg nodes properties title released --stdin` — and that raised a question per
name: which verb, what happens when a name is carried by no node, one name or
several, and columns or objects for several. **Selecting is `jq`'s**, and the
command hands over what it has.

Each object carries its `id`, which the singular form does not need: with one
node the caller knows which, with many they do not.

**It does not need an action either.** *A collection has many read-shaped
operations, so one has to be named* — `list` enumerates, `find` selects. This
enumerates nothing: the caller already chose, and handed the ids over. What is
left to say is which view, and `--properties` says it, exactly as it does for
one node.

**Will be backed by** `batch 11 — resolution`, as `11_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

## Ids are shell-shaped, data is JSON

| | | |
|---|---|---|
| **ids** | one per line | a uuid has nothing to structure, and `wc -l`, `grep`, `cut` and `xargs` all work on it |
| **a closed set of names** | tab-separated | the tool knows them ahead of time, every row carries all of them, and a value provably cannot contain a tab |
| **an open set** | JSON | authored names, different per node, any of them optional, values that nest |

**The scope names the shape.** `kg node <id> --properties` is one object;
`kg nodes --stdin --properties` is an array. Plural in, plural out.

**This is not a `--json` mode.** A format flag spanning every command is the
global flag union one layer up — it forces one answer onto commands whose
outputs have nothing in common. The shape belongs to a command's contract, and
three commands' contracts differ because the things they return differ.
[`parked/structured-output.md`](../design/parked/structured-output.md) proposed
the flag; what it was really waiting for was this distinction.

**`links` and `backlinks` keep their tabs.** Three names the tool chose, on
every row. That is what lets `backlinks | grep '^directed' | cut -f3` answer two
of the guide's questions in one line each.

**Only that question decides the shape**, and it is not the question `set`
answers. A link's `type`, `from` and `to` are [fields](../spec/api.md) in the
batch 7 sense — its identity, which is a rule about writing and leaves the
output shape alone. So `link <id>`, which returns three known names beside
however many authored ones, is an object.

**`node <id>` still returns content byte for byte.** Wrapping prose in an
escaped string is strictly worse than handing it over, and an agent that asked
for the body wants the body.

## An object has no empty cell

This is why many nodes come back as objects rather than as a table — and it
holds whether or not anyone selects among them.

A column needs a value for a node that carries nothing, and the empty string is
a legal value — [`absence.md`](../design/absence.md) accepts `title: ""` as an
author writing nothing, while refusing every spelling of a null. So the store
holds **an empty value and no value as two different states**, and a table
cannot carry the difference: both are an empty cell.

That is a claim about what has to be *represented*, not about what a query
returns. `find` evaluates a predicate and hands back ids; it never carries a
value, so it cannot be the evidence here. The resolver is the command whose job
is the value, and it is the one that needs a shape able to say *nothing is
recorded* without saying *the recorded value is nothing*.

**A JSON object simply has no such key**, which is exactly how the frontmatter
represents it. Nothing is invented and nothing is lost:

```json
{"id":"01a0…","name":"Tom Hanks","born":"1956"}
{"id":"01a0…","name":"Naomie Harris"}
```

Five of the movies graph's 133 people carry no `born`. They are objects with one
key fewer, and no reader has to know which absence a blank meant.

**Two-valued absence is what makes that safe.** The set that was quiet is still
addressable — `find '"person" in labels and not born'` returns exactly those
five. Under three-valued logic they would fall out of both the query and its
negation, and be genuinely lost.

**An absent key, never a null.** JSON has no `undefined`, so omitting the key
*is* undefined to the consumer — `o.born === undefined`, which is what
[`absence.md`](../design/absence.md) settled. `null` is not merely unwanted
here, it is **unstorable**: the read door refuses YAML null in all five
spellings — `null`, `Null`, `NULL`, `~` and empty — so emitting one would be
output the tool cannot read back.

**Not because YAML is ambiguous.** `k: 'null'` parses as the string and `k:
null` as the null value, and `@std/yaml` round-trips the string quoted. What
YAML has is five spellings against JSON's one, and unquoted scalars, so the
distinction rests on quoting a hand-edit can drop — which matters in a repo of
files people open. In JSON, demoting `"null"` to `null` is not a typo, it is
invalid syntax.

**`jq -r` cannot see the difference, and a caller must.** Measured: an absent
key, a JSON null and the string `"null"` all print as the same four characters
under `jq -r .k`. Separating them takes `has("k")` or `// empty`.

This is the price of asking for several names at once. The single-name form has
no such trap — a node that carries nothing produces no line, and there is
nothing to mistake for a value.

## `--stdin` means what this command needs

It already does: content for `kg node <id> write --stdin`, ids for
`kg nodes --stdin`. One reading, not two, and per-command flags are what make it
unambiguous.

**Ids arrive on stdin or in argv, never both.** Two channels, not two paths:
they feed the same code and cannot diverge, and what separates them is a ceiling
rather than a meaning.

```
kg nodes --properties <id> <id> …        a handful, written out
kg nodes --stdin --properties            a pipeline, however long
```

`ARG_MAX` is 1 MB here, so 133 ids is about 5 KB and passes, while 100 000 is
3.7 MB and does not. A caller with three ids should not have to open a pipe, and
a caller with a hundred thousand cannot avoid one. `--with-nodes <id>...`
already takes a variadic id list, so argv is not a new shape either.

**Both at once is refused**, as is neither: one says which ids twice and the
other says nothing. `kg nodes --properties` alone names what is missing rather
than reading an empty stdin, which is the trap
[batch 4](4-stops-guessing.md) removed — *content is declared, not detected*.

## The labels, which the same rule pulls in

**`--properties` shows what the author wrote**, which is not the same as *the
keys the tool does not reserve*. `labels` is reserved and stays: the words in it
are the author's classification, written with a verb, and a flat list of words
reads perfectly inline. `links` goes: its entries are uuids and directions the
tool mints for its own bookkeeping, and the relation has two commands that
present them properly.

The coarser rule — hide everything reserved — would have needed a reader for a
node's labels to compensate, and an addition whose only job is to repair a
subtraction is a sign the subtraction was wrong.

**And `labels list` returns the names, one per line.** A directory read of
`labels/`, which is what the name says. It carries a count and a description's
first line today, and both are wrong there:

| | |
|---|---|
| the count | forces a parse of every node — **440 ms** for two lines of output on the movies graph, against **0 ms** for `nodes list` on the same space |
| the summary | the only place in the tool where unchecked prose reaches a tabulated output, which is why a tab in it made the row four columns |

The count is the sharper error, because it is the rule
[batch 9](9-find.md) wrote down being broken: *a flag would hide a
thousandfold cost behind an option*. A column hides it just as well. Whoever
wants counts can ask a question that names itself; nobody has asked yet.

The description is served where it belongs: `kg label <word>` reads that one
file, for the word you named.

## `--properties` gains a format, and nothing else

`kg node <id> --properties` shows the properties. All of them — `labels` and
`links` included, because those **are** properties, reserved against `set`
rather than hidden from a read. There is no content decision here, and an
earlier version of this page invented one: it had `links` leaving, then staying,
and both were answers to a question the model does not ask.

`spec/api.md` said the output was *a rendering rather than the stored block*,
and it is the block. That is not a flaw either, since the block is exactly the
properties — the sentence was wrong about the mechanism and right about the
result.

So the only change is the axis that was genuinely missing:

```console
$ kg node <id> --properties
released: '2012'
title: Cloud Atlas

$ kg node <id> --properties --json
{"released":"2012","title":"Cloud Atlas"}
```

The frontmatter is YAML, so that stays the default — the properties in the shape
they are held in. `--json` converts. One content, two formats, both from the
same object, which is what a format flag is for and not the drift two
*renderings* would be.

**Nothing about absence argues for JSON here.** *An object has no empty cell*
separates an object from a table, not JSON from YAML: a YAML mapping has
optional keys exactly as a JSON object does. That argument belongs to the
resolver below, where the alternative was columns.

**It is declared per command**, with that command's own contract — not the
global mode [`parked/structured-output.md`](../design/parked/structured-output.md)
proposed, which forces one answer onto outputs that have nothing in common. The
commands that stay line-shaped so pipes work take it too:

```
kg nodes find '<expression>'      one id per line, and `--json` for an array
kg labels list                    one word per line
```

## An entry carries its neighbour

A relation's entry is `{type, link, direction}`, where `link` is the **record's**
uuid. The node at the other end is in the record, so a node's own file cannot
answer *who am I connected to* — the most elementary question asked of it.

It gains a fourth field:

```yaml
links:
  - type: directed
    link: 01a090ed-513c-…        the record
    direction: in
    neighbour: 01a090ed-1ee8-…   the node at the other end
```

**The duplication is safe by construction.** `type`, `from` and `to` are the
record's immutable fields — [`spec/api.md`](../spec/api.md) says altering one
would make it a different link — and a fact that cannot change cannot drift.
That is already the argument that admitted `type` and `direction`; this applies
it to the third.

**It is not a performance change**, and that is worth saying because it looks
like one. A file read is about 69 µs, so resolving ten records costs well under
a millisecond against 300 ms of process startup. What it removes is a **join**:
the neighbour stops being somewhere else.

Which is what makes parking the shortcuts free rather than costly:

```bash
kg node "$CA" --properties --json \
  | jq -r '.links[] | select(.type == "directed" and .direction == "in") | .neighbour' \
  | kg nodes --stdin --properties --json \
  | jq -r '.[].name'
```

Four processes and no loop. `jq` does what `grep '^directed' | cut -f3` did and
does it better — a named field rather than a line prefix, and the direction too,
which the columns never exposed.

**`neighbour`, not `target` or `to`.** With `direction: in` the node at the
other end is the **source**, so either of those would be wrong half the time.
In a graph a neighbour is a neighbour, whichever way the edge points.

## The foundation before its shortcuts

`kg node <id> links` and `kg node <id> backlinks` are removed. They fuse two
reads — the node, then a record per relation — and a fusion is worth having once
both parts are stable, not while they are still moving. What they did, what it
cost to park them, and how they would be spelled if they return is in
[neighbours](../design/parked/neighbours.md).

Two of the guide's questions go back to a loop with them. That is the price, and
it is named rather than discovered.

## The naming convention, which the JSON makes due

A key is `validUntil` — typed and stored alike, nothing translated.
[`design/naming.md`](../design/naming.md) settles it, and this batch is where it
lands, because printing keys as JSON is the moment the form stops being an
internal detail.

What the code carries today is an earlier version of that page: a key typed in
kebab and translated to camelCase at the file. Three things go with the
translation —

- `asKey` and `asName` in `frontmatter.ts`, and the two call sites
- the segment rule that made the translation reversible, which only existed for it
- the asymmetry where a caller read `validUntil` and typed `valid-until`

**A label word does not move.** `acted-in` stays kebab, enforced at the door,
because the file is the word and a case-insensitive filesystem merges
`actedIn.md` with `actedin.md`. Values do not move either: they are stored as
given.

## What it leaves

Ordering the results · `~` over prose · the reserved operands · traversal, which
stays in commands.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · [9](9-find.md) · [10](10-one-writer.md) · 11
