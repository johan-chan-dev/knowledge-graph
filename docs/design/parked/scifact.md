# SciFact, repurposed

```
corpus   5 183 abstracts, sentence-split, 45 952 sentences, ~204 words each
train    809 claims — 957 expert annotations, 616 SUPPORT / 341 CONTRADICT
         1 025 rationale sentences, 565 documents cited
dev      300 claims — 124 SUPPORT / 64 CONTRADICT / 112 NOINFO
         283 documents cover all 300 — the other 4 900 are distractors, 17:1
measured import 6.2 s / 50 nodes · whole-graph load 148 ms at 171 nodes
```

**We take their corpus and their verification annotations as ground truth. We do
not take their metric.** What is measured here is not whether a ranking beats a
published baseline — it is **whether an agent can restitute what it ingested,
through a structure it chose itself.**

Which carries an obligation: a figure produced this way is *a restitution measure
using SciFact's annotations*, never "our SciFact score". Different subset,
different distractor ratio, different metric.

## What an annotation is

Three layers, and only the third is knowledge:

| | | produced by |
|---|---|---|
| the **corpus** | 5 183 abstracts, raw | the papers' authors |
| the **claims** | 1 409 sentences, some true and some deliberately falsified | the dataset's experts |
| the **annotation** | a verdict for each *(claim, abstract)* pair, **and the sentences that justify it** | expert annotators |

Train claim #2 against document `13734012`:

```
claim     "1 in 5 million in UK have abnormal PrP positivity."
verdict   CONTRADICT, justified by sentence [4]
[4]       "…16 were positive for abnormal PrP, indicating an overall
           prevalence of 493 per million population"
```

**And dev claim #5 says *"1/2000 in UK have abnormal PrP positivity"* — same
document, same sentence `[4]`, verdict `SUPPORT`.** The same sentence supports
one thesis and refutes another: **the evidence is neutral and the relation
carries the side**, which is [extraction](extraction.md)'s rule arriving verified
from a corpus built without us. It settles the merge question left open there —
one exhibit, two relations. Merging would destroy a verdict; duplicating would
fabricate a witness.

## The index is the address, not the sentence

**Measured, and it would have corrupted every run silently.** Element `[4]` of
document `33370` holds two sentences the dataset's splitter merged — and it is
an annotated rationale. 319 of the corpus's 45 952 elements are like it.

An ingestion that tidies one of them shifts every later index in that document
by one, and the annotations then point at the wrong text. So the identity of a
piece of evidence is **`(doc_id, array index)`**, never *a sentence*, and the
array is frozen as it shipped, defects included.

That is the concrete failure behind *an agent that loses sentence boundaries
scores zero however well it reasoned* — except worse, because it scores wrongly
rather than zero, and nothing announces it.

## Recognition, and what it costs

**The model knows this dataset.** Asked directly, it named SciFact, its splits
(809 / 300 / 300, test held for a leaderboard), its relationship to BEIR, and
then looked up which claims cite a given document.

So the contamination is not only in the answers. **An eagerly decomposed graph
may be shaped by knowing the task**, and the ontology a first pass produced —
`Source`, `Passage` with a `sentence_index`, `Claim`, `SUPPORTS` / `REFUTES` —
cannot be read as invention: the verdict vocabulary was in the prompt almost
verbatim, and the rest is a dataset the model can recite.

The ablation measures the answers. Nothing yet measures whether the *graph* was
built for the benchmark, and that is the sharper form of the same problem.

## The B delta may be measuring annotation reuse

Dev claim `1137` — *TNFAIP3 is a tumor suppressor in glioblastoma* — is a near
restatement of train claim `1135`, against the same document, with the same
polarity. In configuration B the dev answer is then **one traversal hop from a
hand annotation**.

B is already declared non-comparable, so this is not a fault. But it means B's
headline is carried by pairs like that one, and on those the A→B delta measures
**annotation reuse rather than modelling**. Reporting the delta without
separating near-restatements would credit the graph for a coincidence of
phrasing.

## The measure

The finest unit that goes in is a **sentence**. So the finest question about
restitution is whether that sentence comes back:

| | |
|---|---|
| **primary** | **recall of the annotated rationale sentences**, in two readings that must be named — a pair often carries several *alternative* gold sets, and one complete set is a whole justification. 41% of dev pairs carry more than one, so against their union a perfect answer scores about 0.64 |
| **beside it** | **at which rung** — rung 2 means the structure carried it, rung 5 means the sweep did |
| secondary | the verdict. That measures reasoning, which is a different question |
| ignored | precision on sentences. Surfacing extras is imprecision, not a failure to restitute |

## No human reviews, and that is the experiment

At this scale nobody approves each write, and that is not a compromise the
benchmark forces — **it is the variable**. The question is whether an agent left
to organise autonomously can answer from its own organisation, and a reviewer
would contaminate exactly that.

## The instructions give material and purpose, never form

Handing over labels or relation types would measure our schema and call it the
system's. So, per document, by id:

> This abstract joins a knowledge base that will later be put to scientific
> claims: it must say whether the literature it holds **supports** them,
> **refutes** them, or does not address them — **and name the sentences that
> settle it**.
>
> The base is shared and already holds what earlier documents left in it.
>
> Here is document `<id>`. Decide what it should leave behind, **if anything**,
> and do it.

Three things that clause carries. *If anything* leaves **capture alone** as a
legitimate outcome, which is what [a body is a
remainder](../../../kg/skills/kg/SKILL.md) predicts. *The base is shared* is what
makes look-before-lift possible; without it, 5 183 private taxonomies. *Name the
sentences* is what keeps the measure reachable — an agent that loses sentence
boundaries scores zero however well it reasoned.

**And the count of ingestion conversations is an outcome, not a parameter.**
Five thousand means the agent decomposed ahead of any question. Twelve means it
imported raw and extracted on demand. Nobody tells it which.

## Ingestion is a sparring between the two

Each side holds what the other cannot: the conversation holds **the document**,
the mechanics holds **the graph** and the modelling expertise. So the mechanics
contests — *we already have a node for that*, *that is a second spelling of X*,
*nothing here connects to anything, leave it as text* — and the conversation
writes, since [the mechanics does not](../../../kg/agents/mechanics.md).

**Every exchange is saved, named by `doc_id`.** Not for the archive: for
**attribution**. When a claim fails, its abstract's ingestion conversation says
how it was modelled, which is the only link between a retrieval failure and a
modelling decision.

## The corpus is held by reference, not copied

It is a versioned public release — durable by the rule in the skill, so **a
reference**, and copying 5 183 abstracts into the graph would break it. A node
carrying `doc_id` resolves to `corpus.jsonl` and to `abstract[4]`: **the evidence
stays addressable at sentence grain with nothing duplicated.**

The consequence to expect: the body sweep then runs against the source file
rather than against node bodies, which is `grep` outside the tool — no
vocabulary, no relations. The benchmark will put a finger on that.

## The sweep, because distraction is a variable

283 documents cover all 300 claims; the remaining 4 900 are distractors.

| corpus | distractors | ingestion | whole-graph load |
|---|---|---|---|
| 283 | none | 0.6 min | 0.2 s |
| ~500 | 0.8:1 | 1 min | 0.4 s |
| ~1 000 | 2.5:1 | 2 min | 0.9 s |
| ~2 000 | 6:1 | 4 min | 1.7 s |
| 5 183 | 17:1 | 11 min | 4.5–33 s |

A flat recall curve says distraction does not bite. A falling one says it does —
**and the rung distribution says why**, a drift toward the sweep meaning the
structure stopped carrying.

**~1 000 is where the design works as designed**: the whole-graph load returns
under a second, so rung 3 is usable again, which it is not at 5 183.

Two constraints. **The distractor sample is fixed by a seed**, or the curve is
noise. And the subset must keep the train claims citing the **181 documents that
train and dev both cite**, or configuration B loses its structure for sampling
reasons rather than design ones.

## Two configurations

| | ingested |
|---|---|
| **A** | the corpus alone |
| **B** | A, plus the 809 train claims and their 957 annotated relations |

64% of the documents a dev claim needs are already attached to a train claim, so
in B traversal is a strategy rather than a hope. **B is not comparable to
anything published** — a train split exists to be used, but a score obtained by
traversing 957 hand annotations does not go in a BM25 column.

## Repetition, decided by a pilot rather than in advance

Three sources of variation, treated differently:

| | repeating it measures |
|---|---|
| **the ingestion** | how much the outcome depends on how the agent organised. Expensive — re-ingest |
| **the chain** | the noise of retrieval at fixed graph. Cheap — replay the claims |
| **the distractor draw** | nothing useful — **fix the seed** |

The first is a result, not noise. Two ingestions of one corpus giving very
different restitution says the graph obtained is an accident; giving the same
says the modelling converges, which would be more encouraging than any score.

**So: a pilot at one size — 1 000 documents, three ingestions, the same hundred
claims against each.** Between-graph spread is modelling variance, within-graph
spread is chain noise. Small between-graph spread means one ingestion per size
and the sweep stays cheap; large means repeating at every size, known for three
ingestions instead of fifteen. Recall should be the steadier of the two metrics
and the rung the noisier, since the path varies more than the outcome.

## A run

```
1. git init + kg space init
2. ingestion              ← configuration A or B, one conversation per document
3. record what was built  ← labels list, types list, node and relation counts,
                            the model used, the number of ingestion conversations
4. digest of .kg/
5. the claim sample        ← 100 for the sweep, 300 for a figure to publish
6. digest of .kg/          ← if it moved, the run is void
7. scoring                 ← set operations, no model anywhere
8. compilation             ← recall and rung per size, the A→B delta, the cost
```

**No snapshot.** Each run has its own directory, so the run *is* the record. What
replaces it is an invariant — **the graph does not move during the claims
phase** — and that matters concretely: the loop has a failed lookup propose a
lift, and a lift accepted mid-run would drift the graph under the questions.

## Contamination, measured rather than blocked

SciFact is from 2020, public and much used; the model may have memorised it. The
control is an **ablation**: the same claims, **no graph at all**, answered from
the claim alone. **Above 41%** — the score obtained by always answering
`SUPPORT`, given 124/64/112 — it knew some of it in advance.

Its purpose is not honesty but **interpretability**. If memorisation is high, A
and B both score well and the delta between them collapses — and the delta is
the thesis. Under the restitution framing it also answers a better question:
*what did ingestion contribute at all.*

Requiring the subgraph used is worth doing beside it, and its limit is worth
knowing. Node ids are uuids minted minutes earlier, so an answer naming them had
contact with **this** graph — but a model that knows the answer can work
backwards, find the abstract and produce a valid traversal. **It forces an answer
to be grounded, not to have been found.** That the ids happen to resist recall is
an accident of uuidv7 filenames, not a defence; it would vanish the day ids are
derived from `doc_id`.

## What it is blocked on

Nothing but the work. The data is 3 MB, public, one command.

## What it does not settle

- **The confound in the sweep.** Each size is ingested afresh, so the curve mixes
  *more distractors* with *a differently modelled graph*. Readable as the whole
  system's degradation rather than retrieval's — but not as one variable.
- **Whether A is worth running.** It measures text retrieval and ranking, both
  parked, so it would score an absence. A floor is only useful if the delta above
  it is measured too.
- **How many claims a published figure needs**, against the 100 that give a curve.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
