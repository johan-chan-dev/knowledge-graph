# The shape of a relation

```
ACTED_IN  n=172  Person->Movie
DIRECTED  n=44   Person->Movie
FOLLOWS   n=3    Person->Person
PRODUCED  n=15   Person->Movie
REVIEWED  n=9    Person->Movie
WROTE     n=10   Person->Movie
```

Measured over the movies space, 2026-09-17: 253 edges, six types, **one
observed shape each and no exception**. A relation type already has a domain and
a range here. Nothing declares them, and nothing enforces them.

## SHACL, not RDFS — and the difference is the whole point

The obvious reach is `rdfs:domain` and `rdfs:range`, and it is the wrong half of
that stack. **`rdfs:domain` does not constrain, it infers.** Declare
`DIRECTED rdfs:domain Person`, then write an edge from something else, and a
reasoner concludes *that thing is a Person*. It never complains.

That is failing open — answering plausibly about the wrong thing, which is the
failure this repository treats as worse than an error. The reading wanted here
is validation: **refuse**. That is SHACL's, and
[absence](../absence.md) already settled the alignment: *this tool is
SHACL-shaped. It reports what the corpus says and derives nothing.*

## It is not [validation](validation.md), and it is better conditioned

That page is about **a node's content** — a practice declaring that a decision
must carry a `valid-until`. Its hardest open question is what enforcement means
against material that already violates it, and its central gap is that a
universally quantified claim has nowhere to live: *not stored, not checked for
coherence, and never reaching a node written afterwards.*

A constraint on an edge escapes both.

**It quantifies over nothing.** `link --as DIRECTED --with-nodes <id>` already
holds both endpoints. Checking them is one node read at the moment of writing —
no scan, no claim about nodes that do not exist yet, nothing to re-check later.

**And the retroactive question narrows to reporting.** What already exists can be
listed, by the same one-line derivation that produced the table above; only what
is written afterwards can be refused.

## What it would cost

| | |
|---|---|
| a place to declare it | **already there** — a word is a file with frontmatter, `word: Movie` and an empty body, 21 bytes. `from:` and `to:` belong beside `word:` |
| a verb to write it | **missing.** `label`/`type` read a word and write its *body*; no command sets a property on one |
| the check | one node read inside `link`, which already has both ids |
| the existing edges | a report, expressible today in `jq` over the resolved links |

## What it would buy

**The exhibit ontology becomes enforceable.** `EXTRACTED_FROM: Extract → Source`
and `SUPPORTS: Extract → Claim` are prose in the plugin's skill today, which an
agent may ignore. Declared, an exhibit could not be wired where a thesis goes —
the difference between a habit and [a boundary that refuses by naming
itself](../../batches/14-match.md).

**And drift becomes visible.** Two types with the same declared shape are
candidates to be one type, which is the terminology drift that otherwise waits
on one person's memory. [corpus-statistics](corpus-statistics.md) reaches the
same problem from the corpus side.

## What it is blocked on

A practice with more than one shape per type to talk about. The movies corpus is
unanimous, which makes it a poor witness: a rule nothing has ever violated is a
rule nobody needs yet.

## What it does not settle

- **Carrying versus being.** A node holds several labels, so *the source must be
  a Person* presumably means *carries `Person`*. Presumably is not settled.
- **An unlabelled endpoint.** A node with no labels can be linked today. A
  declared shape would newly refuse that, which removes something that works.
- **Whether a type may declare several shapes**, or exactly one — and whether a
  second shape is a violation or a widening.
- **What a violation does to an edge that already exists**, which is
  [validation](validation.md)'s hardest question arriving in a smaller form: the
  answer can be *report* here, where it could not be there.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
