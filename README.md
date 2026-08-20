# knowledge-graph

A Claude Code plugin for managing a knowledge graph inside a repository.

**Early. Nothing here is stable, and the toolbelt is not built yet.**

## What it is for

A repository where the reasoning matters as much as the artefacts — decisions,
verified facts, load-bearing assumptions — and where an agent is the primary
reader. Atomic markdown nodes with typed frontmatter, a two-tier global/local
graph, a derived metadata layer small enough to load at session start, and a
queue of pending work with a cap on what is surfaced at once.

## The one idea

**Correct by construction, not by inspection.**

Rules enforced after the fact are rules an agent can break and then be told
about. Rules encoded in the operation that writes the file cannot be broken —
there is no path to the broken state. So `kg node new` writes complete
frontmatter and the index entry together; `kg decide` demands the trigger the
state requires; and there is deliberately **no** `kg node rm`, because the graph
is monotonic and a missing operation is stronger than a refused one.

What survives as a check is only what no constructor can own: prose. Links inside
a body, a citation crossing a tier, a claim written in the first person plural.
Nothing owns a sentence.

## Status

| | |
|---|---|
| manifests | scaffolded |
| `bin/kg` toolbelt | **not built** |
| skills, agents | **not written** — they are compositions of operations, and the operations do not exist yet |
| schema reference | `kg/SCHEMA.md` — what it writes |
| toolbelt design | `kg/TOOLBELT.md` — the surface that writes it |

Extracted from a private repository where it has been in daily use. The
extraction is the current work, and the origin repo is its first consumer —
which is the only real test that anything portable came out.

## Install

Not yet. When it is worth installing this section will say how.
