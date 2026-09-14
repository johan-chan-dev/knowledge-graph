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

The `sed` is the other half. `--properties` prints YAML that a caller then
re-derives with a line-matching expression, which is not parsing a format so
much as guessing at one.

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
kg node <id> --properties               one id, in argv
kg nodes --properties <id> <id> …       a handful, in argv
kg nodes --stdin --properties           a pipeline, on stdin
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

## Ids are shell-shaped, properties are a mapping

| | | |
|---|---|---|
| **ids and names** | one per line | a uuid has nothing to structure, and `wc -l`, `grep`, `cut` and `xargs` all work on it |
| **properties** | a mapping — YAML, or JSON with `--json` | authored names, different per node, any of them optional, values that nest |

A third row stood here — *a closed set of names, tab-separated* — and this batch
empties it. `kg labels list` becomes one name per line and
`kg node <id> links` is removed, which leaves `kg link <id>` as the only tabbed
output, and its set is not closed: three fields the tool names, beside however
many properties an author wrote.

**So `kg link <id>` follows the same rule as everything else here**: a record is
a document of properties — below, that is what it becomes on disk too — so it
prints as a mapping, YAML by default and JSON with the flag. Which leaves the
tool with **no tab-separated output at all**, and the row is gone rather than
emptied.

**The scope names the shape.** One node's properties are one thing; many nodes'
are an array of them. Plural in, plural out, in whichever format.

**`kg nodes find '<expression>'` and `kg labels list` stay line-shaped by
default**, because a line is what `wc -l`, `grep`, `cut` and `xargs` work on,
and that is how their output composes.

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
value, so it cannot be the evidence here. `kg nodes --stdin --properties` is
the command whose job is the value, and it is the one that needs a shape able to
say *nothing is recorded* without saying *the recorded value is nothing*.

**A mapping simply has no such key** — in either format — which is exactly how
the frontmatter represents it. Nothing is invented and nothing is lost:

```json
[{"id":"01a0…","name":"Tom Hanks","born":"1956"},
 {"id":"01a0…","name":"Naomie Harris"}]
```

Five of the movies graph's 133 people carry no `born`. They are objects with one
key fewer, and no reader has to know which absence a blank meant.

**Two-valued absence is what makes that safe.** The set that was quiet is still
addressable — `find '"person" in labels and not born'` returns exactly those
five. Under three-valued logic they would fall out of both the query and its
negation, and be genuinely lost.

**An absent key, never a null.** Omitting the key is undefined to the
consumer — `o.born === undefined` — which is what
[`absence.md`](../design/absence.md) settled. And `null` is not merely unwanted
here, it is **unstorable**: the read door refuses it in all five YAML
spellings — `null`, `Null`, `NULL`, `~` and empty — so emitting one would be
output the tool cannot read back.

**`jq -r` cannot see the difference, and a caller must.** Measured: an absent
key, a JSON null and the string `"null"` all print as the same four characters
under `jq -r .k`. Separating them takes `has("k")` or `// empty`.

That is the price of a structured answer, and it is the consumer's to pay
knowingly: the command hands over what it has, and `jq` decides what to do with
an absence.

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

## `kg labels list` returns names

**`kg labels list` returns the names, one per line.** A directory read of
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

## `--properties` gains a format, and resolves what it shows

`kg node <id> --properties` shows the properties. All of them — `labels` and
`links` included, because those **are** properties, reserved against `set`
rather than hidden from a read. There is no content decision here, and an
earlier version of this page invented one: it had `links` leaving, then staying,
and both were answers to a question the model does not ask.

`spec/api.md` said the output was *a rendering rather than the stored block*,
and it is the block. That is not a flaw either, since the block is exactly the
properties — the sentence was wrong about the mechanism and right about the
result.

Two things change, and they are independent. The first is a format:

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

The second is what the `links` entries carry, which is the next section.

**Nothing about absence argues for JSON here.** *An object has no empty cell*
separates an object from a table, not JSON from YAML: a YAML mapping has
optional keys exactly as a JSON object does. That argument belongs to the
plural form below, where the alternative was columns.

**It is declared per command**, with that command's own contract — not the
global mode [`parked/structured-output.md`](../design/parked/structured-output.md)
proposed, which forces one answer onto outputs that have nothing in common. The
commands that stay line-shaped so pipes work take it too:

```
kg nodes find '<expression>'      one id per line, and `--json` for an array
kg labels list                    one word per line
```

## An entry is enriched on the way out, not on disk

A relation's entry is `{type, link, direction}`, where `link` is the **record's**
uuid — so a node's own file cannot answer *who am I connected to*, the most
elementary question asked of it.

**The file does not change.** The command resolves it:

```console
$ kg node <id> --properties --json
{"links":[{"type":"directed","link":"01a090ed-513c-…","direction":"in",
           "neighbour":"01a090ed-1ee8-…","since":"2012"}]}
```

`neighbour` is the node at the other end, and `since` is the relation's own
property — both read out of the record when the question is asked.

**Enriching beats duplicating.** An earlier version of this page put `neighbour`
in the entry on disk, and duplication has to be kept true; resolving has
nothing to keep. There is no migration either, since nothing stored moves.

**Its cost is the one already measured.** A file read is about 69 µs, so ten
relations add well under a millisecond inside one process — against 80 ms for a
process. A node with ten thousand relations pays 0.7 s, which is the same price
`backlinks` paid and the reason the read happens once per command rather than
once per relation.

**`neighbour`, not `target` or `to`.** With `direction: in` the node at the
other end is the **source**, so either would be wrong half the time. In a graph
a neighbour is a neighbour, whichever way the edge points.

## Which reopens what a record is stored as

`storage.md` says `.kg/links/<uuid>.json` is *JSON, not markdown, because a link
carries no prose, so a body would be dead weight and none of frontmatter's
coercion applies*. The first half is right and argues against **markdown**. The
second is wrong — a record's properties obey a node's rules, and `link.ts` calls
the same `isName` and `isValue` as everything else. Neither half argues JSON
over YAML.

**And the format is what excluded records from batch 10.** `link.ts` writes with
a bare `Deno.writeTextFile`: no temporary file, no rename, no read-modify-write.
The discipline went to documents with frontmatter, and a record was not one.

So `.kg/links/<uuid>.yaml` — a properties document, same rules, same serialiser,
and inside the one writer that batch 10 established.

## `document.ts` holds two file formats

It becomes the custodian of two on-disk forms rather than one:

```
markdown     ---\n<yaml>\n---\n\n<content>        nodes, labels
yaml         <yaml>                               link records
```

Only two things differ: what `open` separates, and what `flush` assembles. The
atomic write, the failure vocabulary and the rule that a write carries
everything it read are the same for both.

**The shape is named by the caller, not inferred from the extension.**
`node.ts` and `label.ts` want markdown, `link.ts` wants YAML, and each knows
which. Guessing from `.md` or `.yaml` would be detection where this tool
declares — the rule [batch 4](4-stops-guessing.md) settled.

**Two handles, not one with an optional half.** A markdown document has content
and a record does not, so a single type with an optional `content` would invite
setting one on a record and then have to decide whether that is dropped or
refused. Two types make the question unaskable.

**`link.ts` shrinks the way `label.ts` did in batch 10**, and gains what it
lacks: the temporary file and the rename, and a write that carries what it read.
It keeps where records live and how one is created; the rest becomes calls.

## The shortcuts, emptied

`kg node <id> links` and `kg node <id> backlinks` are removed, and the
enrichment above is why: they existed to join a node's entries with each record,
and `kg node <id> --properties` now does that join itself. What is left of them
is a filter over the result, which `jq` does — and does better, since the
direction was never reachable from the columns.

**No question of the guide's goes back to a loop.** A pipeline is one `jq`
longer than it was. What is left of them is a convenience, and a shortcut earns
itself against a caller who keeps writing the same filter — which is what
[neighbours](../design/parked/neighbours.md) records, along with the spelling it
would take if one turns up.

## The naming convention lands here

A key is `validUntil` — typed and stored alike, nothing translated.
[`design/naming.md`](../design/naming.md) settles it, and this batch is where it
lands: a key printed for a program to read is the moment its form stops being an
internal detail, in either format.

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

Ordering the results · `~` over prose · the reserved operands · counting the
words in a vocabulary, which nobody has asked for · a shortcut over the `links`
entries, if a caller ever writes the same `jq` filter enough times
([neighbours](../design/parked/neighbours.md)).

**Traversal beyond one hop.** `kg node <id> --properties` resolves a node's own
relations and stops there; reaching two hops is two calls, and the guide's
*three hops from Kevin Bacon* stays out of reach. That is
[batch 9](9-find.md)'s deferral unchanged — the price of not having pattern
syntax, measured against a real guide rather than guessed at.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · [9](9-find.md) · [10](10-one-writer.md) · 11
