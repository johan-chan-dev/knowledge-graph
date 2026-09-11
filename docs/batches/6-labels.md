# Batch 6 — the labels system

**Done when** classification is a slot the tool knows about, and a space can be
asked what words are in play.

Built. [`vocabulary.md`](../design/vocabulary.md) borrowed a sentence in batch
2 — **labels classify, properties hold data** — and then flattened it. `labels`
became an ordinary property, indistinguishable from `tags` or `topics`.

## The loop

```console
$ kg node new --with-labels auth decision --stdin
01a084f0-631b-7bba-a6fe-81d79faedbde

$ kg node "$a" label pattern
labelled 1

$ kg node "$a" unlabel decision
unlabelled 1

$ kg label auth write --stdin
wrote 30 bytes

$ kg label auth
how a request proves who it is

$ kg labels list
auth	1	how a request proves who it is
decision	0
pattern	1

$ kg label pattern forget
forgot pattern
```

`decision` survives at `0` because the word outlives its last use. The columns
are tab-separated, and alphabetical order is what puts `auth` beside `authn`.

And the refusals:

```console
$ kg node "$a" add labels auth
labels is reserved — it is how a node classifies, written with `label`

$ kg node "$a" label "Auth Pattern"
not a label: Auth Pattern — expected a lowercase hyphenated token
```

**Backed by** `batch 6 — the labels system`, in
[`tool/tests/batches/6_test.ts`](../../tool/tests/batches/6_test.ts).

## Why this earns a reserved name

[`structure.md`](../design/structure.md) says the reserved list grows **when the
format grows, and at no other time** — *if edges become part of a node's shape
rather than a property of it, they qualify.* Classification becoming part of a
node's shape is exactly that, and it is the model this design already claims to
have borrowed.

The test that fails other candidates is *whose claim is it?* A description is
text the tool holds without reading, the same as a body. Where a practice's
**judgement** would have to be encoded, the answer stays no.

## What the tool gains that it cannot have today

**One spelling.** Nothing currently stops one practice using `labels`, another
`tags`, another `topics`. Reserving the name makes classification a single slot,
which is what makes the next line possible at all.

**`kg labels list`.** Every word in use, with counts. You cannot compute that
over *whichever property somebody chose*, and without it an agent arriving at a
space learns the vocabulary by reading every node.

**A token shape on the values** — `[a-z0-9]+(-[a-z0-9]+)*`, the rule property
names already follow. Today `add labels "Auth Pattern"` is accepted, because a
value is only required to be single-line text. A word two people must arrive at
independently cannot be one that needs quoting — and the same restriction makes
a label safe as a filename, with nothing to escape.

## A label is a file, and the file is the word

```
.kg/labels/auth.md      frontmatter, then the description as the body
.kg/labels/auth.json    which nodes carry it — rebuildable, unversioned
```

**The file is created the first time the word is used.** `label auth` on a node
ensures `labels/auth.md` exists, empty and ready for a description. So the
vocabulary is materialised rather than derived, and `labels list` is a directory
read — O(words), not O(nodes), and flat regardless of how large the space grows.

It is the format a node already has, so `split`, `read` and `join` apply
unchanged, meta properties have somewhere to live later, and a description is
simply the body.

**The word outlives its last use.** When the last node drops `auth`, the file
stays: the vocabulary is a record of what has been said here, and a word that
fell back to zero is still a word that was used. Only `label auth forget`
removes it.

**`label`, singular, is a scope** — `node`/`nodes` becoming `label`/`labels`.
The word is also the verb on a node, and position tells them apart the way it
already does for `new`, `list` and `init`, none of which mean anything outside
their own slot. First word to hold both roles, so it is stated rather than
discovered.

**Writing a description is `write --stdin`**, not a value, because a description
is a body. [`api.md`](../spec/api.md) already says a value wanting several lines
is content, and a one-line flag argument would have contradicted the file it
writes to.

## The vocabulary stays open

A label file could have been two different things, and the batch has to pick:

| | a controlled vocabulary | **an open one** |
|---|---|---|
| `kg node <id> label auth`, no file yet | refused — declare it first | **creates it** |
| what a label file is | permission to use the word | the word itself, and what it means |

**Open, and it is not a close call for a knowledge graph.**
[`vocabulary.md`](../design/vocabulary.md) already argues it: which groupings
exist is not knowable when the first piece is written, and a subject becomes
visible only once enough material shares it. A registry inverts that — it wants
the scheme before the material — and charges for it at the worst possible
moment, when the thing just understood fits none of the allowed words. The
author then either forces it into a word that is wrong or stops to amend the
registry, and both are worse than writing the word they meant.

A controlled vocabulary is also machinery for keeping *many people* on the same
words. That is a real problem and it is not this one.

**What it would have bought is drift** — `auth`, `authn` and `authentication`
splitting one idea three ways. Open vocabulary does not prevent that; `labels
list` makes it *visible*, because `auth 12` beside `authn 1` is the answer and
the fix in one line. Detection rather than prevention, which is the same trade
the tool makes everywhere else it declines to guess.

## What it does not do

**No index yet.** `labels/{name}.json` is in the layout because the shape is
decided, not because this batch writes it. Listing the words costs a directory
read either way; what the index would remove is the **count**, which today means
one parse per node — measured at 55 ms for 1 000 nodes and 600 ms for 10 000.
[`vocabulary.md`](../design/vocabulary.md) argues an accelerator earns itself
only once computing is measurably too slow, and 600 ms is not that. Whenever it
arrives it is unversioned, so nothing can mistake a rebuildable thing for the
answer.

**No finding by label.** That is [batch 7](7-find.md).
[Batch 4](4-stops-guessing.md) removed `--where` for putting a query behind a
flag, and `nodes list --label auth` would be the same mistake in a smaller coat.

**No renaming across the space.** `auth` will want to become `authn` one day,
and a rename touches every node carrying the word.

**It takes a name batch 3 was using.** That batch's example list property was
`labels`; its transcript and test now say `sources`. The capability it settled
is untouched — only the word it had borrowed has moved.

**`--with-labels` is served by the parser there is.** It takes its first value
from the flag and the rest from the positionals that follow, which works and is
not how it should be done. [`design/parked/arguments.md`](../design/parked/arguments.md)
records the tokeniser that replaces it, and why the surface was chosen first.

**No opinion about what a word means.** The tool holds a description the way it
holds a body: it stores the text and never reads it.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · 6 · [7](7-find.md)
