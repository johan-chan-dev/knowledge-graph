# Schema

**What the toolbelt writes and the checker enforces.** Ships with the plugin and
is versioned with it, so the rules and the code cannot drift apart. The
*reasoning* — why a repository organises itself this way — is scaffolded once and
then owned locally.

## The shape

Three top-level keys, and only two are structural.

```yaml
---
kind: fact
attributes:
  title: Automation bias, fluency, and error compounding
  labels: [pattern, domain-fact]
  jurisdiction: [universal]
  vendor: [universal]
  topics: [decision-making, verification]
  compiled: 2026-08-19
  recheck: 2027-08-19
  confidence: partial
relations:
  - rel: depends-on
    to: practice/debiasing.md
  - rel: depends-on
    to: auth/supabase-sessions.md
    attributes:
      aspect: rotation, not multiplicity
---
```

| Key | Role |
|---|---|
| `kind` | **exclusive.** Decides which attributes are required and which are forbidden |
| `relations` | edges — `rel` and `to`, each with its own optional `attributes` |
| `attributes` | everything else, open |

The nesting is what keeps the toolbelt stable: `set` writes into **one
dictionary**, so adding a field is a schema change and never a command change.
Flat, every new field competes with `kind` and `relations` at the top level and
the tool has to know which is which.

It also makes a node and an edge **the same shape** — something typed, plus a bag.

## `kind`

Exclusive, because it answers *what makes this true*, and a claim cannot be both
chosen and checked.

| `kind` | True because | Requires | Forbids |
|---|---|---|---|
| `fact` | checked against a cited source | `confidence`, `compiled`, `recheck` | — |
| `concept` | it is a definition | `confidence`, `compiled` | **`recheck`** |
| `decision` | it was chosen | `status`, `serves`; plus `decided` and `revisit-when` unless `status: open` | `confidence`, `recheck` |
| `thesis` | neither — it has evidence, not a verdict | `basis`, `would-falsify` | `confidence`, `recheck` |

**`concept` carries no `recheck`.** Facts are dated and go stale; definitions do
not.

**A decision may not carry `confidence`, and the absence is the point.**
`confidence: verified` on a choice is a category error, and a dangerous one:
placed beside genuine facts, a decision inherits their authority by proximity.
Forbidding the field makes its absence a positive statement — *this was chosen,
not checked.*

### `labels` is not `kind`

`labels` is a **list**, carries no rules, and exists for retrieval:
`regulation`, `vendor-capability`, `domain-fact`, `pattern`. A node reporting
empirical findings from cited literature *and* distilling a pattern is both, and
nothing about that needs resolving.

An earlier design fused the two into a single `type`, which conflated an axis the
schema enforces with one it ignores — and the implementation gave it away, since
every rule keyed off a `kind` computed from the type rather than off the type
itself.

## Frames

`jurisdiction` and `vendor` name **frames** — the world a claim is true *in*.
`topics` names no frame; it is enrichment.

| Value | Means |
|---|---|
| `[universal]` | holds whatever the jurisdiction or vendor — including "this axis does not apply" |
| `[fr, eu]` | bound to those, and only those |
| `[]` | **unbound** — nobody determined the frame. Warns |

`universal` is **exclusive**: `[universal, fr]` is rejected, since a claim
holding across every value cannot also be bound to some.

Do not restate the folder as a facet; the path already carries the domain.

## `confidence`

Three values, and the test is **provenance, not recency** — where a claim came
from, never how recently it was said.

| Value | Means |
|---|---|
| `verified` | every claim checked against a cited source |
| `partial` | core claims checked; each unchecked detail **marked inline**, where it appears |
| `attested` | no source exists, and a human accepted it |

Attestation additionally requires `attested-by`, `attested-on`, and `basis` — and
**`basis` must say why verification is *impossible*, not inconvenient.** If a
source exists and simply was not consulted, the material is recalled and belongs
in a task. Attestation used as a shortcut around checking is worse than leaving
something unverified: the label reads as settled and removes the prompt to ever
check.

Never present checked and unchecked claims at one confidence level.

## `relations`

```yaml
relations:
  - rel: depends-on
    to: practice/debiasing.md
    attributes:            # optional
      aspect: "…"
```

Four are recognised:

| `rel` | Meaning |
|---|---|
| `supersedes` | this node replaces the target; the target is history |
| `contradicts` | the two cannot both be true — one is wrong or scoped |
| `depends-on` | this node is meaningless or wrong without the target |
| `does-not-satisfy` | this capability fails to meet that requirement |

`to` is relative to the graph root, not to the node.

**`aspect` is the one edge attribute that earns its place.** *Which* part of a
target a node depends on is neither computable from the endpoints nor substantial
enough to be its own node — so when a target's `recheck` fires, the blast radius
is knowable. Everything else proposed for edges is computable (frame overlap),
lives in git (dates, authorship), or needs a source and is therefore a node.

**An edge has no address.** Nothing can cite one, so a relation that is itself a
claim — needing a source, a frame, or its own expiry — must become a node. The
test: *would you cite it?*

## Tasks

A second entity, not a node kind. Different lifecycle — it drains — and the only
thing that can be deleted.

```yaml
---
id: 16                                  # assigned once, never reused
attributes:
  cost-if-wrong: high | medium | low    # severity, alone
  queued: 2026-08-20
  due: now | deferred                   # readiness, alone
  due-when: >-                          # required when deferred. A trigger, never a date
---
```

Severity and readiness are separate fields because one field carrying both makes
neither recoverable from the value.

## Tiers

```
<graph>/                 global — claims holding across every scope
<scope>/<graph>/         local  — scoped, promotable
```

**Local may cite global. Global may not cite local.** A claim's frame must
contain the frames of everything it depends on, so edges run up only. That is
what makes promotion safe: nothing global points down at a node being moved up.

Direction here is coherence, not mechanism — a global claim resting on a
product-specific one would assert generality while depending on a bounded frame.
So a symmetric relation observed locally is stored locally, and the global node
is not missing information: **an edge lives with whoever noticed.**

## Metadata

Lives in a `meta/` folder and holds no claim — the test is that **deleting it
loses nothing but navigation**.

| File | Derived |
|---|---|
| `meta/QUEUE.md` | wholly |
| `meta/MAP.md` | listing and pressure; commentary is authored, with a `reconciled:` watermark |
| `<graph>/meta/INDEX.md` | listing; editorial is authored |

Each graph keeps its own `meta/`, which is what lets a local graph promoted to
root move whole.

Superseded nodes are excluded from the map — **pruning is a predicate, not an
act.** Exclusions are counted, because a filter applied silently forever needs its
effect to stay observable.
