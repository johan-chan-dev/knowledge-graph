# Raw

Material nobody has judged yet. Argued in the outgoing implementation and built
there; carried here 2026-09-10, built by nothing in this tool.

A node that has not been judged carries no qualifying property, and **the
absence is the positive statement** — the same way a decision's forbidden
`confidence` positively states *chosen, not checked*. Nothing about such a node
is checkable, because it claims nothing.

## The chain is open upward, and stays open

*Material nobody has judged yet* is the easy half. The harder one: **what
arrived is a starting piece, never the origin.** Whoever handed it over had it
from somewhere, that somewhere is not in the base, and mostly never will be.

Textual criticism keeps the distinction this needs. The **archetype** is the
latest common ancestor the surviving witnesses let you reconstruct, and it is
held apart from the **autograph**, the author's own copy, precisely because
conflating the two claims more than the witnesses carry. What a base holds is an
archetype. Finding an older witness moves it and never arrives at the other.

So raw does not mean *unprocessed*, and it does not mean *first*. It means **no
antecedent known yet** — an absence of an edge, not of a property. What closes
it is ordinary rather than exotic: the paragraph somebody pasted turns out to be
a cut from a paper, or a rewrite of something written here two years ago.

**Which settles the shape.** Only a node can acquire an edge later. Material
kept inside a property of whatever it produced offers nothing for a newly found
antecedent to attach to, so the received text is a node of its own or the
discovery has nowhere to land. [`material`](../material.md) argues the same
conclusion from the other end, where dropping a body costs three things at once.

### The one witness always available

The base cannot vouch for where something came from. It can vouch for having
**received** it, which is a fact about itself rather than a report about the
world:

```yaml
received: 2026-09-30
channel: conversation            # conversation | file | fetch
attributed_to: 'the PPM1D paper in Nature'
```

**`attributed_to` is a property and must never be an edge.** Somebody *saying*
where a thing came from is not the base *holding* that antecedent: the first is
a declaration, the second is a trace. Written as an edge they become
indistinguishable, which matters on the day one of them is wrong. Kept apart,
the declaration becomes checkable against the antecedent when it finally
arrives — which is the entire value of the separation.

What such a link then claims is [`extraction`](extraction.md)'s question: a
position, or a fidelity.

## Why capture has to be free

The scarce input is judgement, not material. Ingesting is cheap and got cheaper;
proposing a reading is cheap and got cheaper; **accepting one did not**, because
it is one person's attention and always was.

So friction placed at the moment of capture is charged against the wrong side of
that ratio. The split is two steps and it runs one way:

| | costs | may be refused |
|---|---|---|
| capture | nothing — write the prose, name nothing | no |
| qualify | the judgement | yes, and that is the point |

Making the judgement is the **qualifying act**. Deciding what a thing is — fact,
concept, decision, thesis — is not bookkeeping that precedes the thinking; it is
the thinking, and a tool that demands it at capture time is demanding a guess
that then freezes into the structure.

The inverse matters as much: because capture is free, **qualification is allowed
to stay expensive.** A quarantine that costs nothing to enter can afford a
costly door out.

## What the tool can say about it

Only the instance-level fact. [`absence`](../absence.md) settles why: the
substrate declares no slots, so it can report *this key is not here* and never
*this key should be here*. The second is a claim about a slot, and only
something that declared the slot can make it.

**And the obvious query cannot be written.** An earlier version of this page
asked for the unqualified set as `not n.kind`, borrowing the outgoing
implementation's word. That fails deeper than the `where` clause it also needed:
a **kind is a label** ([`vocabulary`](../vocabulary.md)), so *has this node been
qualified* means *which of the vocabulary's words are kinds* — exactly the
knowledge [`structure`](../structure.md) forbids the tool. A boundary, not a gap,
and no syntax closes it.

A presence test over whichever property a practice chose remains available —
[`search`](search.md) has the mechanism. What is not available is the tool
knowing which property that was.

## Location can no longer carry it

In the outgoing implementation raw-ness was carried by **where the node sat** —
a node outside every declared graph was raw, and a `kind` outside a graph was
refused outright, since qualifying a claim is what a graph was for.

That mechanism is gone. [`spec/api.md`](../../spec/api.md) gives a repository
one space or none, and a node no filesystem location except the space's own
root. There is nowhere for a node to be *outside*.

So raw-ness must be carried by a property or not at all — which is a smaller
claim than the one it replaces, and honest about it: the old arrangement made
the raw layer unrefusable, and a property-borne one is a convention a practice
maintains.

## The open question: the count nobody asked for

Whether the query can even be *asked* is now in doubt — see above. What was
never in doubt is that nothing **tells** you without being asked.

The outgoing implementation counted raw against qualified and called it *the
number that shows the practice failing*, on the argument that **an uncounted
inbox is how it fails unnoticed**. That argument survives the rewrite intact;
the mechanism does not, because nothing in this tool knows which property
qualifies and nothing runs unprompted.

Two shapes, neither chosen:

| | keeps the substrate blind | surfaces unasked |
|---|---|---|
| a practice declares the predicate, something evaluates it | yes — it evaluates a predicate it was handed | yes |
| a skill runs the query at session start | yes | **no** — a hook has no skills |

The first needs a place for a practice's generalisation to live, which is the
open question in [`validation`](validation.md) and the gap
[`absence`](../absence.md) states most sharply. The second needs nothing and
guarantees nothing.

**A neighbouring question is answerable, and it is not this one.**
[`absence`](../absence.md) now carries a predicate needing nobody's vocabulary:
a node with no label and no link is unreachable — in the store without being in
the graph — and one `jq` over `(n)` finds it. The temptation is to call that the
inbox and close this page. It is not: a labelled node is perfectly reachable and
may be entirely unjudged, so the two sets differ. What it settles is that a
structural predicate can exist at all, which is more than this page had.

## What would trigger it

A ratio, not a feeling: material arriving faster than it is being judged, for
long enough that the pile stops being visible by memory. Both halves are already
computable — a node's creation time is in its id, and any qualifying property
carries the date it was written.

Not a node count. A small space with a stalled pile is the failure; a large one
that drains is not.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
