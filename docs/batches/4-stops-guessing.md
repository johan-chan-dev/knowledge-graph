# Batch 4 — the tool stops guessing

**Done when** nothing the tool does depends on inferring intent from its
environment, and every behaviour the specification claims is the behaviour you
get.

Shipped. No new capability: everything here already exists, and this changes how
it is called, corrects what it does, or removes it.

## Not a batch like the others

Batches 1 to 3 each closed a loop you could not close before, so each could be
demonstrated. This one has nothing to demonstrate — the loops are the same and
should look the same afterwards.

Its test is therefore a list of things that must stop happening — `batch 4 — the tool stops guessing` in [`tool/tests/batches/4_test.ts`](../../tool/tests/batches/4_test.ts):

```console
$ kg node <id> set version 1.10
$ kg node <id> --properties
version: '1.10'                      # not '1.1'

$ kg node new                        # outside a space, with a pipe attached
no space here — run: kg space init   # returns, rather than blocking forever

$ kg node <id> | head -c 5
Modul                                # exit 0, nothing on stderr

$ chmod 500 .kg/nodes && kg node <id> set a b
cannot write <id>: permission denied # a refusal, not a stack trace

$ kg nodes list --properties
unknown flag: --properties           # refused, not accepted and ignored

$ kg nodes list --where kind=decision
unknown flag: --where                # the flag is parked, so it is gone
```

Six regressions pinned rather than a capability shown.

## The redesign: content is declared, not detected

One item changes how the tool is called.

```
kg node new                   an empty node
kg node new --stdin           content from stdin
kg node <id> write --stdin    replaces the content
```

**The tool never reads a stream it was not offered.** Today it decides by
calling `isTerminal()`, which answers *is something attached* rather than *is
content coming* — so an open pipe with nothing in it blocks forever, and that is
the only hang in the tool.

**An empty node is legal**, because a node carrying `kind: decision` with no
prose yet is a real thing. So the absence of `--stdin` says what `--allow-empty`
once needed a flag to say, and says it by declaring the source rather than by
confirming an intent.

**One refusal survives, on the one call that can lose something.**

| | |
|---|---|
| `node new --stdin` with nothing | an empty node — identical to `node new`, so there is nothing to object to |
| `node <id> write --stdin` with nothing | **refused** — a failed `cmd \| kg node <id> write --stdin` would empty a node that held prose, and report success |

`new` can only litter; `write` can destroy.

## The removal: `--where`

`nodes list` loses its last filter and becomes a bare directory read.

Filtering belongs to a family — presence, absence, comparison, searching the
body — whose vocabulary reversed five times in a single sitting. `--where` is
not the survivor of that; it is the member that happened to be built first.
**Shipped code implementing a parked design anchors whatever comes next around
an arbitrary survivor**, reads as decided when it is not, and here produces a
silent wrong answer: `--where labels=auth` against a list returns empty with
exit `0`, indistinguishable from no matches.

Absence is honest. Finding a node by anything but its id waited for
[search](../design/parked/search.md), and arrived as
[batch 9](9-find.md) — as a grammar, which is what the flag could not be.

## The corrections

Each is the implementation contradicting [`spec/api.md`](../spec/api.md), and
none is a judgement call.

**A positional value is altered before it is stored.** `parseArgs` coerces any
positional that looks numeric, so `set version 1.10` stores `'1.10'` as the
number `1.1`, and `12345678901234567890` gains invented digits past 2^53. The
spec says *the value is stored as given*. It also hits list elements and
property names — `set 007 v` creates a property called `7`.

The reader was never the problem: YAML 1.2 core was chosen so storage would not
retype a value, and the argument parser was retyping it two layers earlier.

**A broken pipe leaks a filesystem path.** `kg node <id> | head` writes stdout
unguarded, so a consumer closing early produces an uncaught trace naming a path
inside the compiled binary — violating *never a filesystem location* on stderr,
in the shape most likely to be piped.

**Every I/O error escapes as a stack trace with exit `1`.** A read-only
directory, a full disk, `.kg/nodes` existing as a file. `git.ts` calls a stack
trace "the failure an agent reads worst" and then leaves every write path able
to produce one. Exit `1` also means *nothing was written*, which a failed write
cannot promise.

**`--properties` is global in the parser.** It is honoured only on `node <id>`,
but declared for every command — so `nodes list --properties` returns ids and
exits `0` where every other unknown flag refuses. It is the first thing a caller
reaches for when it wants properties for many nodes, and it is the only flag on
that command that answers instead of refusing.

## What they have in common

Four of the six are the runtime being helpful about intent it cannot know:
`isTerminal()` inferring whether to read, `parseArgs` inferring number-ness,
`parseArgs` again treating an undeclared flag as global, and a non-fatal
`TextDecoder` inferring what to do with bytes it cannot decode.

None was a mistake in code that was written. Each was a **default that was
accepted**. For a tool whose caller is an agent, a permissive default is a
guess, and a guess is a defect waiting for the case that exposes it.

## What it does to the batches before it

The transcripts in [1](1-a-space-with-nodes.md) and [2](2-properties.md) both
break — `node new` gains a flag, and `nodes list --where` stops existing. They
are regenerated, because a transcript illustrates the tool as it is; the prose
around them is the history and stays.

Batch 2 is hit hardest. It shipped with three filter predicates, batch 3 removed
two, and this removes the third — leaving properties that can be written and
read but not found by. That is the honest state of a design that has not settled
how to search.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · 4 · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md)
