# Batch 8 — someone else's graph

**Done when** a graph built by people who had never heard of this tool is held
by it, and what it cannot hold is known rather than guessed.

Built. No new capability — this is the conformance check on the borrowed half of
the model. [`vocabulary.md`](../design/vocabulary.md) claims Neo4j's shape:
*labels classify, properties hold data*. Batch 7 added relationships with a type
and properties. Whether those claims hold is answerable, and this answers it.

## What it does

```console
$ deno task movies
the movies graph imports, and nothing is lost ... ok (1m2s)
```

It lives in `tool/conformance/` rather than `tool/tests/`, because it answers a
different question: not *does this code do what it says* but *does the borrowed
model hold someone else's graph*. It has its own task and is not in the seven
second suite.

Neo4j's own movies example — 171 nodes, 253 relationships across six types —
converted to a shell script of `kg` commands and replayed against the binary.

Then it is **asked**, rather than only counted. For all 171 nodes, the outgoing
and incoming degree the tool reports is compared against the degree computed
from the Cypher: 342 assertions, and counting files would have passed without
any of them holding.

```
Keanu Reeves      7 out        A Few Good Men   14 in
Tom Hanks        13 out        Cloud Atlas      10 in
```

That is what checks batch 7's claim. `links` and `backlinks` are one node read
filtered on direction, and a graph someone else built is where that either works
or does not.

## Why someone else's data

A fixture written here would share this design's assumptions, and so would test
nothing. The movies set was built by people solving a different problem, which
is why it catches things imagination does not: the design change in batch 7 that
let a link's properties hold a list came from noticing that seven of its
relationships carry multi-valued `roles`, and nothing invented here had needed
that.

## A script, not a command

The converter emits `kg` commands rather than driving the tool's internals:

```bash
Keanu=$(kg node new --with-labels person)
kg node "$Keanu" set name 'Keanu Reeves'
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheMatrix" --with-properties 'roles=Neo')
```

Three reasons. It can be **read before it runs**, which is what a conformance
check is for. It is a **diffable artifact** — regenerate after a batch and the
diff shows what changed about the surface. And it exercises what an agent
actually touches: a process, arguments, stdin — not modules.

**It requires a space and does not make one.** Every `kg` command treats a space
as a precondition, so the script inherits the tool's own refusal — *no space
here — run: kg space init* — rather than deciding for the caller. Setting up a
space is the caller's job, or the test's.

**Point it at a throwaway space.** The material merges cleanly — labels are open
and materialised by use, so `person` simply appears beside whatever is already
there — but node withdrawal does not exist, so adding 171 films to a space you
care about is one-way short of `git reset`. That caveat goes when
[`lifecycle`](../design/parked/lifecycle.md) is answered.

**There is no `kg import`.** The converter reads one file's dialect, not Cypher:
268 node `MERGE`s, 253 relationship `MERGE`s, six `MATCH` re-bindings, three
regular expressions. A different dataset would need its own reading. A command
called `import` would be a promise the tool cannot keep, and it would make the
substrate learn a foreign dump format — which is the thing slot discipline keeps
out.

## What the mapping settles

| Neo4j | here |
|---|---|
| `:Person`, `:Movie` | `person`, `movie` — **case is folded**, so a graph holding both `Person` and `person` could not be held |
| node properties | properties, as text |
| `born=1964` | `'1964'` |
| `[:ACTED_IN {roles:[…]}]` | a link of type `acted-in`, `roles` built with `add` |
| `tagline` | a property, not a body |

**Numbers are not lost.** Storage is text because the shell removes quoting
before the tool sees an argument — `set version 1.10` and `set version '1.10'`
arrive identically — and the type is supplied by the operator at query time.
See [`parked/comparison`](../design/parked/comparison.md).

**A body is not invented.** Neo4j has no such thing and `tagline` is the only
candidate; making it the body would be this design's modelling choice imposed on
someone else's data. This is a baseline test, so the import stays faithful.

## What it does not test

**The half that is this tool's own.** Bodies, and the lifecycle in
[`material.md`](../design/material.md) — capture, extraction, clusters, dropping
the original — have no counterpart in a property graph, so no public dataset
exercises them. That fixture has to be built deliberately, and cannot be until
withdrawal exists.

**Speed.** A minute is 800 process spawns, not the tool. Timing was measured
separately: a full scan is 55 ms at 1 000 nodes and 600 ms at 10 000.

**Anything needing `find`.** *Which films were released after 1999* and *which
node is named Keanu Reeves* have no answer yet — the test locates a node by
reading every one and matching a property, which is the workaround
[batch 9](9-find.md) removes. Traversal is checkable today; selection is not.

**Every dataset.** One file, one dialect. `northwind` and the rest would each
need their own reading, and that is the honest limit of a fixture.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · 8 · [9](9-find.md) · [10](10-resolution.md)
