# Storage

What a node is on disk, and how the tool writes one. [`api.md`](api.md) is the
surface; this is what sits underneath it.

## The shape

```
<repo>/.kg/
├── .gitattributes
└── nodes/{id}.md
```

**`.gitattributes` says `* -text`**, written by `space init`. The tool writes LF
and is the only writer, so git must not convert in either direction — a checkout
on Windows leaves a space byte-identical. A nearer rule beats the enclosing
project's, so a space living beside application code imposes nothing on it and
inherits nothing from it.

`text eol=lf` would also produce LF, by normalising on commit — which is git
editing content the tool is custodian of. Nodes are **LF only**, and a file with
CRLF does not parse rather than being half-handled.

**At the repository root.** A space sits at `.kg/` in a repository's root, so
`space init` finds the root rather than using the working directory — run it
three directories down and the space still appears at the top.

**No manifest.** The `.kg/` directory is what marks a space; nothing inside has
to assert it.

**The space's name is the repository directory's name.** Not minted, not stored,
not derived from a remote — read off the directory when anyone needs it. It
travels when the repository is moved or cloned, exactly as a node's name travels
with its file ([location](../design/location.md)).

## A node

Frontmatter and a body, the id being the filename and appearing nowhere inside
it ([location](../design/location.md)):

```
---
---

```

**The frontmatter block is written even when it holds nothing**, so a node is
always well-formed and the reader can stay strict. The tool is the only thing
that writes either half — a node's content arrives at creation or not at all,
and nothing outside opens the file to supply it.

## Identity

**Ids are UUIDv7**, lowercase, canonical hyphenated form. Unique without
coordination, and lexicographically ordered by their 48-bit timestamp — so a
directory listing is in creation order for free, with no field carrying a date,
and creation time is readable back out of the name itself.

Ordering is to the **millisecond**. Two nodes minted inside the same millisecond
sort by their random bits, in no meaningful order. Nothing depends on which of
two simultaneous nodes comes first, and nothing should.

**`created` is read out of the id, never stored.** UUIDv7 carries its creation
time in its first 48 bits, so the tool computes it on the way out. There is no
`created:` field in any node, and none is wanted: it would be a second copy of a
number already in the filename, free to drift from it.

**Any uuid is accepted as well formed, not only the v7 the tool mints.** A v4 is
a plausible id this tool never issued, which makes it honestly *absent* rather
than refused — and checking for v7 specifically would tie the validator to a
minting scheme that is deliberately free to change.

There is no fallback for a name that is not an id. Nothing but the tool writes
into `nodes/`, and every name it mints is one — so a file named otherwise means
the space is broken, and returning a row without a creation time would hide
that.

## Reading

**Scalars are read under YAML 1.2 core** — null, bool, int, float, string, and
nothing else. The default schema turns `2027-01-01` into a date, which would be
the tool deciding what a field it has never heard of means. The reader is held
to it from the start, before anything writes such a value.

**A value is a single line of printable text**, and so is each element of a
list — no control characters. The reason is what a property is *for*, not
storage and not rendering: YAML would happily carry a newline as `"a\nb"`, and
[api](api.md) has the argument — **a value wanting several lines is content, and
content is what the body is for.**

One thing follows that the rest of the surface leans on: since a value cannot
hold a tab, **every tab-separated output is lossless by construction** — which
is why `links`, `backlinks` and `labels list` may use one.

**A property holds one value or several.** Several is multiplicity on one
dimension, not a container — a node carrying `auth` and `pattern` under
`labels` is saying two things on one dimension, the way `title: Cloud Atlas`
says one. Anything that is
neither a value nor a list does not read at all.

**A block is read only if the tool could have written it.** A property name that
is not a lowercase hyphenated token, or a value carrying a control character,
refuses the node rather than loading — otherwise it would display a property no
command could then unset. [`design/boundaries.md`](../design/boundaries.md)
argues why, and names the one exception: a reserved name still reads.

**A link is a record.** `.kg/links/<uuid>.json` — JSON, not markdown, because a
link carries no prose, so a body would be dead weight and none of frontmatter's
coercion applies. Each endpoint holds an entry under the reserved `links`
property; that is the one nested shape in the format, validated against exactly
`{type, link, direction}`, and nothing authored may nest.

**A label is a file, and the file is the word.** `.kg/labels/<word>.md`, with
the description as its body — the same format a node has. Created the first time
the word is used, so the vocabulary is materialised rather than derived.

**A property's value is stored as a string, always.** The serialiser quotes
only what would otherwise change type on the way back — `hello world` stays
bare, `'42'` and `'2027-01-01'` keep their quotes. Those quotes are the tool
*preserving* that it was handed text, not deciding what the text means.

**Splitting frontmatter is a regex and one `parse` call.** `@std/front-matter`
was dropped for this: its `extract()` accepts no options, so there is no way to
hold the parser to the core schema through it.

### A node that will not parse

**The graph is not written or repaired by hand.** Nothing about it is meant to
be legible without the tool, and every node it holds it wrote itself — which is
what lets the reader stay strict, and what makes the line-ending guard above
sufficient rather than merely helpful.

But the tool is not the only writer of the *file*. Git resolves a merge inside
one, and can leave conflict markers in a node the tool owns. So it has to be
able to read what it did not write, and say so.

A command **naming that node exits `1`** — the caller asked about that node and
the tool cannot honour it. `nodes list` is unaffected: it reads the directory
and never opens a file, so a damaged node lists like any other and is only found
when something asks about it.

Nothing attempts repair. Detecting damage systematically is a later concern.

## Writing

**A node's writes are atomic**: a temporary file in the same directory, then a
rename. An interrupted rewrite would corrupt the one thing the tool is custodian
of. Rename is atomic on every filesystem that matters; write-in-place is not.

**Labels and link records are not written that way**, and that is a defect
rather than a decision — the discipline is attached to `nodes/<uuid>.md` instead
of to the form, so the second and third things wearing it never received it.
[Batch 10](../batches/10-one-writer.md) moves it.

**Serialisation is canonical** — frontmatter keys alphabetical, sequences in
block style, one element per line. A property write is read-modify-write over
the whole block: every other key survives it, and so does the content. The tool
is the only writer, so canonical output costs nothing.

It was `flowLevel: 1` until [batch 10](../batches/10-one-writer.md), chosen when
a list was a list of words and justified as keeping diffs minimal. Lists of maps
arrived with relations and the argument inverted: adding one link rewrote a line
that grows with the node's degree. Block style is also what every markdown
frontmatter in the wild uses, and what someone opening the file by hand
expects.

**A key with nothing in it is removed, not emptied**, so a node whose last
value was dropped serialises back to `---\n---\n\n` — byte for byte what a
node with nothing said about it looks like. Why that matters is
[`batches/9-find.md`](../batches/9-find.md)'s: absence is two-valued, so a
property that is gone and one that was never written must be the same byte.

---

[docs](../README.md) · [spec](README.md) · [api](api.md) · storage · [git](git.md)
