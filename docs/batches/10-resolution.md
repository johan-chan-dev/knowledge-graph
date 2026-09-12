# Batch 10 — resolution

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

**Will be backed by** `batch 10 — resolution`, as `10_test.ts` in
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
a legal value — so an absent property and `title: ""` would render identically.
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

## `--stdin` means what this command needs

It already does: content for `write`, ids for a resolver. One reading, not two,
and per-command flags are what make it unambiguous.

**Ids arrive only on stdin.** There is no argv form, because a single node is
already `kg node <id> --properties` — a second path to the same answer is the
drift this repo deletes rather than documents.

## What it fixes on the way

**`links` leaks into `--properties`.** Today a node with relations prints them
as flow-style YAML on one line, unreadable and needing a parser:

```
links: [{type: acted-in, link: 01a090ed-4f71-…, direction: in}, …]
```

That is storage, not an answer — the relation has two commands that present it
properly. `--properties` stops carrying it.

**`labels list` can emit four columns.** A description's first line is free text
and never passes `isValue`, so a tab in it becomes a column separator:

```
tabbed\t0\tsummary\twith a tab
```

It is the one tab-separated output mixing checked values with unchecked prose.

## What it leaves

Ordering the results · `~` over prose · the reserved operands · traversal, which
stays in commands.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · [9](9-find.md) · 10
