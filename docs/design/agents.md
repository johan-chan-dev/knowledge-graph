# The loop

> **Under construction, and marked throughout.** The ingestion arc is written
> into the plugin's skill and in use; the retrieval arc, the two roles and the
> projected answer are not. This is here rather than in
> [`parked/`](parked/) because it has a caller — the plugin ships, the hook
> runs, and half of this is what an agent is doing while reading it.

**One argument: this is a cycle, not two pipelines that happen to share a
store** — and what makes its boundary crossable is a shared ontology rather than
a message format.

## The shape

| | | |
|---|---|---|
| 1 | **Sparring** | knowledge is produced adversarially, in conversation. Nothing reaches disk |
| 2 | **Capture** | free, and refusable by nothing — [raw](parked/raw.md) |
| 3 | **Consolidation** | argued, corrected, narrowed. Most of step 1 does not survive |
| 4 | **Integration, on request** | piece by piece, reviewed. The modelling is the agent's, the decision to write is the user's |
| 5 | **Retrieval** | spell, anchor, expand, compute, sweep — in that order |
| 6 | **Projection** | the answer is a *document*, carrying what it projected from and what it left out |
| 7 | **Back in** | a projection worth keeping is a [derived document](parked/derived-document.md): it declares its patterns, so it announces when its premises move |

Steps 1–4 are in [`kg/skills/kg/SKILL.md`](../../kg/skills/kg/SKILL.md).
Steps 5–7 are not written anywhere.

**Seven closes onto four**, which is the reason to call it a cycle. The output
of retrieval and the input of ingestion are the same object: a document, being a
projection of a subgraph, with its provenance attached. Not two pipelines that
meet at a store — one loop that passes through it twice.

## Two roles, and the interface between them

| the conversation | the mechanics |
|---|---|
| holds the question, and what the user means by it | — |
| **already has the vocabulary** — the session hook put it there, so it runs nothing to be oriented | `labels list` / `types list` when it has gone stale |
| — | the pattern, anchored on a label; then the traversal |
| — | `jq` for comparison, aggregation, negation, projection |
| — | the whole-graph load when the question is corpus-wide — 148 ms, measured |
| — | the body sweep, last and deliberately |
| restitutes partially when ambiguous: the candidates found, never a blind question | — |
| judges whether it is enough; asks again, or stops | returns the answer **and its method** |
| carries a proposal to lift, if the sweep found prose no structure points at | flags it |

**The ontology is the interface, not the message format.** A question goes down
and an answer comes up, and both are intelligible only because each end means
the same thing by *node*, *exhibit*, *thesis*, *remainder*. A mechanics-only
reader would wire an exhibit where a thesis goes and return something
syntactically valid and structurally wrong — invisibly, since the conversation
never reads the commands.

The consequence for any future split of the skill: **the mechanics are an
extension of the shared ontology, never a replacement for it.** Levels, not
parts. The line that sorts a sentence into one or the other: *a rule that
changes what you understand is shared; a rule that changes what you type is
mechanical.*

## What holds it

Written, in the skill:

- **Nothing enters unasked — and silence is not the safe side of that rule.** It
  costs twice: what nobody named is gone at the session's end, and what is saved
  up instead arrives as a heap too large to read.
- **The modelling is the agent's.** The user says what matters in their own
  words and never has to think in nodes.
- **A body is a remainder, not a verdict** — the question is what this
  conversation needed, not what deserves to be structure.
- **An exhibit is not a thesis.** The relation carries the side; the exhibit does
  not.
- **A negative answer is about what was lifted, not about the world.**

Not written anywhere:

- **A question to the user must carry what has already been found.** *Around
  which discussion?* hands back the work they came with; *there are `Decision`
  and `Note`, and three mention the format — which?* hands back a choice.
- **A projection says what it dropped**, not only what it kept. Concision is a
  judgement, and what is cut is where the bias enters.
- **A projected answer separates what came from the graph from what was
  concluded.** The exhibit/thesis line, applied to the answer itself: flattening
  is where an argument gets added, which is what a document is for and what
  makes it able to launder.
- **The projection is not a node.** It reaches the base only if the user says
  so, or the retrieval agent writes unasked.

## Why a subagent, and why it is the exception

Not for quiet. **Because the conversation should not be reasoning in `jq`** — its
work is the conversation, and the projection is where a subagent earns itself,
since it can only return a result and therefore must return one that reads.

But the exploratory sweep it serves is the **minority case in a personal store**.
The user knows the thing is there; they put it there. What is lost is the
detail, and that is a spelling problem — 0.2 s of vocabulary, not a search. An
anchored lookup is one pattern at 113 ms, measured, and delegating costs more
than doing it.

## What it is blocked on

**Bodies.** Measured 2026-09-16: 0 non-empty bodies out of 171 nodes in the only
space on this machine. Steps 5 and 6 have never run against prose, and step 2
has nothing to capture into.

**An agent to be the mechanics.** None exists. Until one does, the two columns
above are one reader wearing both hats, which works and hides whether the
separation is real.

## What it does not settle

- **Where the boundary sits when there is no subagent** — whether the rules hold
  as discipline for a single reader, or only describe a delegation.
- **Whether a projection is offered for keeping every time**, which risks the
  proposal becoming a channel nobody reads, or only when asked, which loses
  what nobody thought to ask for.
- **Whether step 7 is automatic.** A kept answer that declares its patterns is a
  derived document; whether declaring them is a separate act or part of keeping
  it is undecided, and [derived-document](parked/derived-document.md) does not answer
  it either.

---

[docs](../README.md) · [design](README.md) · agents · [absence](absence.md) · [material](material.md) · [vocabulary](vocabulary.md) · [parked](parked/)

