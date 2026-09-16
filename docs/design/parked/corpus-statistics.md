# Statistics over the corpus

```
46 files, 302 KB, 51801 tokens, 3584 distinct terms

read + parse    :   6.4 ms   ← the pass that happens anyway
tokenise + df   :  11.6 ms   ← the marginal cost of everything below
                              ~253 ms extrapolated to a thousand nodes
```

**One question, three candidates.** What can be computed from the corpus alone,
inside the pass that already opens every node — and what needs something the
corpus does not contain. [search](search.md) parks the ranking; this page parks
the economics under it, and two things that share the same arithmetic.

## The rule it is measured against

[vocabulary](../vocabulary.md) allows an index only as an accelerator that may
be deleted without notice: **nothing may depend on an index existing.** So the
test for any statistic is not whether it is useful but whether it can be
recomputed, from the corpus, deterministically.

The measurement above is what makes that answerable, and the split is the whole
argument. An inverted index buys the avoidance of **the read** — which here is
6.4 ms, because there is no index to consult, so any text query opens every node
regardless. What is left to pay is the tokenisation. Lucene exists because a
web-scale corpus cannot be re-read per query; a knowledge space can.

([search](search.md) measured 15 ms over 24 files on 2026-09-09, by a different
route and a smaller corpus. Same order, and the two agree that the cost is the
tokenisation rather than the I/O.)

## Ranking — passes, and is *more* capable recomputed

The ranking argument and its trigger belong to [search](search.md) and are not
repeated, and how anyone would know an implementation is correct belongs to
[benchmark](benchmark.md). What that page does not say is what recomputation buys beyond cost.

**The corpus is chosen at query time.** Restricting to a label recomputes the
document frequencies over that label's nodes — so a term common across the whole
space can be rare among `:Decision`, and scoping *changes the weights* rather
than filtering the result afterwards. That is better ranking, not narrower
ranking.

Neo4j cannot do this: its full-text index fixes the scope at creation —
`CREATE FULLTEXT INDEX … FOR (n:Decision|Note) ON EACH [n.title, n.body]` — and
another scope is another index. The absence of an index turns a rigidity into a
choice that can be remade per question.

**The price, to write down before someone compares two lists:** if the
frequencies depend on the scope, scores from different scopes are not
comparable. Harmless while ranking within one query.

## The same two numbers, transposed

| | given | ranks | answers |
|---|---|---|---|
| ranking | a query | the **documents** | which to read |
| characteristic terms | a document | its **words** | what it is about |

Term frequency and rarity, read along the other axis. Measured over this
documentation, with no stoplist and no configuration:

```
extraction.md   → extract, exhibit, quote, digest, concept, anchor, raw
raw.md          → raw, capture, qualifying, outgoing, judged, ratio
naming.md       → slug, camelcase, digit, replace, word, camel, kebab
search.md       → contains, regex, ranking, score, grammar, expression
```

**This has the better case of the two, here.** Ranking's trigger has not fired —
nothing returns more than a caller reads, and there is no body text to match at
all. Extraction's has: the open problem is what remains unlifted in a body, and
characteristic terms are a **proposal of what a body carries**, which is a
candidate generator for a pass and leaves the judgement where
[raw](raw.md) puts it.

A second use falls out. A term recurring across several un-mined bodies that is
**neither a label nor a relation type** is a vocabulary candidate — which turns
terminology drift into something the corpus reports, rather than something one
person is expected to remember across eighteen months.

Two reserves. It is **noisy** — `yes` and `outgoing` are a table artefact and a
turn of phrase; a real extractor adds a stoplist and n-grams. And it measures
**words, not claims**: a characteristic term says what a body is about, never
what it asserts. An indicator of where to read, never a substitute for reading.

## Embeddings — the first thing that would need the exception

Not argued anywhere in `docs/` before this page.

A ranking table recomputes **from the corpus alone, deterministically**. Vectors
recompute from the corpus **plus a model**, whose output differs across versions.
Deleting a term table costs a re-read; deleting vectors costs a model call per
fragment, and regenerating them a year later does not give back the same
vectors. So this would be the first feature in the design to require derived
state that is not reproducible — which is the argument to have, rather than
whether semantic recall is desirable.

There is a second objection from [extraction](extraction.md): a cosine
similarity carries **no chain of custody**. In a store where every fact holds
its quote and its offsets, *these five are close, trust me* is an exhibit no
opposing party could examine. That disqualifies it as a primary path and not as
a recall aid — proposing candidates a reader then verifies stays honest.

And the need is narrower than it looks. A typed relation is a **declared**
semantic proximity, reviewed and directed, so traversal already answers *what is
related to this*. Vectors would help only at the **entry** problem — finding the
first anchor node from a question whose words are not in the text.

## The horizon

~250 ms at a thousand nodes, ~2.5 s at ten thousand. Past a few thousand nodes
**carrying prose**, recomputation stops being interactive and an index becomes
necessary, with its staleness. The index is not wrong; it answers a problem this
space does not have yet, and the number above is where that stops being true.

No useful middle. Caching the frequency table and the lengths — 3584 terms here,
trivial — saves nothing while the bodies are still read for term counts. Either
the read is avoided or it is not.

## What it is blocked on

**Bodies.** Measured 2026-09-16: the only space on this machine carries **0
non-empty bodies out of 171 nodes** — an import of properties, the opposite
shape from the one all of this assumes. Every statistic here is over text that
no space currently holds, and the demonstration above runs on `docs/` because
that is where the prose is.

## What it does not settle

- **The stoplist and n-grams**, without which characteristic terms stay noisy.
- **Whether characteristic terms are ever proposed unasked**, which is
  [raw](raw.md)'s open question — a hook has no skills, and nothing here runs
  unprompted.
- **Which of the three is worth building first**, given that the one with the
  live trigger is the one nobody asked for.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
