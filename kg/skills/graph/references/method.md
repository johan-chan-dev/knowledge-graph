# Method

How a knowledge graph is organised and why. The *shape* of a node is
`SCHEMA.md`; the *operations* are `TOOLBELT.md`; this is the reasoning that
makes both make sense.

Read it when placing a node, choosing a scope, deciding whether something is one
node or two, or judging whether a relation earns being typed.

## Organisation

Organised by **domain** — the subject area a node belongs to.

```
knowledge/
├── INDEX.md
├── billing/     invoicing, tax, subscription mechanics
├── payments/    payment methods, PSP capabilities, money movement
└── practice/    how work is done — decision-making, verification
```

The folder records a node's **primary domain**, the one obvious home. Everything
cross-cutting — jurisdiction, vendor, regulatory status — is carried by `tags`
and by links, never by the folder.

Do **not** organise by jurisdiction (`france/`, `eu/`): products expand across
jurisdictions, and a node would have to move the moment a second one applies. Do
not organise by `kind` either — that already lives in frontmatter, and
duplicating it in the path gives two sources of truth that drift.

Add a folder when there is content for it, not in anticipation. Nest deeper only
once a folder is too large to scan.

## Two scopes: personal and shared

The same graph exists at two scopes.

```
knowledge/                    shared   — holds across products
products/<name>/knowledge/    personal — scoped to one product, shareable
```

Identical node schema, identical validation, one index each. What differs is a
single directional rule:

> **Personal knowledge may cite shared knowledge. Shared may not cite personal.**

### Why the direction is not arbitrary

A root node asserts it holds across products. If it cited a product-personal node,
its truth would rest on a product-specific claim — asserting globality while
depending on a bounded frame.

That is not an analogy to the frame rule below. It is the same rule as a graph
constraint: **a claim's frame must contain the frames of everything it depends
on.** Shared contains personal, so edges run up only.

Two properties follow, and both are why the rule is worth enforcing rather than
intending:

- **Promotion is safe.** A personal node that proves cross-product moves to root
  without breaking anything, because nothing shared was pointing down at it.
  Only personal links need updating.
- **The graph stays acyclic**, and a reader at root never needs to know personal
  nodes exist.

The validator errors on a shared node — or a shared index — linking into
`products/`. A convention nobody notices breaking is not a property.

Which scope something starts in is settled by `STRUCTURE.md`: **root is a claim,
not a default.** Start personal, promote on evidence, never the reverse.

### What the hierarchy costs

A folder gives each node exactly one parent, but knowledge has several — the
e-invoicing mandate is at once *billing*, *compliance* and *France*. The path
records only the primary axis; links and tags carry the rest, which is why links
are not optional decoration here.

Practical rule: **if you cannot choose a folder, the node is really two nodes.**
Inability to file it is a signal to split, not to invent a folder.

## Node granularity

One node = one thing worth linking to on its own.

Splitting test: **different source + different expiry = different node.** A fact
about law and a fact about a vendor's capabilities do not belong in one file —
bundled, the file inherits the shortest recheck date and the whole thing rots
together.

Atomic beats bulky. A three-line node is fine.

## Decisions and theses are not facts

A graph node need not be a fact. Three kinds live here:

| `kind` | Is | True because |
|--------|-----|--------------|
| `regulation`, `vendor-capability`, `domain-fact`, `pattern`, `concept` | a **fact** | checked against a cited source |
| `decision` | a **choice** | it was made — decisions are not true or false |
| `thesis` | a **hypothesis** the work rests on | neither; it has evidence, not a verdict |

They share the graph because they share its shape: identity, dependencies,
supersession. A decision is something other nodes depend on, and one that gets
replaced leaves `supersedes` behind exactly as a fact does.

**They are not separated by folder**, for the reason folders never carry type
here: that already lives in frontmatter, and duplicating it in the path gives two
sources of truth that drift.

### `decision`

```yaml
kind: decision
attributes:
  title: …
  status: provisional      # open | provisional | decided | superseded
  decided: 2026-08-17      # required unless status is `open`
  serves: >-
    What this buys. Not what was chosen — what it is for.
  revisit-when: >-         # required unless status is `open`
    The event that would unmake it. A trigger, never a date.
```

**`serves` is required because of the *because* rule below.** A purpose written
as prose is skimmed; as a field it must be stated, and it can be checked later
against whether the decision still serves it. A decision and its purpose then
fail together, instead of the purpose quietly evaporating and the decision
surviving on inertia.

**`revisit-when` is the decision's `recheck`.** Facts go stale on a calendar —
has the world moved? Decisions go stale on an event: a version reaching GA, a
constraint arriving, a premise failing. A date would be theatre.

**`provisional` is a real state, not a hedge.** It says *load-bearing now, and
expected to be revisited* — which is neither "unresolved" nor "settled". Without
it, a choice made because something had to be chosen reads identical to one made
because the answer was clear, and that is the misreading that stops anyone
revisiting.

### `thesis`

```yaml
kind: thesis
attributes:
  title: …
  basis: >-
    What actually supports it, and whose claim it is.
  would-falsify: >-
    What observation would kill it.
```

For a load-bearing claim that is neither verified nor chosen — the premise a
product rests on before anything can measure it. `would-falsify` is the premortem
made structural: a thesis nobody can state a refutation for is not a thesis.

### Neither carries `confidence` or `recheck`

The validator **errors** if they do, and the absence is the point.

`confidence: verified` on a choice is a category error, and a dangerous one:
placed beside genuine facts, a decision inherits their authority by proximity —
the "unjustifiably comfortable slumber" this file warns about, arriving through
layout rather than through a label. Forbidding the field makes its absence a
positive statement: **this was chosen, not checked.**

Same device as `[]` against `[universal]` on a frame facet — make the meaningful
absence explicit, so nobody later fills it in.

## Links

Use **relative markdown links**: `[French e-invoicing](france-e-invoicing.md)`.

They render clickable in Forgejo's repo browser *and* resolve in Obsidian's graph
view. `[[wikilinks]]` are Obsidian-first and generally do not resolve in
Forgejo's normal file view.

Link generously. A link to a node that does not exist yet is a valid marker of
something worth writing — but write the link target as a real filename so it
resolves once created.

### Typed relations

Plain links say two nodes are related. `relations` says **how**, and only four
are recognised:

| Relation | Meaning |
|----------|---------|
| `supersedes` | this node replaces the target; the target is history |
| `contradicts` | the two cannot both be true — one is wrong or scoped |
| `depends-on` | this node is meaningless or wrong without the target |
| `does-not-satisfy` | this capability fails to meet that requirement |

Paths are relative to `knowledge/`, not to the node.

Use them **only where the relation carries weight**. Ordinary "see also" stays a
plain inline link — typing every edge is ceremony, and ceremony in a thinking
space stops you writing. `does-not-satisfy` on Stripe versus the French mandate
is the case that earns it: that edge is the most consequential fact in the
graph, and untyped it reads like a footnote.

## Index

`meta/INDEX.md` is the map of content — the entry point into a graph, grouped by
domain. **One per graph**: `knowledge/meta/INDEX.md` for the shared one, and
`products/<name>/knowledge/meta/INDEX.md` for each personal one.

Maintained by hand, but enforced: the validator fails the commit if a node is
absent from its own index. Update it in the same commit that adds the node.

A shared index may not list a personal node, for the same reason a shared node may
not cite one.

## Sources

Cite at the end of each node, as bare URLs. Convert relative dates to absolute —
"next September" is unusable six months later.

Prefer **primary sources**. A vendor page describing its own compliance coverage
has an interest in the answer; the regulator's does not.

Interest is not the only way a source fails. Walton's critical questions for
appeal to expert opinion separate three, and the third is the one this rule was
missing:

| Question | Failed by |
|----------|-----------|
| Is it **biased**? | having a stake in the answer — the vendor compliance page |
| Is it **honest**? | reporting other than what it believes |
| Is it **conscientious**? | not taking "care in collecting sufficient information" |

Conscientiousness is independent of the other two. A disinterested source
reporting in good faith is still wrong when it did not check: a secondary
summary of a regulation, an aggregator restating a vendor's claim, a post
accurate on the day it was written. Interest predicts *which way* a source errs,
so it can be corrected for by discounting. Carelessness predicts only *that* it
might, which is why neutrality is not sufficient — ask what the source itself
consulted.

https://cgi.csc.liv.ac.uk/~floriana/CMNA/WaltonReed.pdf

Facts resting on regulation or vendor capability go stale **silently** — nothing
fails, the claim simply becomes wrong while still reading as authoritative. That
is what `recheck` exists for.

## Flow

```
                    ┌──────── verification ────────┐
                    │                              │
                    ▼                              │
 knowledge/  ←citable by─  products/<name>/knowledge/   │
  shared                  personal · facts, decisions,  │
  never cites down          theses                      │
                                    │                   │
                                    └──→ tasks/ ────────┤
                                          drains        ▼
                                                the product's repo
                                                executed elsewhere
```

Three boundaries, three different kinds, three different rules:

| Scope | Boundary is | Rule |
|------|-------------|------|
| `knowledge/` | **semantic** — globality is a claim | may not reference down into `products/` |
| `products/<n>/knowledge/` | **locality** — scoped, promotable | may reference up, freely |
| `products/<n>/repo/` | **isolation** — a separate repository | URL only, in both directions |

Facts are cited by decisions. Decisions become tasks. Tasks that verify produce
facts.

Tasks leave by **one of two routes**:

- **handoff** into a product repo — the work is executed elsewhere;
- **verification** — the task was to check an assumption, and its output is a
  verified node folded back into `knowledge/` at root, where it is shared.

The second route is what makes this a cycle rather than a pipeline. An
unverified assumption, encountered anywhere, becomes a task — never a knowledge
node. `knowledge/` is therefore only ever an *output* of verification, never a
holding pen for things awaiting it.
