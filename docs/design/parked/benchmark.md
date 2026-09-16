# The benchmark

```
SciFact, BM25 baseline   ≈ 0.662–0.665 nDCG@10
```

**Companion to the ranking parked in [search](search.md).** That page argues
what ranking is for and when it earns itself; [corpus-statistics](corpus-statistics.md)
carries the economics under it. Neither says **how anyone would know an
implementation is correct** — and a ranking that is merely plausible is worse
than none, because nothing about its output announces that it is wrong.

A home-grown corpus cannot answer that. Running BM25 over this repository's own
documentation demonstrates the idea and proves nothing: the output looks
reasonable, and looking reasonable is exactly what a subtly broken
implementation also does.

## BEIR, and what it supplies

The standard heterogeneous retrieval benchmark. Every member is normalised to
the same three parts — a **corpus**, a set of **queries**, and **qrels**, the
relevance judgements — and the primary metric across the suite is **nDCG@10**.
BM25 is carried as the reference baseline, which is the part that matters here:
the question is not whether our ranking looks good but whether it **lands where
BM25 is known to land**.

Two members sit in the 1 000–10 000 document band and therefore inside what a
re-read-per-query design can serve: **NFCorpus** and **SciFact**. SciFact's BM25
baseline is reported around **0.662–0.665 nDCG@10**. An implementation scoring
0.66 is right; one scoring 0.45 is broken, and the gap says where to look.

## The analyser is the variable, not the formula

**A BM25 number without its analyser is not comparable to anything.** The
formula is settled and short; what moves the result is everything around it.

| | |
|---|---|
| parameters | two conventions coexist in the literature — `k1=0.9, b=0.4` (the Anserini/BEIR setup) and `k1=1.2, b=0.75` (the classic default, and the one used in this repository's own demonstrations) |
| tokenisation | what counts as a term, and whether digits and punctuation survive |
| case | folding or not |
| stopwords | which list, or none |
| stemming | Porter, or nothing |

So whatever gets built states its analyser beside its score, always. Two numbers
produced under different analysers are two measurements of different things
wearing the same name.

**A second trap, at the level above:** published "BEIR average" figures often
cover 12 to 15 members rather than the whole suite. Comparing two averages
without checking which members each covers compares nothing.

## What it would prove beyond correctness

SciFact is roughly 5 000 documents — **five times larger than anything this
design has been measured against**. At the ~250 ms per thousand nodes measured
in [corpus-statistics](corpus-statistics.md), a query costs about 1.2 s and a
full 300-query run about six minutes. Acceptable for a benchmark, and it puts
the load-bearing claim of the whole approach — *a knowledge space can be re-read
per query* — under real tension instead of asserting it at 171 nodes.

That is the second reason to wire a benchmark, and it is independent of
ranking: it tests the architecture.

## Judging without qrels — three systems, and a live dispute

The paragraph above says a home-grown corpus proves nothing because it has no
relevance judgements. **That is too strong**, and the qualification is worth
carrying: judgements can be generated rather than written.

| | what it evaluates |
|---|---|
| **Open RAG Eval** (Vectara) | a whole RAG system, **without predefined answers**, on automated metrics — UMBRELA for relevance, plus hallucination |
| **Open RAG Benchmark** (`vectara/open-rag-bench`) | a dataset with tooling to run it against LangChain and LlamaIndex |
| **BenchmarkQED** (Microsoft) | query generation, scoring and dataset prep — **AutoQ** synthesises queries across a *local↔global* spectrum, **AutoE** scores against assertions, **AutoD** samples and summarises. Ships the Behind the Tech transcripts and 1 397 AP News health articles |

**UMBRELA is what carries the claim.** *UMbrela is the (Open-Source
Reproduction of the) Bing RELevance Assessor* — a model assigning four-level
relevance (0–3) to query-document pairs, reproducing Microsoft's Bing work and
reported to correlate highly with human annotations and with system rankings
across the TREC Deep Learning Tracks 2019–2023. TREC 2024's RAG track released
UMBRELA-produced qrels.

**And it is contested, in the same literature.** *LLM-based Relevance Assessment
Still Can't Replace Human Relevance Assessment* (2025) argues the opposite, and
a companion line of work measures how far these judgements move with the prompt
alone. So this is a live dispute rather than a settled substitution, and a page
that cited only the affirmative half would be doing what
[extraction](extraction.md) warns about: a file where nothing contradicts
anything is a one-sided pleading.

**What it would change here.** Generated judgements over this repository's own
`docs/` would remove the only reason that corpus was rejected. Two cautions
before that is treated as free:

- **These evaluate a system's answers; BEIR evaluates a retrieval function.**
  Different objects. There is no generation pipeline in this tool — there is a
  tool an agent drives — so the first thing needed is still whether the ranking
  is *correct*, not whether the answers read well.
- **A judge shares common sense, not your intent.** On TREC, *is this passage
  relevant to this query* is a judgement anyone can make. On *what did we decide
  about the output format*, relevance depends on what was decided, which is the
  thing under test. The circularity is sharper on a personal store than on a
  public corpus, and it is not removed by a better judge.

**One piece is worth taking regardless of the scoring.** AutoQ's *local↔global*
spectrum is a diagnostic this design would fail informatively: a pattern answers
local questions exactly and global ones not at all, since aggregation is `jq`'s
and summarisation is nobody's. Running the spectrum would draw the tool's
boundary as a measurement instead of a claim — no judge required.

Assertion scoring, as in AutoE, is also the cheap shape that fits: assertions
about what an answer must contain, written by the person who wrote the pages.
That is the same instrument already used for the skill's triggering eval, where
each query carried an expected verdict rather than a gold answer.

## What it cannot do

**BEIR measures documents, not graphs.** It would evaluate the textual half and
say nothing about patterns, relations, provenance or extraction. The knowledge
graph field has its own benchmarks — link prediction, question answering over a
graph — and none of them measures what this tool does, which is a personal
store curated by hand with typed relations someone chose.

So: **the ranking becomes comparable; the tool does not.** Worth stating plainly
before a good number on one half gets read as a verdict on the whole.

## What it is blocked on

Nothing but the feature it accompanies. Ranking is not built, and
[search](search.md)'s trigger — a query routinely returning more than a caller
reads — has not fired.

**But the benchmark inverts that argument rather than waiting behind it.**
Implementing against an etalon produces something correct; implementing against
this repository's `docs/` produces something that looks correct. If ranking is
ever built, the order is the benchmark first, because afterwards there is no
longer any way to tell the two apart.

## What it does not settle

- **Which member**, and whether the corpus is vendored into the repository or
  fetched — a test that needs the network is a test that fails for reasons
  unrelated to the code.
- **Whether the analyser is a documented choice or a fixed one.** A knowledge
  space is not a scientific abstract corpus, so the analyser that scores best on
  SciFact is not automatically the right one here; the benchmark checks the
  implementation, it does not choose the configuration.
- **Whether any of this belongs in the repository at all**, or stays a procedure
  run once against a scratch checkout. Six minutes is not a unit test.
- **Whether generated judgements are trusted here**, which the field itself has
  not settled — and which is harder on a personal store, where the judge can
  share common sense but not the author's intent.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
