# knowledge-graph

`kg` keeps a knowledge graph as files in a repository: one node per file, a uuid
for a name, properties in frontmatter and prose in the body.

**Built in the open, and not stable.** Fifteen batches have shipped — a space,
nodes, properties, lists, labels, relations, resolution, a vocabulary, one
output format, patterns, one write — and this repository is the marketplace
carrying the plugin that drives them.

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
| batches 6–10 | shipped — labels, relations, someone else's graph as a conformance check, [`find`](docs/batches/9-find.md), and one writer for the frontmatter |
| batches 11–15 | shipped — [resolution](docs/batches/11-resolution.md), [the vocabulary](docs/batches/12-vocabulary.md), [one output format](docs/batches/13-output.md), [match](docs/batches/14-match.md) — which deleted `find` — and [one write](docs/batches/15-one-write.md) |
| plugin | shipped — [`kg/`](kg/): a skill, and a session hook that is silent outside a space |

## The plugin that was deleted

Not this one. An earlier implementation shipped as a plugin — a Python toolbelt,
a skill and an agent, in daily use in a private repository where it managed 73
nodes. It is deleted rather than migrated: every command name changed, the
layout on disk changed, and a rename would have left more dead code than it
saved.

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

## Installing

This repository is a marketplace, and the plugin in it is `kg`.

```bash
/plugin marketplace add https://github.com/johan-chan-dev/knowledge-graph.git
/plugin install kg@knowledge-graph

deno task --cwd tool compile     # about 7 s the first time; Deno is the only dependency
```

The binary is built rather than downloaded, because the marketplace **is** the
tool's repository — whoever installs the plugin already has the source, and
running from source instead would cost 158 ms an invocation against 53 ms
compiled. [`kg/README.md`](kg/README.md) has the measurements and the three
layers the plugin is made of.
