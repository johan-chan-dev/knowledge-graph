# knowledge-graph

`kg` keeps a knowledge graph as files in a repository: one node per file, a uuid
for a name, properties in frontmatter and prose in the body.

**Being designed and built, in the open.** There is no plugin to install and
nothing here is stable. What exists is a design tree and a binary that closes
nine loops: a space, nodes, properties, lists, labels, relations and `find`.

## What it is for

A repository where the reasoning matters as much as the artefacts — decisions,
verified facts, load-bearing assumptions — and where **an agent is the primary
reader**.

That last part is the whole constraint. A person asks and rules; an agent
drives; the tool writes. So the surface is optimised for a caller who reads
every refusal, holds no state between sessions, and pays for what it reads in
context rather than in time — which is why listing and searching are two
actions rather than one with a flag, and why an expression that will not parse
refuses before a single file is opened.

## Where things are

| | |
|---|---|
| [`docs/`](docs/) | the design, the spec, and what each batch decided |
| [`tool/`](tool/) | Deno and TypeScript, compiled to a binary |

[`docs/README.md`](docs/README.md) says which of those three to read first for
which question. [`docs/spec/api.md`](docs/spec/api.md) is true of the binary in
front of you and of nothing else.

## State

| | |
|---|---|
| batches 1–5 | shipped — a space, properties, lists, no guessing, a declared entry point |
| batches 6–9 | shipped — labels, relations, someone else's graph as a conformance check, and [`find`](docs/batches/9-find.md) |
| plugin | **none published.** The tool comes first |

## There is no plugin, deliberately

An earlier implementation shipped as one: a Python toolbelt, a skill and an
agent, in daily use in a private repository where it managed 73 nodes. It is
deleted rather than migrated — every command name changed, the layout on disk
changed, and a rename would have left more dead code than it saved.

**It stayed too long after the rewrite started**, and the cost was not disk. It
described a second, different model — two scopes resolved by directory, a
frontmatter shape, fifteen operations — in the same tree as the design replacing
it, and this file advertised that model in full while mentioning the replacement
in one line. Anything reading in that order carried the wrong model forward.

Git history holds it. The two arguments it made that this design has **not**
settled were carried across rather than left there:
[raw](docs/design/parked/raw.md) — material nobody has judged yet, and why
capture must cost nothing — and [sharing](docs/design/parked/sharing.md) —
knowledge travels, and edges run toward the more-shared space.
