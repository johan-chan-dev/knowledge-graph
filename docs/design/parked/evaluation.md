# Evaluating the system

[benchmark](benchmark.md) asks whether a *ranking* is correct, against a
published baseline. This asks something else: **does the pair answer well, and
is the boundary between its two halves real.**

Triggering is already measured and is not repeated here. The skill's description
was run against 22 queries, best of two runs each: **20/22 at query level, and
zero false positives across 24 negative runs**, including two written to trap a
description that had been deliberately widened. That settles whether the skill
fires. Everything below is about what happens after it does.

## Four layers, cheapest first

**a) Retrieval alone, with known answers.** A question set over a corpus the
author wrote, each question naming the node or nodes that answer it. Did the
mechanics reach them. No judge is needed — the answer is named once, by the
person who wrote the page. This is the instrument [benchmark](benchmark.md) says
is free on a corpus you wrote, and the same shape as the triggering eval: a
query carrying an expected verdict rather than a gold answer.

**b) The rung distribution.** [The loop](../agents.md) orders retrieval into five
steps by increasing cost — spell, anchor, compute, restitute, sweep. So record
**which rung produced the answer**. A healthy system answers mostly at rung two.
If most questions fall through to the body sweep, **the structure is not earning
its place**, and that is a statement about the graph rather than about the model.

No judge, no baseline, no gold answers beyond (a)'s — and it moves for the right
reasons: after an extraction pass, after an index, after a decomposition.

**c) The pairing matrix.** The two roles may run different models. Same question
set, run as (strong, strong), (strong, weak), (weak, strong).

This is not a cost exercise. **It is the test of the claim `agents.md` makes** —
that the ontology is the interface. That page admits the weakness itself: without
a subagent the two columns are one reader wearing both hats, *which works and
hides whether the separation is real*. Two different models across the boundary
stop it hiding. If a weak mechanics still returns usable answers, the ontology
is carrying the boundary. If everything collapses, the separation was a fiction
and one large model had been covering for it silently.

**d) Projection quality.** Whether the document that comes back is a good answer
— and the only layer needing a judge or the author. It is also where
[benchmark](benchmark.md)'s live dispute over generated relevance judgements
lands hardest: on a personal store, a judge shares common sense but not the
author's intent, and what counts as the right answer depends on what was
decided, which is the thing under test.

## The asymmetry a binary score hides

**An answer can be right and expensive** — found at rung five when it should have
been reachable at rung two. Any found/not-found score counts that as a success,
and it is the same blind spot as reviewing every write: review covers precision
completely and recall not at all.

So (a) and (b) are one measurement, not two. *Found, at which rung* is the unit.

## What it is blocked on

**Both of the other two pieces**, which is why this page also answers what to
build first rather than merely waiting behind it.

- **A corpus with prose.** Measured 2026-09-16: 0 non-empty bodies out of 171
  nodes in the only space that exists. There is nothing to retrieve.
- **A subagent.** Layer (c) is undefined without one, and (b) is only half
  meaningful — a single reader can record which rung it used, but nothing
  prevents it from shortcutting the ladder it is measuring itself against.

## What it does not settle

- **Attribution across the boundary.** When (strong, weak) degrades, the cause
  may be the weaker model, or the ontology failing to carry — and the result
  looks the same from outside. Without a way to tell them apart, the matrix
  reports that something broke and not what.
- **Where the question set lives**, and who maintains it as the corpus grows. A
  question set that ages with the graph measures the graph; one that does not
  measures the drift between them.
- **Whether a judge is trusted here at all**, which the field has not settled
  either — see [benchmark](benchmark.md).
- **What a good rung distribution looks like.** *Mostly rung two* is a guess
  until something has been measured twice.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
