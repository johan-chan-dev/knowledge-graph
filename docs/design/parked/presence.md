# How presence is spelled

> **Two roads, one of them prototyped.** The keyword road was built and backed
> out (`7d20ebe`, `d962bff`, reverted at `8875138`) — 97 tests passed, so that
> shape is known to work. It came back out because it was built during a design
> conversation, before anything planned it. The function road is the later
> proposal and has not been built.

A bare name is a presence test today: `retired` asks whether the node carries
that property. It parses unambiguously and reads as nothing.

## The defect is that one token does two jobs

```
score and not score > 0.7
└─ proposition        └─ operand
```

The parser tells them apart by looking one token ahead — a name followed by an
operator is a comparison, a name followed by nothing is a presence test. That
works, and **nothing on the line shows it**. `not retired` reads as a negated
value rather than a missing key, which is also how every other query language
sees it: `IS NOT NULL`, `EXISTS()`, `BOUND(?x)`. None settles for the bare name.

## Two auxiliaries, because English has two

A noun is predicated with *having*, an adjective with *being*:

```
has tagline        has no tagline           a noun
is retired         is not retired           a participle or adjective
```

Both build the same node. They are **aliases that cannot diverge** — one
presence test, two ways to say it, not two features.

**Why both rather than one.** Which auxiliary reads correctly is decided by the
name its author chose, and the grammar cannot know that: the vocabulary is open,
so no rule in the parser can pick the right word for a name it has never seen.
Carrying one auxiliary would mean `has no retired` or `is not tagline` — a
grammar that reads wrong half the time, depending on how a practice happens to
name things.

**And the primary caller is the argument, not an afterthought.** A model
generating a query produces the correct auxiliary for a word without being told.
Forcing the other one makes it write against the language it already knows,
which is how wrong queries get generated.

## The auxiliary carries its own negative

`not has tagline` parses mechanically and reads as nothing anyone says, so it
refuses, as do the crossed pairs:

```
not has tagline    →  not has is not how it reads — write `has no tagline`
is no retired      →  is no is not how it reads — write `is not retired`
retired            →  retired alone is not a test — write `has retired` or
                      `is retired`, whichever reads
```

`not` still composes everywhere it belongs — `not score > 0.7`, and `not (has a
and is b)` over a group. What it may not do is stand in front of an auxiliary
that already has a negative. This is the same shape as the existing refusal of
`not not`, not a new kind of exception.

### What the keyword road costs

Three reserved names — `has`, `is`, `no` — bringing the grammar's keywords to
seven with `and`, `or`, `not` and `in`.
[`structure.md`](../structure.md) says a reserved name is spent permanently, so
this has to be deliberate. It is: none of the three is a plausible property
name, which makes the expenditure theoretical rather than real.

**Mechanically correct was the wrong standard.** A uniform `not has` would have
been one keyword fewer and one rule simpler, and would have read like nothing
anyone writes. For a grammar whose whole purpose is to be written fluently by
something that knows English, that is the wrong trade — which is the objection
the function road answers differently, by not reading as English at all.

## The other road: a function, not a keyword

```
has(tagline)
not has(tagline)
"Movie" in labels and not has(tagline)
```

**The awkwardness disappears rather than being worked around.** `not retired`
read badly because `retired` looked like a value. `not has(tagline)` does not
read as English at all — it reads as **code**, and negating a predicate call is
ordinary in every language. SQL's `NOT EXISTS(…)` works for the same reason.

**And no name is spent.** A function lives before a parenthesis, so `has` stays
a legal property name and the punctuation tells them apart. That is the whole
cost difference between the two roads.

**The lookahead objection, and why it does not apply.** `has` alone would be a
name and `has(…)` a call, so the reading still depends on the next token — which
is the defect parked above. The difference is that **a visible punctuation mark
is not a hidden lookahead**: with a bare name the two readings were equally
plausible to the eye, and with a parenthesis there is nothing to mistake.

**It is a family, not a special case.** [Batch 9](../../batches/9-find.md)
already names `date()` among what it leaves, so functions are expected rather
than introduced here; `has` would simply be the first. It also extends an
existing rule — *each operator declares its literal* becomes *each function
declares its arguments*, and `has` takes a **name**, not a value, checked at
parse time like everything else.

**On the name.** `has` is what this test is called wherever it exists —
`Object.hasOwn`, `Map.has`, `Reflect.has`, `hasattr` — and it claims nothing
about the value, which matters here: `status: ''` is carried and empty, and
`defined(status)` would make a reader hesitate where `has(status)` does not.
Function names stay single words, which sidesteps kebab-case entirely: it is a
Lisp and CSS convention, and in a C-family grammar a hyphen reads as minus.

## What separates the two roads

| | keywords | function |
|---|---|---|
| reserved names spent | **three** — `has`, `is`, `no` | none |
| length | `has tagline` | `has(tagline)` |
| reads as | English, correctly, both polarities | code |
| extends to `date()`, `matches()` | no — each needs its own keyword | yes, same shape |

The keyword road buys prose at the price of the reserved vocabulary; the
function road buys a family at the price of four characters per test.

## What it waits for

Nothing in the design. It waits for a batch to plan it — which is the trigger
this directory leaves by, and the one thing that was missing when it was built.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
