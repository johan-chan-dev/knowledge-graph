# Batch 12 — the vocabulary

**Done when** a label word and a relation type are spelled the way openCypher
spells them, and no name this tool stores would need a backtick in a pattern.

[`design/naming.md`](../design/naming.md) settles the whole of it. This page is
where it lands, and what it costs on the way.

## What it has to fix

**The vocabulary on disk is an artefact, not a decision.** `conformance/convert.ts`
reaches it through

```js
s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase()
```

which is **one-way**: `acted-in` may have come from `ACTED_IN`, `acted_in` or
`actedIn`, and nothing on disk says which. What reads as the store's own form is
Neo4j's, hashed.

**And the mismatch fails silently.** The movies dataset is the most reproduced
graph example there is, so a Cypher-trained reader writes `:Person` and
`:ACTED_IN` unprompted. Against a case-folded store that is **zero nodes, exit
0** — a plausible answer to the wrong question, which is what
[batch 4](4-stops-guessing.md) removed `--where` for producing. Cypher is
explicit that this is not style: *"`:PERSON`, `:Person` and `:person` are three
different labels"*.

**The key gate refuses whole vocabularies for nothing.** `NAME` demanded
camelCase, which rejects 68 of GitHub's 86 API keys. It prevented no
fragmentation that occurs — `releaseDate` and `releasedate` both pass any shape
rule — and a key names no file, so there was never a collision for it to catch.

## What it should look like

```console
$ kg labels list
Movie
Person

$ kg types list
ACTED_IN
DIRECTED
PRODUCED

$ ls .kg/labels/ .kg/types/
.kg/labels/:  movie.md  person.md
.kg/types/:   acted-in.md  directed.md  produced.md

$ cat .kg/labels/movie.md
---
word: Movie
---

$ kg node 01a0…7c2f label MOVIE
cannot create the label MOVIE: it folds to movie.md, which holds Movie

$ kg node 01a0…7c2f set release_date "2000-03-31"
$ kg node 01a0…7c2f --properties
release_date: 2000-03-31
```

The word is stored as written and lives in the file's frontmatter, because the
fold is lossy and cannot be read back out. A second word landing on the same
file refuses and names the one holding it.

**Backed by** [`12_test.ts`](../../tool/tests/batches/12_test.ts), and by the
import below.

## What validates it

The conformance import, re-run. It reached `person` and `acted-in` through the
translation above; it now writes `Person` and `ACTED_IN` because that is what
`movies.cypher` says, and `convert.ts` has lost its name function entirely. The 133 people, 38 films and 253 relations are unchanged —
only their vocabulary is, which makes the import the one test that covers every
site at once.

## The sequence

Each step leaves the tool working and its tests passing.

| | | why here |
|---|---|---|
| **1** | one word rule for keys, labels and types | self-contained, and it *removes* a divergence: `isName` and `isLabel` stop disagreeing. Everything after is written against the final rule |
| **2** | the slug, and the word into the label's frontmatter | needs step 1 to know what a word is. `label.ts` stops treating the filename as the word |
| **3** | a collision refuses at creation | needs step 2 — there is no slug to collide in before it |
| **4** | a relation type becomes a record of its own, `types/<slug>.md` | the same mechanism as steps 2 and 3, applied to the second vocabulary; `link.ts` stops gating the type on `isLabel` and starts referring to the store |
| **5** | the import stops translating | last, because it is the one place that rewrites stored data, and every reader it feeds is settled by then |

**Step 5 is the one that touches stored data**, and there is no migration
command. The conformance space re-imports; any other space is re-created. Same
rule as batch 11's step 3, for the same reason — a tool that rewrites a corpus
in place is a different tool.

## What this batch does not get to do

**The floor has no site yet.** `naming.md` requires that an unknown label word
refuse and name its near neighbour rather than return empty. There is nowhere to
put it here: the only place a label word appears is as a *value* inside
`find '"Person" in labels'`, and refusing an unknown value would break the
two-valued rule [absence](../design/absence.md) is built on — a comparison that
cannot be made is false, not an error.

The lookup site arrives with `(:Person)` in [batch 14](14-match.md), and the
floor goes there.

## What it leaves

Diacritic transliteration is specified and lands here; **normalisation beyond
it is not** — `Straße` and `Strasse` are two words and two slugs. Unicode
confusables in general stay out of scope, as does any equivalence beyond NFD.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md) · 12 · [13](13-output.md) · [14](14-match.md)
