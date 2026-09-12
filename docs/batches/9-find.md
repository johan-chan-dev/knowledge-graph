# Batch 9 — find

**Done when** you can ask which nodes match a condition over their properties.

The fuller argument is in
[`design/parked/search.md`](../design/parked/search.md); what this batch builds
is below, and what it leaves is named at the end.

## What it has to answer

Neo4j ships the movies dataset with a guide, and the guide asks thirteen
questions. They are this batch's acceptance criteria, listed with their expected
answers in [`tool/conformance/questions.md`](../../tool/conformance/questions.md)
— because a grammar designed from operators and precedence had never been
checked against anything anyone wanted to know.

**Nine of the thirteen turn on `find` and nothing else.** Four already work,
because `links` and `backlinks` print tab-separated and pipe — no traversal
command needs adding. And every selection they need is specified below exactly
as it stands: `title = "Cloud Atlas"`, `released > 2000`, `released > 2010 and
released < 2015`. The grammar was right; it was unverified.

One question — *everything three hops from Kevin Bacon* — stays out of reach,
which is the measured price of putting traversal in a command rather than in
pattern syntax.

## What it should look like

```console
$ kg nodes find '"decision" in labels'
01a084f0-631b-7bba-a6fe-81d79faedbde
01a084f0-63be-732e-b44e-f9029a874a5f

$ kg nodes find 'is retired'

$ kg nodes find '"decision" in labels and is not retired'
01a084f0-631b-7bba-a6fe-81d79faedbde

$ kg nodes find '"decision" in labels and score > 0.7'
```

And the refusals, which are half of what it decides:

```console
$ kg nodes find 'title = Matrix'
not a value: Matrix — `=` compares text, write "Matrix"

$ kg nodes find 'score > "0.7"'
not a number: "0.7" — `>` compares numbers, drop the quotes

$ kg nodes find 'is retired and'
unexpected end of expression — `and` needs something after it
```

Every one refuses **before a file is opened**, by the rule that validation
precedes lookup.

**Backed by** [`9_test.ts`](../../tool/tests/batches/9_test.ts), and by the
guide's nine questions in [`movies_test.ts`](../../tool/conformance/movies_test.ts).

## What it returns

**One id per line, as `nodes list` does.** An empty result prints nothing and
exits `0`, by the same rule. Same scope, same output — the action names the cost
and nothing else.

**It cannot return properties, and that is the model rather than a limit.** A
column per name is a slot, and a node carrying none of that name would need a
cell holding something. There is nothing legitimate to put there: the empty
string is a legal value, so an absent property and `title: ""` would render
identically — the null [`absence.md`](../design/absence.md) argued out of the
store, let back in at the output door. `spec/api.md` states the rule the other
outputs already follow: tab-separated columns are fields, properties are rows.

So values for a matched set come from a loop over `kg node <id> --properties`.
That is composition, which is what *stdout is the answer* is for — a second
command is not a missing feature.

## An action, not a flag

```
kg nodes list     reads the directory. Parses nothing. One syscall
kg nodes find     opens and parses every node
```

A flag would hide a thousandfold cost behind an option. Two actions put it in
the command — the same line the batch documents already draw when they say a
bare listing parses nothing.

It also honours the reservation in [`spec/api.md`](../spec/api.md) — *`find` is
not `nodes list`* — without inventing a scopeless verb, which `kg find …` would
have been.

## Names are bare, values are quoted

```
title = "Cloud Atlas"      a name, an operator, a value
has tagline / is retired   presence — the name alone is not a test
"auth" in labels           a value, an operator, a name
score > 0.7                a bare numeral is a number
version = "1.10"           quoted, and the trailing zero survives
```

**A bare word is always a name or a keyword; a quoted string is always a
value.** Nothing depends on where a token appears, so there are no contextual
keywords and `not` needs no lookahead to tell a negation from a property called
`not`.

It also makes the two operand orders self-explaining: `title = "Cloud Atlas"`
and `"auth" in labels` read differently, and the quoting says which side is which
without anyone having to remember.

## Presence is spelled, and English decides how

A bare name was a presence test in the first draft, and that was wrong — not
ambiguous to the parser, but silent about what it meant:

```
score and not score > 0.7          the same token twice, two different jobs
has score and not score > 0.7      and now the line says so
```

The parser told them apart by looking one token ahead: a name followed by an
operator is a comparison, a name followed by nothing is a presence test. It
worked, and nothing on the line showed it. Every other query language spells
presence out — `IS NOT NULL`, `EXISTS()`, `BOUND(?x)` — and none settles for the
bare name.

**Two auxiliaries, because English has two.** A noun is predicated with *having*
and an adjective with *being*, and which one a property takes is decided by the
name its author chose — which the grammar cannot know:

```
has tagline        has no tagline           a noun
is retired         is not retired           a participle or adjective
```

Both build the same node. They are aliases that **cannot diverge**, because
there is one presence test and two ways to say it, not two features. The reason
to carry both is the primary caller: a model generating a query produces the
correct auxiliary for the word without being told, and forcing the other one
makes it write against the language it already knows.

**The auxiliary carries its own negative.** `not has tagline` parses
mechanically and reads as nothing anyone says, so it is refused, as are the
crossed pairs:

```console
$ kg nodes find 'not has tagline'
not has is not how it reads — write `has no tagline`

$ kg nodes find 'is no retired'
is no is not how it reads — write `is not retired`

$ kg nodes find 'retired'
retired alone is not a test — write `has retired` or `is retired`, whichever reads
```

`not` still composes everywhere it belongs — `not score > 0.7`, and `not (has a
and is b)` over a group. What it may not do is stand in front of an auxiliary
that already has a negative.

**Mechanically correct is not the standard here; grammatical is.** A uniform
`not has` would have been one keyword fewer and one rule simpler, and would have
read like nothing anyone writes. Three names spent — `has`, `is`, `no` — buys a
grammar that reads aloud, and [`structure.md`](../design/structure.md) says a
reserved name is spent permanently, so this is deliberate: none of the three is
a plausible property name.

## Each operator declares its literal

| operator | compares | literal |
|---|---|---|
| `=` `!=` | text | quoted |
| `>` `<` `>=` `<=` | numbers | bare numeral |
| `in` | membership — elements are text | quoted |
| `~` | a regex over text | quoted |

A mismatch refuses at parse time. Nothing is inferred from what a value looks
like, which is the guessing this tool spent
[batch 4](4-stops-guessing.md) removing.

A token beginning `-` followed by a digit is a numeral, and property names begin
`[a-z0-9]`, so `-0.5` cannot be read as a name and `valid-until` cannot be read
as arithmetic.

## A list is a dimension, not a container

`labels: [auth, pattern]` is the node saying two things on one dimension, the
way `title: "Cloud Atlas"` says one. Nothing is holding anything: the list is
how multiplicity is stored, not what is meant.

That is why one operator cannot span both. *Does this node carry `auth` on the
`labels` dimension* stays one question whether the dimension holds one value or
several — so a single predicate for both is not obviously wrong, which is why it
took a defect to see that it is. `labels = "auth"` against a list would answer
*no match* where it means *wrong question*, and that is the silence
[batch 4](4-stops-guessing.md) removed `--where` for producing.

So the operator declares the shape: `=` compares a value, `in` asks about
membership, and each meeting the other's operand is no match rather than
anything inferred from what is on disk.

**It is also why `contains` was the wrong word.** A container holds elements; a
dimension carries values. Every query language spells membership `in` and keeps
*contains* for text, and the metaphor is the reason — which leaves the word free
for the thing that really does contain something, the body.

## Combination

`not` binds tightest, then `and`, then `or`, both left-associative:

```
is not retired and is archived         →  (is not retired) and is archived
not (is retired and is archived)       →  the group
```

`not` takes one optional prefix, not a chain. `not not x` is not a double
negation and has no use; allowing it would make `not not` ambiguous against a
property named `not` for nothing.

## Absence

**Two-valued.** A comparison against an absent property is false; `not` flips
it; `!=` is exactly `not =`. So `not score > 0.7` matches a node with no
`score`, which is the literal reading — *it is not the case that score exceeds
0.7* is true when there is no score.

**A choice with a name.** Absence reading as false is the Closed World
Assumption, and `not` is negation as failure: `is not retired` means *the corpus
does not say retired*, not *retired is false*. Slotlessness does not force it —
SPARQL has no slots and is three-valued anyway — so
[`design/absence.md`](../design/absence.md) argues why it is chosen here, and
what it costs.

**So `find 'p'` and `find 'not p'` always partition the space.** That is the
payoff, and SQL cannot offer it: a row whose column is NULL falls out of both
halves, silently. Here an agent can run a query and its negation and know the
two cover everything — which makes coverage checkable rather than assumed.

**A known asymmetry, stated rather than discovered:**

```
score <= 0.7            false   when score is absent
not (score > 0.7)       true    when score is absent
```

`not (a > b)` is not `a <= b`. Two-valued does not remove that — it relocates
it — and what it does remove is the second problem, since under three-valued
logic `not` stops being a total flip as well. The idiom for the other question
is `has score and not score > 0.7`.

**The evaluator must check presence explicitly.** `undefined > 0` and
`undefined <= 0` are both false in JavaScript, so writing the comparison the
natural way gets the right result for the wrong reason — and inherits every
other thing that coercion decides.

### A value that will not take the type

```
score: abc
kg nodes find 'score > 0.7'     no match
```

[`comparison.md`](../design/parked/comparison.md) settled this: *a value that is
not numeric simply does not match*. It is the same two-valued rule as absence —
a comparison that cannot be made is false, and `not` flips it — so nothing new
is decided and nothing is guessed.

It generalises to any operator meeting a value of the wrong shape. `"cites" in
links` compares text against a list of maps, and does not match either.

**What a literal declares is still checked at parse time.** `score > "0.7"` is
refused before a file is opened, because that is a claim about the query rather
than about the data.

## The shell is the outer grammar

```bash
kg nodes find '"decision" in labels and is not retired'
```

**Single quotes outside**, measured rather than assumed: double quotes let the
shell expand backticks, `$VAR` and `$( )`, and the values being searched are
prose about a tool — a query for a node mentioning a flag would execute part of
itself.

**Both quote characters accepted inside**, so a value containing `"` can use
`'…'` and one containing `'` can use `"…"`. The case with no clean answer is an
apostrophe, because it is the *outer* quote that breaks:

```bash
kg nodes find 'title = "Smith'\''s decision"'
```

Inherent rather than a flaw — every command line taking an expression has it —
and worth documenting, because an agent reaching for double quotes to avoid it
silently gets command substitution.

**One argument, not several.** An argv-token form would let the shell tokenise
and quote each value, which is friendlier until the operators: `>` and `<` are
redirects, and `find score > 0.7` truncates a file named `0.7` and runs a
different query, silently.

## What it leaves

`in`'s semantics beyond the reserved keyword · `~` and the reserved operands
`body`, `body.lines`, `body.size`, `created` · ordering the results by a
property · `date()`.

*Ordering* here is sorting, not `>` and `<` — those are built, and question 1
needs them. [`comparison.md`](../design/parked/comparison.md) holds both under
one title, which is where the ambiguity came from.

The family reversed five times in a single sitting before a grammar settled it.
What ships is the part that stopped moving.

## What it deliberately never grows

**Traversal.** Relations arrive as commands — `kg node <id> links` and
`backlinks`, [batch 7](7-relations.md) — not as pattern syntax. An expression asks about one node's properties; a relationship
is between nodes, which is a different subject and belongs to a different
command, for the same reason `list` and `find` split rather than `list` growing
a flag.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · [7](7-relations.md) · [8](8-movies.md) · 9 · [10](10-resolution.md)
