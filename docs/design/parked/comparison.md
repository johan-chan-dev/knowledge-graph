# Comparison and ordering

`--where score>0.7`, and `--order-by score`.

**The shell decides this, not taste.** `set version 1.10`, `set version '1.10'`
and `set version "1.10"` arrive as the same three arguments — the quotes are
gone before the tool sees anything. So at write time it cannot know whether a
number or a version string was meant, and storing the text it was handed is the
only honest answer to information that no longer exists.

Inside an expression the quotes survive, because the expression is one argument
the tool parses itself. That is the whole of why the two sides differ: **the only
place the tool can see a quote is where it does the quoting.**

**The operator carries the type, not the storage.** `--where a=b` compares text;
`--where a>b` compares numbers, and a value that is not numeric simply does not
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
The substrate's job is to narrow before the practice reads — `--where
confidence<0.4` hands back a candidate set, and deciding what `confidence`
should be is not its business.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
