# Batch 10 — one writer for the frontmatter

**Done when** every file carrying frontmatter is read, changed and written in
one place, and what it writes is the YAML a person would write by hand.

Shipped. No new capability: everything here already exists, and this changes
where it lives, corrects what it does, or removes a choice that outlived its
reason.

## Not a batch like the others

Like [batch 4](4-stops-guessing.md), there is no loop to demonstrate — the loops
are the same and should look the same afterwards. Its test is a list of things
that must stop happening, as `batch 10 — one writer for the frontmatter` in
[`tool/tests/batches/10_test.ts`](../../tool/tests/batches/10_test.ts):

```console
$ printf 'A film.\n' | kg label movie write --stdin
$ cat .kg/labels/movie.md
---
requires: [title]                    # survives — today it is erased
---

$ kg node <id> link --as cites --with-nodes <b>
$ git diff
+  - direction: out                  # three lines added, none rewritten
+    link: 01a0…
+    type: cites

$ kg labels list                     # a description whose first line holds a tab
tabbed<TAB>0<TAB>summary with a tab  # three columns, never four

$ kg node <id> set probe $'￿'
not a property value: …              # a noncharacter is not printable text
```

## The discipline lived on the wrong object

`node.ts` reads a file, copies its properties, applies a change and writes both
halves back through a temporary file and a rename. That is correct, and it is
attached to `nodes/<uuid>.md` rather than to *a markdown file with frontmatter*.

Labels are the second thing wearing that form, and they got a partial
reimplementation instead of the same one. Measured across the four files that
write:

| | writes | carries both halves | atomic |
|---|---|---|---|
| `node.ts` | 3 | yes | yes |
| `label.ts` | 2 | **no** — `join("", …)`, empty in hard code | **no** |
| `link.ts` | 2 | n/a — JSON records | **no** |
| `space.ts` | 1 | n/a — `.gitattributes` | **no** |

Both failures are invisible because the file that comes out is still valid.
`spec/storage.md` meanwhile states *"Writes are atomic"* as a property of the
tool, which is true of one file in four.

## A document, not a set of functions

The frontmatter is YAML. So the thing to own is a **handle**: open the file,
get the parsed object, change it, flush.

```
open(path)        loaded · absent · malformed · unparseable
blank(path)       a document not yet on disk — `node new`, `label ensure`
doc.flush()       both halves, temp then rename
```

**Nothing is lost because the handle holds both halves.** `label write` failed
by starting from an empty string; a handle cannot, because it was opened before
it was changed.

**It needs no guards of its own.** `properties` is `Record<Name, Value>` with
branded types, so an unchecked string will not go in —
[`boundaries.md`](../design/boundaries.md) already made the check the only route
to the type, and the handle inherits it.

**Its boundary is narrow.** It does not know where files live, what a name
means, or how an id is minted — those stay with `space.ts`, `frontmatter.ts` and
`node.ts`. And nothing else may call `Deno.writeTextFile` on a `.md` file, which
is checkable rather than remembered.

**One thing it can lose that a callback could not: a flush.** That is a write
that does not happen, where nothing changes — against a silent destruction,
which is what happens today.

## Pure YAML, because the data changed under the rule

`flowLevel: 1` keeps a sequence on one line, chosen in
[batch 3](3-lists.md) when a list was a list of words and justified as *keeps
diffs minimal*. [Batch 7](7-relations.md) added lists of maps without revisiting
it, and the argument inverts:

```
labels: [movie]                      one line, and the diff is minimal
links: [{type: …}, {type: …}, …]     one line, rewritten whole on every change
```

Measured: adding one link to a node that had two rewrites the entire `links`
line, and that line grows with the node's degree — Cloud Atlas carries ten, at
about seven hundred characters.

So block style throughout, which is also what every markdown frontmatter in the
wild uses, and what someone opening the file by hand expects. `labels` costs a
line. Reading does not change — YAML parses both — and existing files are
rewritten on their next write.

## What it deliberately leaves

**`--properties` is not reshaped, though its output changes.** It prints the
canonical serialisation, so block style reaches it necessarily — a list now
spans lines, which also makes batch 3's point plainer than flow style did: a
real list is visibly several lines, a scalar that merely looks like one stays
quoted on one. What is *not* touched is the shape: that it prints `links` as
storage rather than as an answer, and that its format is neither line-oriented
nor parseable, belong to [batch 11](11-resolution.md).

**The missing readers.** Nothing reads one property by name, nothing reads a
node's labels, and nothing consumes ids. Those are additions, and this batch
adds nothing.

## What it unblocks

Writing `requires:` into a label's frontmatter stops being a gap to fill and
becomes what the handle already does for nodes — which is what
[`parked/validation.md`](../design/parked/validation.md) was missing a mechanism
for.

A concurrency guard — write only if the file has not moved since it was read —
is the one function the future adds, and
[`parked/partial-edits.md`](../design/parked/partial-edits.md) needs it. It
cannot be placed correctly while four files write on their own.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · [9](9-find.md) · 10 · [11](11-resolution.md)
