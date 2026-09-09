# Searching

Retrieval over prose, and presence tests over properties. Designed 2026-09-08,
built by nothing.

```
kg nodes find <expression>
```

One action, one argument, one grammar — over authored properties and over the
reserved names in [structure](../structure.md):

```
kind = decision and not retired
labels contains auth
body ~ "session.*handling"
created > 2026-09-01
(kind = decision or kind = opinion) and body.lines > 200
```

**Flags could not express combination, and that is why this churned.** It was
designed four times as a set of them — `--where`, `--contains`, `--contain-any`,
`--contain-properties`, `--without-properties` — and each round argued about
whether repeating a flag conjoined, whether several values in one flag unioned,
and what a name implied about both. Every one of those questions is a grammar
question, and a grammar answers them once.

## Where it lives

`nodes find`, not `nodes list --where`. The scope is the same — the collection
is what either touches — and the action names the difference, which is real and
observable:

| | |
|---|---|
| `nodes list` | reads the directory. Parses nothing. One syscall |
| `nodes find` | opens and parses every node, both halves |

A flag would hide a thousandfold cost behind an option. Two actions put it in
the command, and it is the same line the batch documents already draw when they
say a bare listing parses nothing.

That also honours the reservation in [`spec/api.md`](../../spec/api.md) — *`find`
is not `nodes list`* — without inventing a scopeless verb, which `kg find …`
would have been.

## Two operators, two operand kinds

| | | |
|---|---|---|
| `contains` | membership in a list | `labels contains auth` |
| `~` | a regex over text | `body ~ "session.*handling"` |

Neither infers from a runtime shape. `body` is known to be text at parse time
because it is reserved, so `body contains "x"` refuses and says which operator
to use; `labels ~ "au.*"` refuses the other way.

Literal substring search over prose is not here. If regex-escaping a phrase turns
out to bite, `contains` extends to text additively, without changing what it
means for a list.

## The shell is the outer grammar

Measured, because guessing was wrong twice:

```bash
kg nodes find 'kind = decision and body ~ "the `--stdin` flag"'
```

**Single quotes outside.** Double quotes let the shell expand backticks, `$VAR`
and `$( )` — and the values being searched are prose about a tool, which is
exactly where backticks live. A query for a node mentioning a flag would execute
part of itself.

**Double quotes inside**, because that is what is left. The one thing a
single-quoted string cannot hold is an apostrophe, which costs `'\''` — ugly,
and cheaper than command substitution on every query.

**One argument, not several.** An argv-token form would let the shell tokenise
and quote each value, which is friendlier — until the operators, because `>` and
`<` are redirects. `kg nodes find score > 0.7` truncates a file named `0.7` and
runs a different query, silently. That disqualifies it.

## Why *contains* means what it means here

There are four things that could be the container, and a predicate can be
written at any of them:

| | contains what |
|---|---|
| the space | nodes |
| the node | properties |
| a property's value | several values |
| the value | characters |

**The bottom rung is the one people mean.** Asked *does this node contain
`auth`*, a reader of a knowledge tool reads it as *does its prose* — which is
why the word could not be spent on list membership while prose search had no
spelling. With `~` taking the text, `contains` is free for the rung above it.

**And *contains* is presence, not comparison.** *Contains X* asks whether X is
there; it does not compare a key to a value. That distinction caught a defect in
the shipped surface: a bare `--where <name>` was a presence test wearing a
comparison word, and it was removed in
[batch 4](../../batches/4-stops-guessing.md).

In the expression, presence needs no operator at all — a bare name is the
predicate, and `not` negates it. The whole `--contain-properties` /
`--without-properties` pair collapses into that.

## Rules, not questions

**A pattern that will not compile refuses before a file is opened**, at exit
`1`, by the rule that validation precedes lookup. So does an expression that
will not parse. The regex flavour is whatever `RegExp` the runtime provides — a
fact to state, not a choice.

**A pathological pattern can hang.** `find` opens every node; a regex over every
body is the first thing here that can fail to terminate rather than merely be
slow, and Deno offers no regex timeout. There is no non-backtracking engine
without a dependency, so this is recorded rather than solved.

**`~` searches text, and the only text a node has is its body.** A regex over
property values has no operand and no caller — property values are single-line
tokens and dates, which `=` and `contains` already reach.

**An unknown property is not an error.** A predicate over a name no node carries
matches nothing, because a read command reports what it found rather than
judging what it was asked. Only a malformed *expression* refuses.

## What it replaced

Four flags, designed four times: `--where`, `--contains` with `-any` and `-all`
suffixes, `--contain-expression`, `--contain-properties`, `--without-properties`.
Each round argued about whether repeating a flag conjoined, whether several
values in one flag unioned, and what a name implied about both.

Those are grammar questions, and a grammar answers them once. `--where` shipped
in batch 2 and was removed in [batch 4](../../batches/4-stops-guessing.md), for
the same reason none of the others was built: one member of a family built ahead
of the rest anchors the others around an arbitrary survivor.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
