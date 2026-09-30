# Vocabulary

**A word a node carries, and nothing more.** The words are open, and which nodes
carry which word is never written down.

A word groups. Carrying one is how a node says what it is about, and matching
one is how it is found again.

## Open, because the groupings arrive late

Material clusters. Some of it turns out to be about authentication, some about a
recurring pattern, some about a vendor's behaviour — and *which* clusters exist
is not knowable when the first piece is written. A subject becomes visible only
once enough material shares it that the shape can be seen at all.

So the vocabulary cannot be fixed in advance. Anything demanding the right group
at the moment of writing would be demanding a guess, and would then freeze the
guess into the structure.

**The cost of the closed alternative is charged at the worst possible moment** —
the moment of insight, when the thing just understood does not fit any of the
words that were allowed.

## A group is not a folder

The obvious implementation is a directory per subject, and it should be
resisted, because grouping and containment settle at different times by
different means.

| | a word | a folder |
|---|---|---|
| arrives by | noticing | deciding |
| costs | nothing — overlapping, revisable | a boundary that has to be maintained |
| a thing can be in | as many as apply | exactly one |

The last row decides it. A piece of material is about authentication *and* about
a pattern *and* about a vendor. A folder forces a choice between them, and the
choice then gets made on filing convenience rather than on meaning.

## Membership is computed, never stored

The only authored fact is that a node carries a word. Which nodes carry which
word follows from that, and follows *completely* — so writing it down anywhere
creates a second place stating the same fact, and two places stating one fact
are two places that can disagree.

A stored membership list has to be kept honest by construction, and the
construction is never free: something must rebuild it on every change, or
something must detect that it is behind. **A thing that could be stale is a
design error rather than something to check for**, and the version that cannot
go stale is the one that was never written down.

Computing it is a read of the material. At the scale one collection holds that
is fast enough that the question does not arise — and the day it stops being
fast enough, whatever gets built to speed it up is an accelerator that may be
deleted without notice, never something anything is allowed to depend on.

## Why the words are constrained

A word is meant to be **typed and matched exactly**. It is not prose; it is a
key that two people, or a person and an agent, have to arrive at independently
and land on the same string.

Anything requiring quoting or escaping is a word that will eventually be typed
wrong, and will fail by silently matching nothing rather than by complaining.
That is the whole reason the form is restricted; the specific restriction is
[the spec's](../spec/api.md).

## Where this comes from, and what it is not

The shape is Neo4j's, and borrowing it deliberately is cheaper than inventing:
**labels classify, properties hold data.** A node carries any number of labels;
a label is a bare word with no value attached; and what a label *means* is not
the store's business.

A **kind** is a label, not a second mechanism beside one. It is a word a
knowledge-management practice has **specialised**, by attaching rules to it:
*Decision* is a kind when some practice says a decision must state what would
unmake it. The word is a practice's, and so is the rule — and the place the rule
is written is the word's own description, `kg label <word> write`.

So nothing in the store tells a kind from any other label. The whole difference
is what somebody wrote behind the word, which is also why nothing can be
enforced from it: the tool carries that description and never reads it.

**The substrate knows the slot, never the word.** `labels` is reserved — `set`
and `add` refuse it, `label` and `unlabel` write it — so that the vocabulary can
be listed at all ([api](../spec/api.md)). What the tool knows is which dimension
classification is. Which words fill it, and what any of them oblige, it has no
access to.

**The confusion worth avoiding** is reading `kind` as something the tool might
own. It is a word somebody chose, and it appears in these documents only as an
example of that — see [structure](structure.md), where the line between a word
somebody chose and a fact the format holds is what decides whether the tool may
know a name at all.

## What the borrowing does and does not come with

Checked 2026-09-30, because a borrowed shape invites borrowing the advice that
travels with it. **Neo4j's own manual is typographic and nothing else** — labels
in PascalCase, relationship types in SCREAMING_SNAKE_CASE, properties in
camelCase, names case-sensitive. On *which* word to choose it is silent, and the
Getting Started modelling page names use cases without ever connecting them to
label design.

The substantive doctrine is on their developer blog, at blog weight rather than
specification weight:

| | |
|---|---|
| "Always have a query use case for a label" | the rule that survives translation best |
| "Multiple labels should be semantically orthogonal" | their word for a thing argued below |
| "Past 4 labels per node, expect overall performance to get worse" | **does not port — see the next section** |
| anti-pattern: class hierarchies, `:Bat:Mammal:Animal` | "someone creating a semantic model as opposed to focusing on how to answer questions" |
| anti-pattern: "noun verber" labels, `:CarOwner` | a HAS-A smuggled into a classifier |

The first anti-pattern comes with the argument that makes it stick, and it is
mechanical rather than aesthetic: **the same set is available by intersection
anyway.** `(:Person:Director)` needs no `:PersonDirector`, and here that holds
literally — several labels on one pattern are conjunctive, per
[api](../spec/api.md).

## What a word costs, and why their budget does not port

Their number is a claim about a storage engine: a label costs an index entry, so
the cost lands **per node**. Nothing of that shape exists here. A node's words
are a list in its own frontmatter, read whole whenever the node is read, so
carrying eight costs nothing a pattern can notice.

**The cost here is per distinct word, and it is paid by every session.** The
session hook puts `labels list` and `types list` into context before the first
question is asked, which is the whole of its value — so the vocabulary is a
standing tax proportional to how many words exist, not to how they are spread.

It has two halves, and the second is the one that bites:

| | grows with | |
|---|---|---|
| tokens | the number of words | linear, and directly measurable |
| **selection** | **confusability** | thirty crisp words are easier to choose between than eight that overlap |

So *semantically orthogonal* is a modelling nicety in Neo4j and a **performance
rule** here: orthogonality is exactly what makes a choice unambiguous. And a
word that partitions nothing is not merely inelegant — it is a word the reader
must consider and discard at every question, pure cost against no return.

**And invention is close to irreversible.** [api](../spec/api.md) is explicit
that a word outlives its last use: when the final node drops it, it stays at a
count of `0`, because the vocabulary records what has been said here. Only
`forget` removes it. Reusing an existing word, meanwhile, is free on both halves.

The pressure is therefore asymmetric and sharp: **reuse beats invent**, and not
as a matter of tidiness — it is the only one of the two whose cost does not
repeat.

## Choosing one

The page above says what a word *is*. This is how one is picked, and the reframe
that makes the rest derivable:

> **A label is not a name for what a thing is. It is a prediction about what
> somebody will ask for.**

The essentialist question — *what is this node* — is the wrong one, and it is
the one that produces vocabulary nobody uses. The right one is *what future
question will need exactly this set*.

An order, not a checklist, because the costs above are asymmetric:

**0. Often, not yet.** Groupings arrive late; that is this page's opening
argument and it applies to the act of labelling itself. Material can be written
without being classified. Labelling *is* the qualifying act
([raw](parked/raw.md)), so demanding it at writing time demands the guess this
page exists to avoid.

**1. Write the question, literally.** One sentence. If it will not come, there
is no label here — there is a description, and a description is a property.

**2. Try the existing vocabulary against it.** It is already in context. If a
word that exists returns that set, it is done, and it was free.

**3. Ask whether the set is already reachable.** By a traversal, a property, an
intersection of labels, a `jq`. **A word earns itself only when the set is not
otherwise joinable** — which is Neo4j's class-hierarchy argument arriving from
the other direction.

**4. Only then the word, tested by confusability.** Not *is it apt* but: could
somebody holding the question pick a different one from the list? That cost is
paid at every question, not once.

**5. Write its description in the same act.** `kg label <word> write`. The word
carries the extension; the meaning lives behind it. A word without a description
is one the next session has to guess at.

**An analogy may carry an argument; it must not carry a name.** A label travels
to people who have not read the page where the analogy is explained — so the
argument may be forensic, archaeological, whatever illuminates, while the word
stays plain. The test, with no appeal to taste: *a label you need to know a
trade to know the exclusions of is a bad label.* This describes a discipline the
repository already kept without stating it —
[extraction](parked/extraction.md)'s prose is a courtroom throughout while its
words are `Extract`, `Source`, `Concept`.

## Nobody sweeps it

`forget` exists and nothing calls it. A vocabulary only grows: every word
outlives its last use, selection degrades, and no pass ever comes.

This is the third appearance of one gap — [raw](parked/raw.md)'s uncounted
inbox, the anchors nothing re-checks in [extraction](parked/extraction.md), and
now this. Same cause each time, and both pages name it: **nothing here runs
unprompted.**

What is different is that the trigger can be computed rather than felt. Two
signals, neither needing anything built:

| | |
|---|---|
| **extension**, at either end | a word carried by one node out of three hundred grouped nothing; one carried by two hundred and ninety-nine refused nothing. Both are dead weight |
| **rung inflation** | a question that should answer at rung 1 or 2 answering at 4 after an empty pattern is a missed anchor — the signature of two words that can be confused |

`labels list` does not carry the count, deliberately: [api](../spec/api.md)
records that the count it once had forced a parse of every node. So extension is
a whole-graph read — 148 ms at 171 nodes, cheap enough to inspect on demand and
too dear to pay every session, which is exactly the right place for it.

**And the tool already closes half of the confusion trap.** A word that does not
exist refuses and names its near neighbour, so a misspelling cannot return as
*nothing matched*. A word that exists and is the wrong one gets no such help,
and nothing can give it — which is why rung inflation is the only signal left
for the case that matters.

## What a word is not

It carries no meaning the tool can act on. Nothing about a word decides what a
node must contain, what it means, or whether it is any good — those are
questions for whatever practice is being followed, and the tool has no access to
one. A word is a string that some nodes have and others do not.

Which is why the tool never learns any particular word. It carries them, indexes
by them and finds by them; **which** words exist, and what any of them oblige,
belongs to whoever is working.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · vocabulary · [structure](structure.md) · [absence](absence.md) · [boundaries](boundaries.md) · [material](material.md) · [parked](parked/)
