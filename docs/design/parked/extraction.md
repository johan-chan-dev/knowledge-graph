# Extraction, and its anchor

```console
$ kg nodes match '(:Concept)<-[:SUPPORTS]-(:Extract)-[:EXTRACTED_FROM]->(:Source)'
```

**Where this diverges from the classical model.** Neo4j asks for a schema before
the material: modelling precedes loading. Here a node has a body, so material
arrives first and the structure grows out of it — parts are lifted from the raw
content as they earn it, each keeping a line back to where it came from.

[raw](raw.md) settles the step before this one: capture costs nothing and cannot
be refused, qualifying costs the judgement and can be. This page is the step
after — not *what is this node*, but *what has been lifted out of it yet*.

So a body is not content whose grain is the node. **It is the remainder nobody
has extracted yet**, and the question it answers is temporal.

## It needs nothing built — measured

Two sources, two extracts, one concept. The pattern above returns all five, and
crossing to the sources behind a concept is one traversal:

```
Concept=1 Extract=2 Source=2
```

Relation types are a practice's words, as [vocabulary](../vocabulary.md)
requires of everything the substrate does not know. The anchor rides on the edge
because a record is a document of properties ([batch 15](../../batches/15-one-write.md)),
and it comes back **inline on the resolved link** — `quote`, `start`, `end` and
`digest` arrive during the traversal rather than in a second call.

## The anchor has three layers because it has four states

Measured against an edit that inserted 19 bytes above the quoted span:

| | stored | after the edit |
|---|---|---|
| `digest` of the body | `a7c6f15a87ce` | `d7a785256d8d` — **the anchor knows it is doubtful** |
| `start` / `end` | `23` | wrong |
| `quote` | `89% against 17%` | **re-found at 40** |

Each layer answers what the others cannot. The digest locates nothing; it says
only whether the other two can be trusted, totally and cheaply. The position is
exact and free while nothing has moved. The quote is the only one that survives
an edit elsewhere in the document.

The fourth state is the one worth naming: a quote that can no longer be found
leaves the extract **orphaned**, which is information rather than breakage. As
in [derived-document](derived-document.md), the wording has to be *re-anchor*,
never *invalid* — a source that moved does not make the extract false.

**A quote alone is ambiguous** when the same words occur twice. The W3C Web
Annotation model pairs a quote selector carrying prefix and suffix with a
position selector, which is this table with the ambiguity closed; it is the
shape to take rather than to re-derive.

## Version is the graph's, history is git's

A digest is an **identity**: it says *that* the body changed. It does not say
what. That belongs to git, and a body has no history inside the space — giving
it one would rebuild a version-control system inside something that is already
a client of one.

The division is the useful part: the graph detects, git explains.

## Points of attention in practice

**Redundancy reads as convergence.** Two extracts on one concept only confirm
anything if they come from *different* sources. Group by the source id before
believing a traversal — otherwise citing the same document twice looks like two
witnesses. This is the failure the inverse relation invites, precisely because
it is the thing it is good at.

**The graph looks more confident than the evidence.** Crossing sources shows
agreement and cannot show disagreement: a contradicting source yields an extract
that supports some *other* concept, so it never appears in the traversal.
Contradiction has to be modelled on purpose — a relation type of its own — or
the absence of dissent will be read as its absence in the material.

**An extract that restates its quote is not an extract.** If the body equals the
text in `quote`, the judgement was skipped and the pile has merely moved: the
scarce input is still attention, one level down from where [raw](raw.md) put it.

**A concept that never refuses an extract is not a concept.** Generalisations
attract material; one broad enough to accept everything — *performance*,
*quality* — teaches nothing by being supported.

**Quote at the scale of a sentence.** Shorter and it occurs everywhere and
re-anchors onto the wrong thing; longer and any edit inside it orphans the
extract. The unit that survives editing is roughly the claim itself.

**A digest covers the whole body**, so a typo fixed three paragraphs away marks
every anchor into that document as doubtful. Treat a mismatch as *verify*, not
as *broken* — the quote check is the real test and the digest only decides
whether to run it. Anything stricter cries wolf, and a signal that cries wolf is
one its reader learns to silence.

**Nothing re-checks anchors on its own.** This is [raw](raw.md)'s uncounted
inbox, one layer down: an anchor set that nobody sweeps rots invisibly, because
nothing in this tool runs unprompted.

## What it is blocked on

**Nothing to build, and no caller.** Every piece above ran against a throwaway
space with the binary as it stands.

**Addressing into a body.** Offsets exist because nothing can point at part of a
body; making one addressable is what would replace them with a reference.
[search](search.md) holds the neighbouring question.

## What it does not settle

- **Withdrawing a source.** Provenance points at it, so removing one orphans
  every extract that cited it — [lifecycle](lifecycle.md) has the question and
  not the answer.
- **Who sweeps the anchors**, which is [raw](raw.md)'s open question with a
  different predicate: a hook has no skills, and a practice has nowhere yet to
  declare a generalisation.
- **Whether an extract's own body is prose or a claim in properties** — the dial
  this whole page sits on, and one nothing here fixes.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
