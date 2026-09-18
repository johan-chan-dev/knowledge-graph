# SciFact

```
corpus      5 183 abstracts, sentence-split, 45 952 sentences, ~204 words each
train       809 claims — 957 expert-annotated relations, 616 SUPPORT / 341 CONTRADICT
            1 025 rationale sentences, 565 documents cited
dev         300 claims — 124 SUPPORT / 64 CONTRADICT / 112 NOINFO, 283 documents cited
            181 of those 283 are already cited by a train claim
import      6.2 s for 50 nodes, measured → ~11 min for the corpus
```

**One argument: the annotation is what makes this scorable without a judge — and
the agent has to build the graph itself, or the score is of our schema rather
than its modelling.**

[benchmark](benchmark.md) names SciFact as a BM25 target and notes that BEIR
throws away its labels and rationales. This page is the protocol for using the
half BEIR discards.

## What an annotation is

Three layers, and only the third is knowledge:

| | | produced by |
|---|---|---|
| the **corpus** | 5 183 abstracts, raw | the papers' authors |
| the **claims** | 1 409 sentences, some true and some deliberately falsified | the dataset's experts |
| the **annotation** | for each *(claim, abstract)* pair: a verdict, **and the sentences that justify it** | expert annotators |

Unfolded, from `claims_train.jsonl` #2 against document `13734012`:

```
claim     "1 in 5 million in UK have abnormal PrP positivity."
verdict   CONTRADICT, justified by sentence [4]
[4]       "Of the 32,441 appendix samples 16 were positive for abnormal PrP,
           indicating an overall prevalence of 493 per million population"
```

493 per million is roughly one in two thousand, so the abstract refutes the
claim, and the annotator points at the sentence that does it.

**And dev claim #5 says *"1/2000 in UK have abnormal PrP positivity"* — same
document, same sentence `[4]`, verdict `SUPPORT`.** The dataset was built by
taking a real finding and writing both a true and a falsified claim against it.

So the same sentence supports one thesis and refutes another. **The evidence is
neutral and the relation carries the side** — [extraction](extraction.md)'s rule,
arriving verified from a corpus built without us and for something else. It also
settles a question left open there: two identical extracts are not merged.
Sentence `[4]` is one exhibit cited twice, and merging would destroy one verdict
while duplicating would fabricate a second witness.

## Two configurations, and the dataset supplies both

| | ingested | worth |
|---|---|---|
| **A — the floor** | the corpus alone | a purely textual task, **comparable** to published baselines |
| **B — the delta** | A, plus the 809 train claims and their 957 annotated relations | the graph has structure; **no longer comparable**, and that is the thesis |

The 181-document overlap is what makes B more than decoration: **64% of the
documents a dev claim needs are already attached to a train claim**, so
traversal is a real strategy rather than a hope.

**The moment B is used, the published baseline is left behind.** A train split
exists to be used, but a score obtained by traversing 957 hand-annotated
relations does not go in the same column as a BM25 number. Say so when reporting.

## The instructions give material and purpose, never form

**The agent models. We do not.** Handing it labels, relation types, or what
becomes a node would mean measuring our schema and calling it the system's — and
the skill is explicit that the modelling is the agent's and the user never has to
think in nodes.

| given | withheld |
|---|---|
| the files and their format — mechanical fact | labels, relation types, what is a node and what is a property |
| **what the graph is for**: claims will be put to it, and it must answer supported / refuted / unaddressed **with the evidence** | the strategy — ingest everything, sample, or import raw and extract on demand |
| for B, `claims_train.jsonl` and what it contains | that any of it should become relations |

Stating the *purpose* is legitimate and necessary: a modeller who does not know
the coming question models blind. Stating the *schema* is not.

**Leaving the strategy open is what tests [a body is a
remainder](../../../kg/skills/kg/SKILL.md).** Reading 5 183 abstracts costs 5 183
model reads; importing raw and extracting on demand costs almost nothing. If the
rule holds, the agent imports raw. Told what to do, we would never find out.

## What is reproducible is the procedure, not the artefact

Script it end to end — fetch, invoke the ingestion, **snapshot the graph**, run
the 300 dev claims, score. Two runs will build different graphs, and that is a
measurement rather than a defect: a system whose modelling swings and whose
scores follow has said something.

So the record includes **what the agent built** — how many labels, how many
relation types, how many nodes and relations. That is the real content of the
delta.

**One thing the importer must enforce: no dev claim enters the graph.** Their
evidence must never be present, and it is the single way to void the measurement
with nothing announcing it.

## The run, and the scoring

One line per claim, the shape imposed because the scorer needs it — how the
agent recovers a document id and a sentence index from its own model is its
problem:

```json
{"claim_id": 5, "verdict": "SUPPORT", "doc_ids": [13734012],
 "sentences": {"13734012": [4]}, "rung": 2, "contest": null}
```

**`NOINFO` has to be reachable.** 112 of the 300 depend on it, and an agent that
is not told the verdict is three-valued will always produce one of the other two
and lose a third of the set to a wording.

| score | computed as | over |
|---|---|---|
| **retrieval** | precision and recall of `doc_ids` against `cited_doc_ids` | 300 |
| **verdict** | `==` on the label | 300 |
| **rationale** | overlap of sentence indices | **188** — `NOINFO` carries none |
| **rung** | the distribution | 300 |

No model anywhere in the scoring. That is what makes it the hard number, and why
this runs before anything needing a judge.

**The rationale score is the one no other benchmark has.** A verdict can be right
by luck, or from the title without opening the abstract. Checking the sentences
separates a correct verdict from a **justified** one — which is the epistemic
distinction itself: a true belief without the right evidence is not knowledge.

## What it is blocked on

Nothing but the work. The data is 3 MB, public, and downloads in one command.

## What it does not settle

- **The run is not deterministic**, since the chain contains a model. Fix the
  model and report it, or average over N — undecided which.
- **300 runs are 300 delegations.** A rehearsal on 50 before paying for 300 is
  obvious; whether the published figure is one pass or several is not.
- **A whole-graph load costs seconds at 5 183 nodes**, against 148 ms at 171 —
  [corpus-statistics](corpus-statistics.md) put its horizon at a few thousand
  nodes with prose, and this sits on it. Rung 3 has to stay exceptional or a run
  takes hours, which is a constraint on the agent nobody has told it about.
- **Whether A is worth running at all.** It measures text retrieval and ranking,
  both parked — so it would score an absence. It is a floor, and a floor is only
  useful if the delta above it is measured too.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
