# Schema

**What the toolbelt writes and the checker enforces.** Ships with the plugin and
is versioned with it, so the rules and the code cannot drift apart. The
*reasoning* — why a repository organises itself this way — is scaffolded once and
then owned locally.

## Node

```yaml
---
title: string
type: regulation | vendor-capability | domain-fact | pattern | concept | decision | thesis
jurisdiction: [universal] | [fr, eu] | []      # a frame
vendor: [universal] | [stripe] | []            # a frame
topics: [invoicing, tax]                       # enrichment, names no frame
compiled: YYYY-MM-DD
recheck: YYYY-MM-DD                            # required, except type: concept
confidence: verified | partial | attested      # facts only
relations:
  - depends-on: domain/other-node.md
---
```

### Frames

`jurisdiction` and `vendor` name the world a claim is true *in*.

| Value | Means |
|---|---|
| `[universal]` | holds whatever the value — including "this axis does not apply" |
| `[fr, eu]` | bound to those, and only those |
| `[]` | **unbound** — nobody determined the frame; warns |

`universal` is exclusive: `[universal, fr]` is rejected.

### Confidence

Three values, and the test is **provenance, not recency**.

- `verified` — every claim checked against a cited source
- `partial` — core claims checked; each unchecked detail marked inline
- `attested` — no source exists and a human accepted it; requires
  `attested-by`, `attested-on`, `basis`, and `basis` must say why verification is
  *impossible* rather than inconvenient

### Decisions and theses carry neither `confidence` nor `recheck`

A decision is **chosen**, not checked, and the absent field is the positive
statement of that. Placed beside verified facts, a decision otherwise inherits
their authority by proximity.

```yaml
type: decision
status: open | provisional | decided | superseded
decided: YYYY-MM-DD        # required unless open
serves: >-                 # what it buys — not what was chosen
revisit-when: >-           # the event that would unmake it. A trigger, never a date
```

```yaml
type: thesis
basis: >-                  # what supports it, and whose claim it is
would-falsify: >-          # what observation would kill it
```

### Relations

Only four, and only where the edge carries weight:

`supersedes` · `contradicts` · `depends-on` · `does-not-satisfy`

## Task

A second entity, not a node subtype. Different lifecycle — it drains — and the
only thing that can be deleted.

```yaml
---
id: 16                                  # assigned once, never reused
cost-if-wrong: high | medium | low      # severity, alone
queued: YYYY-MM-DD
due: now | deferred                     # readiness, alone
due-when: >-                            # required when deferred. A trigger, never a date
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

## Metadata

Lives in `meta/` and holds no claim — the test is that **deleting it loses
nothing but navigation**.

| File | Derived? |
|---|---|
| `meta/MAP.md` | listing generated; commentary authored, with a `reconciled:` watermark |
| `meta/QUEUE.md` | wholly generated |
| `<graph>/meta/INDEX.md` | listing generated; editorial authored |

Superseded nodes are excluded from the map — pruning is a predicate, not an act.
Exclusions are counted, because a filter applied silently forever needs its
effect to stay observable.
