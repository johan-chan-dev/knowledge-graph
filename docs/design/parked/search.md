# Searching

Retrieval over prose, and presence tests over properties. Designed 2026-09-08,
built by nothing.

```
kg nodes find <expression>
```

One action, one argument, one grammar — over authored properties and over the
reserved names in [structure](../structure.md):

```
decision in labels and not retired
kind = decision
body ~ "session.*handling"
created > 2026-09-01
(decision in labels or opinion in labels) and body.lines > 200
```

The first two are the same question under two modelling choices — a word
carried, or a dimension with one value. Both are a practice's to make and
neither is the tool's; see [vocabulary](../vocabulary.md).

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
| `in` | membership in a list | `auth in labels` |
| `~` | a regex over text | `body ~ "session.*handling"` |

Neither infers from a runtime shape. `body` is known to be text at parse time
because it is reserved, so `body in x` refuses and says which operator to use;
`labels ~ "au.*"` refuses the other way.

Literal substring search over prose is not here. If regex-escaping a phrase
turns out to bite, `contains` is free for it — every language in the family
reserves that word for text, which is why membership had to give it up.

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

## Why membership is `in` and not `contains`

There are four things that could be the container, and a predicate can be
written at any of them:

| | contains what |
|---|---|
| the space | nodes |
| the node | properties |
| a property's value | several values |
| the value | characters |

**The bottom rung is the one people mean.** Asked *does this node contain
`auth`*, a reader of a knowledge tool reads it as *does its prose* — and every
query language agrees: Cypher's `CONTAINS` is a substring operator, SPARQL has
`CONTAINS()` for strings and `IN` for sets, and Python, jq and CEL all use `in`.
Membership is `in`; `contains` stays unspent for text.

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
tokens and dates, which `=` and `in` already reach.

**`not` over a comparison needs a rule, and does not have one.** If `score >
0.7` is false when `score` is absent, then `not score > 0.7` is **true for every
node without a score** — and for every node where it is text or a list. SQL and
Cypher propagate `NULL` through `NOT` and keep only what is true; SPARQL treats
an incomparable operand as an error and drops the row rather than flipping it.

Two-valued is defensible for a first version, and then the idiom is `score and
not score > 0.7`. But it has to be *chosen in writing*, because an agent that
assumes the other reading assembles a confidently wrong query. Undecided, and
the first thing batch 5 must settle.

**Keywords are legal property names today.** `and`, `or`, `not`, `in` all match
`[a-z0-9]+(-[a-z0-9]+)*`, and a node can already carry every one of them — so
`kind = decision and not` reads as a presence test on a property called `not`.
Either they become reserved words, spending names permanently by
[structure](../structure.md)'s arithmetic, or values must be quoted. Also
undecided.

**An unknown property is not an error.** A predicate over a name no node carries
matches nothing, because a read command reports what it found rather than
judging what it was asked. Only a malformed *expression* refuses.

## Ranking, if matching stops being enough

`~` is boolean: a node matches or it does not. BM25 — the standard lexical
relevance ranking, used by Lucene and SQLite's FTS5 — would say which matches
are *best*, by weighing term frequency with diminishing returns, rarity across
the corpus, and document length.

**Parked, because nothing has the problem it solves.** Ranking earns itself when
a query matches more nodes than a caller wants to read. That is a complaint you
can only have after matching exists, and `find` does not.

**And it needs no index, which is worth recording before someone assumes it
does.** BM25 wants term frequencies, document frequencies and an average length
— and `find` already opens and parses every node. Computing all three in that
same pass costs one tokenisation: measured 2026-09-09 over this repository's own
documentation, 24 files and 87 KB read, tokenised and counted in **15 ms**,
extrapolating to roughly 0.6 s at a thousand nodes.

So ranking would not breach *nothing may depend on an index existing*. An index
could come later as exactly what [vocabulary](../vocabulary.md) permits — an
accelerator that may be deleted without notice.

The reason that holds is scale, not cleverness. Inverted indexes exist because a
web-scale corpus cannot be re-read per query. A knowledge space can. Inheriting
the machinery without inheriting the constraint is how a small tool acquires a
stale index it never needed.

**What would trigger it:** a query routinely returning more nodes than the
caller reads. Not a corpus size, and not a feeling that search should rank.

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
