# Batch 7 — find

**Done when** you can ask which nodes match a condition over their properties.

Planned, and deliberately the first two tiers of a design that has five —
see [`design/parked/search.md`](../design/parked/search.md).

## What it should look like

```console
$ kg nodes find '"decision" in labels'
01a084f0-631b-7bba-a6fe-81d79faedbde
01a084f0-63be-732e-b44e-f9029a874a5f

$ kg nodes find 'retired'

$ kg nodes find '"decision" in labels and not retired'
01a084f0-631b-7bba-a6fe-81d79faedbde

$ kg nodes find 'kind = "decision" and score > 0.7'
```

**Both classification shapes are above on purpose.** A practice that carries
words asks `"decision" in labels`; a practice that chose a dimension asks
`kind = "decision"`. [`design/vocabulary.md`](../design/vocabulary.md) names the
query as exactly where the two diverge, so this document shows both rather than
teaching one by using it everywhere. Neither `labels` nor `kind` is a word the
tool knows — both are property names somebody picked.

And the refusals, which are half of what it decides:

```console
$ kg nodes find 'kind = decision'
not a value: decision — `=` compares text, write "decision"

$ kg nodes find 'score > "0.7"'
not a number: "0.7" — `>` compares numbers, drop the quotes

$ kg nodes find 'kind = "decision" and'
unexpected end of expression — `and` needs something after it
```

Every one refuses **before a file is opened**, by the rule that validation
precedes lookup.

**Will be backed by** `batch 7 — find`, as `7_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

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
kind = "decision"          a name, an operator, a value
retired                    a name alone — presence
"auth" in labels           a value, an operator, a name
score > 0.7                a bare numeral is a number
version = "1.10"           quoted, and the trailing zero survives
```

**A bare word is always a name or a keyword; a quoted string is always a
value.** Nothing depends on where a token appears, so there are no contextual
keywords and `not` needs no lookahead to tell a negation from a property called
`not`.

It also makes the two operand orders self-explaining: `kind = "decision"` and
`"auth" in labels` read differently, and the quoting says which side is which
without anyone having to remember.

**Keywords are reserved as property names** — `and`, `or`, `not`, `in`. Four
names spent, which `structure.md` says is permanent and should be deliberate.
It is deliberate: the alternative is resolving the ambiguity by position, which
does not remove it so much as hide it.

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

## Combination

`not` binds tightest, then `and`, then `or`, both left-associative:

```
not kind = "decision" and retired      →  (not kind = "decision") and retired
not (kind = "decision" and retired)    →  the group
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
Assumption, and `not` is negation as failure: `not retired` means *the corpus
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
is `score and not score > 0.7`.

**The evaluator must check presence explicitly.** `undefined > 0` and
`undefined <= 0` are both false in JavaScript, so writing the comparison the
natural way gets the right result for the wrong reason — and inherits every
other thing that coercion decides.

### Open: a value that is present and not comparable

```
score: abc          legal today
kg nodes find 'score > 0.7'
```

Each operator declares its literal, so `score > "0.7"` refuses at parse time.
That checks *what was written*, not what is on disk — and this cannot be known
before a file is opened, which makes it the first refusal in the design that
cannot precede lookup.

**Blocks tier 2**, and should not be patched here. *What type is `score`?* is a
schema question — general, prior, about a slot — and with no schema it can only
be answered per node, after resolution. Answering it locally by coercing, the
way JavaScript does, would be choosing a schema by accident and is the guessing
[batch 4](4-stops-guessing.md) removed. The alternative is a place for a
generalisation to live, which is
[`design/parked/validation.md`](../design/parked/validation.md).

## The shell is the outer grammar

```bash
kg nodes find 'kind = "decision" and not retired'
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

## Parked — tiers three, four and five

`in`'s semantics beyond the reserved keyword · `~` and the reserved operands
`body`, `body.lines`, `body.size`, `created` · the ordering comparisons ·
`date()`.

The family reversed five times in a single sitting before a grammar settled it.
What ships is the part that stopped moving.

## What it deliberately never grows

**Traversal.** Relations arrive as a command — `kg node <id> neighbors` — not as
pattern syntax. An expression asks about one node's properties; a relationship
is between nodes, which is a different subject and belongs to a different
command, for the same reason `list` and `find` split rather than `list` growing
a flag.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · 7
