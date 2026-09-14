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
$ kg nodes find 'released > 2010 and released < 2015' | kg nodes properties title released --stdin
[
  {"id":"01a090ed-4ac5-76b1-a3ae-dc5c97394e86","title":"Cloud Atlas","released":"2012"}
]

$ kg node 01a090ed-4ac5-76b1-a3ae-dc5c97394e86 --properties
{"id":"01a090ed-4ac5-76b1-a3ae-dc5c97394e86","labels":["movie"],"title":"Cloud Atlas","released":"2012","tagline":"Everything is connected"}
```

**Will be backed by** `batch 11 — resolution`, as `11_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

## Ids are shell-shaped, data is JSON

| | | |
|---|---|---|
| **ids** | one per line | a uuid has nothing to structure, and `wc -l`, `grep`, `cut` and `xargs` all work on it |
| **a closed set of names** | tab-separated | the tool knows them ahead of time, every row carries all of them, and a value provably cannot contain a tab |
| **an open set** | JSON | authored names, different per node, any of them optional, values that nest |

**The scope names the shape.** `kg node <id> --properties` is one object;
`kg nodes properties …` is an array. Plural in, plural out.

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

This is the whole reason resolution can carry several names where a table
could not.

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

## A name nothing carries

Property names are open, so nothing validates the one you asked for. A typo
therefore answers successfully:

```console
$ kg nodes find '"movie" in labels' | kg nodes properties tilte --stdin
[{"id":"01a0…"}, {"id":"01a0…"}, … ]
```

Thirty-eight objects carrying only `id`, exit `0`, and indistinguishable from a
name no node happens to use. That is the silence
[batch 4](4-stops-guessing.md) removed `--where` for.

It cannot be a refusal — `tilte` is unused, not invalid. So the tool says so on
stderr: **`no node carries tilte`**, and only when the count is zero. Where five
of 133 lack `born` the caller can count the objects missing the key, and
repeating it is telling them what they already hold. Zero is different: it reads
as a typo, and the tool knows something the caller does not — that the name is
unused across the whole set it just read.

## `--stdin` means what this command needs

It already does: content for `write`, ids for a resolver. One reading, not two,
and per-command flags are what make it unambiguous.

**Ids arrive only on stdin.** There is no argv form, because a single node is
already `kg node <id> --properties` — a second path to the same answer is the
drift this repo deletes rather than documents.

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

## Showing a file, or answering

`kg node <id> --properties` prints the frontmatter block, byte for byte — the
same serialiser writes both. [`spec/api.md`](../spec/api.md) claimed the
opposite from the start, *a rendering is the tool answering rather than showing
its file*, and the claim is what kept the gap invisible: it justified the shape
by asserting it was already an answer.

**What makes it a dump is its content, not its format.** A node with relations
carries `links` — uuids and directions the tool mints for its own bookkeeping —
and a file holds that where an answer does not. So `links` leaves, and the two
commands that present a relation properly keep it.

`labels` stays: the words in it are the author's classification, written with a
verb, and a flat list of words reads perfectly inline.

## Format is the other axis

The frontmatter is YAML, so that is what `kg node <id> --properties` prints —
the properties in the shape they are held in. `--json` converts:

```console
$ kg node <id> --properties
released: '2012'
title: Cloud Atlas

$ kg node <id> --properties --json
{"released":"2012","title":"Cloud Atlas"}
```

One content, two formats, both produced from the same object — which is what a
format flag is for, and not the drift two *renderings* would be.

**Nothing about absence argues for JSON here.** *An object has no empty cell*
distinguishes an object from a table, not JSON from YAML: a YAML mapping has
optional keys exactly as a JSON object does. That argument belongs to the
resolver below, where the alternative was columns.

**It is declared per command**, with that command's own contract — not the
global mode [`parked/structured-output.md`](../design/parked/structured-output.md)
proposed, which forces one answer onto outputs that have nothing in common. The
commands that stay line- or column-shaped so pipes work take it too:

```
kg nodes find '<expression>'      one id per line, and `--json` for an array
kg node <id> links                tab-separated, and `--json` for objects
kg node <id> backlinks            the same, filtered the other way
kg labels list                    one word per line
```

The tabbed default is what makes `kg node <id> backlinks | grep '^directed' |
cut -f3` answer question 10 in one line.

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
