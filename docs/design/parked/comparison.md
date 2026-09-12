# Comparison and ordering

Comparing values, and ordering by one.

> **Half of this is built.** The comparison operators shipped with
> [batch 9](../../batches/9-find.md), and the rule below is what it implements —
> a value that will not take its operator's type simply does not match, held by
> `src/evaluate_test.ts`. Ordering has no caller yet and is what keeps the page
> parked.
>
> It was written when filtering was `--where`, a flag
> [batch 4](../../batches/4-stops-guessing.md) removed. The rules did not change
> with the spelling, but the old one made the page look like it was about
> something that no longer exists — which is how batch 9 came to re-derive a
> question answered here.

**The shell decides this, not taste.** `set version 1.10`, `set version '1.10'`
and `set version "1.10"` arrive as the same three arguments — the quotes are
gone before the tool sees anything. So at write time it cannot know whether a
number or a version string was meant, and storing the text it was handed is the
only honest answer to information that no longer exists.

**And it does more than erase.** `set status ~` stores `/Users/jconan`: the
shell expanded the tilde before the tool was invoked, so there was nothing to
refuse, and the value differs per machine. Quoted, `'~'` stores the character
and serialises back quoted.

So **argv cannot express *no value* at all.** Every candidate is either a legal
value — `null`, `none`, the empty string — or gets rewritten on the way in.
That is why absence is a verb: `unset` does not travel through argv as data,
and no sentinel could.

Inside an expression the quotes survive, because the expression is one argument
the tool parses itself. That is the whole of why the two sides differ: **the only
place the tool can see a quote is where it does the quoting.**

**The operator carries the type, not the storage.** `a = "b"` compares text;
`a > b` compares numbers, and a value that is not numeric simply does not
match. The file stays untyped — `set` still stores text and `--properties`
still returns it — so two callers can disagree about whether `score` is a number
without the node taking a side. That is mechanically different from typing the
property, and it keeps the tool ignorant of what `score` means.

**This is not the road to a query language.** `=`, `>`, `<`, `>=`, `<=`,
present and absent are bounded and mechanical. What `layers.md` declined was
`or`, grouping, path expressions and entailment — the things that make a
language. Conflating the two was a slippery-slope argument, and the slope is not
there.

**It waits on a practice.** Confidence scoring decides what corroboration is
worth and how staleness decays; that is meaning, and it lives above this layer.
The substrate's job is to narrow before the practice reads —
`kg nodes find 'confidence < 0.4'` hands back a candidate set, and deciding what
`confidence` should be is not its business.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
