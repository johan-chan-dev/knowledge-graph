# Raw

Material nobody has judged yet. Argued in the outgoing implementation and built
there; carried here 2026-09-10, built by nothing in this tool.

A node that has not been judged carries no qualifying property, and **the
absence is the positive statement** — the same way a decision's forbidden
`confidence` positively states *chosen, not checked*. Nothing about such a node
is checkable, because it claims nothing.

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

That is the whole mechanism, and [`search`](search.md) already provides it —
a bare name is a presence test, so the unqualified set is `not <name>`:

```console
$ kg nodes find 'not kind'
```

**Which property qualifies is a practice's word.** `kind` is the example
throughout because it is the one the outgoing implementation used;
[`vocabulary`](../vocabulary.md) is explicit that the substrate knows no such
word, and nothing here asks it to learn one.

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

The query exists. What does not exist is being **told** without asking.

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

## What would trigger it

A ratio, not a feeling: material arriving faster than it is being judged, for
long enough that the pile stops being visible by memory. Both halves are already
computable — a node's creation time is in its id, and any qualifying property
carries the date it was written.

Not a node count. A small space with a stalled pile is the failure; a large one
that drains is not.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
