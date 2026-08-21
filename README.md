# knowledge-graph

A Claude Code plugin for managing a knowledge graph inside a repository.

**Early, and in daily use.** The surface still moves between minor versions; the
origin repository is upgraded with it, which is what keeps the churn honest.

## What it is for

A repository where the reasoning matters as much as the artefacts — decisions,
verified facts, load-bearing assumptions — and where an agent is the primary
reader. Atomic markdown nodes with typed frontmatter, a global/local graph, a
derived metadata layer small enough to load at session start, and a queue of
pending work with a cap on what is surfaced at once.

## The one idea

**Correct by construction, not by inspection.**

Rules enforced after the fact are rules an agent can break and then be told
about. Rules encoded in the operation that writes the file cannot be broken —
there is no path to the broken state. So `kg new` writes complete frontmatter and
the index entry together; `kg set` refuses a state its own schema forbids; and
there is deliberately **no** `kg rm`, because the graph is monotonic and a
missing operation is stronger than a refused one.

Building it this way removed 20 of the origin repo's 24 validation checks. What
survives as a check is only what no constructor can own: prose. Links inside a
body, a citation crossing a tier, a claim written in the first person plural.
Nothing owns a sentence.

## Spaces

Two axes, independent, and almost every confusion is the two being conflated.

| Axis | Runs | Governs |
|---|---|---|
| **general ↔ specific** | global tier ↔ local tier | *who may cite whom* |
| **personal ↔ shared** | this repository ↔ the repositories it refers to | *who reads it* |

The citation rule is on the first axis only: **a local node may cite a global
one; a global node may not cite a local one.** A claim's frame must contain the
frames of everything it depends on, so edges run up. This is Cyc's `genlMt`
relation — transitive, monotonic, and a query in the general context cannot see
the specific one.

The second axis is the lifecycle: knowledge starts personal, is shared once it
holds for someone else, and whatever comes back from a shared space is taken into
the personal one again.

**Containment and inheritance point in opposite directions**, which catches
everyone once. Git points *down* — a repository knows its submodules, and no
`../` climbs out of one. The graph points *up* — a shared space is a root in its
own right, which the personal space refers to. Reason from the directory tree and
you will get the direction wrong every time. One absolute consequence: across a
repository boundary, in either direction, a reference is a URL, never a path.

## The toolbelt

`kg <op>`, fifteen operations, stdlib Python and no dependencies.

| | |
|---|---|
| **write** | `new` · `set` · `link` · `unlink` · `mv` · `supersede` |
| **tasks** | `task new` · `task retire` |
| **read** | `inbound` · `neighbors` · `stale` |
| **whole graph** | `build` · `check` · `init` · `migrate` |

Two are worth knowing before you need them.

**`supersede` inserts into a chain rather than replacing a file.** The live node
never moves, so every citer keeps pointing at the current version; a timestamped
snapshot takes the history. An earlier design wrote the replacement to a new path
and quietly orphaned every citer onto the old one.

**`mv --closure` computes what must travel with a node, and the number means
opposite things in the two directions.**

| Moving | The count is | A large one means |
|---|---|---|
| local → global, inside one space | the **cost of a generality claim** | the claim is false — usually a refusal |
| personal space → shared space | the **unit of sharing** | nothing is wrong; that is the shipment |

It stops at the space boundary: a dependency in a third space is left where it
is, and the move refuses rather than write a graph that breaks the citation rule.
What the closure declines to carry is exactly what somebody else owns.

Design rationale, one entry per operation: `kg/TOOLBELT.md`. What the frontmatter
means: `kg/SCHEMA.md`. Six worked scenarios, all from real friction:
`kg/USE-CASES.md`.

## Skill and agent

| | |
|---|---|
| skill `graph` | the working procedure — triggers on any repository holding a `.kg.json`, with `references/method.md` and `references/settle.md` loaded on demand |
| agent `guide` | explains why the graph is shaped as it is, **by measuring it** — what a promotion would drag with it, what cites a node and how. One turn, no follow-up. Invoke for the expensive cases, not for a rule you already know |

## Install

```bash
claude plugin marketplace add johan-chan-dev/knowledge-graph
claude plugin install kg@knowledge-graph
```

Then, in a repository that should hold a graph:

```bash
kg init          # writes .kg.json — declares the graphs, tasks dir, metadata dir
kg migrate       # adopt an existing tree of markdown notes, if there is one
```

Wire `kg build && kg check` into a pre-commit hook. `build` regenerates the
derived layer; `check` fails the commit on a structural fault and warns on the
rest.

**Updating an installed copy needs a version bump.** Installed plugins are cached
by version, so `marketplace update` alone will not propagate an edit.

## Status

| | |
|---|---|
| toolbelt | 15 operations, in daily use |
| schema, design rationale, use cases | written |
| skill, guide agent | written |
| settle agent | **not shipped** — lives in the origin repo; the procedure it follows is here, at `kg/skills/graph/references/settle.md` |
| skill description | **unmeasured** — six optimizer runs returned 0% recall and the cause was the harness, not the description. Triggering is untested |

Extracted from a private repository where it has been in daily use, and where it
now manages 73 nodes across two tiers. That repo is the plugin's first consumer,
which is the only real test that anything portable came out — and the source of
every refusal listed above, each of which exists because something went wrong
there first.
