# Sharing

Knowledge travels. It starts where it was written and becomes shared once it
holds somewhere beyond there. Argued in the outgoing implementation and built
there; carried here 2026-09-10, built by nothing in this tool.

One rule falls out, and it was the only one:

> **Personal knowledge may cite shared knowledge. Shared may not cite personal.**

A claim cannot be more general than what it rests on, so edges run toward the
more-shared space.

## Where the shape comes from

This is Cyc's `genlMt` — transitive, monotonic, and a query in the general
context cannot see the specific one. Cyc reached it as the only way a knowledge
base of that size stayed usable: partitioning means **only local consistency has
to hold**, and reasoning in one domain stops being derailed by material
intruding from another.

Two properties follow from the direction, and they are the reason to keep it:

| | why |
|---|---|
| promotion is safe | nothing shared was pointing down at the node being moved up |
| the graph stays acyclic | every edge runs one way along the axis |

**"Shared" is relative.** A space is shared with respect to what it contains and
personal with respect to the world, so *is this shared?* always needs *with
respect to what?* — one recursive chain, not an absolute two-way split.

**Containment and inheritance point in opposite directions**, which catches
everyone once. Git points down: a repository knows its submodules, and no `../`
climbs out of one. The graph points up: a more-shared space is a root in its own
right, which the specific space refers to. Reason from the directory tree and
the direction comes out backwards every time.

## What this design has instead, today

Nothing. [`spec/api.md`](../../spec/api.md) gives a repository **one space or
none**, and the space is the scope — so there is no second space for an edge to
run toward, and the citation rule has nothing to constrain.

The axis has moved outward with it. The boundary that used to sit between two
directories in one repository now sits between repositories, where the rule that
already holds is absolute: **across a repository boundary, in either direction, a
reference is a URL, never a path.** Reaching another space is
[`further-out`](further-out.md)'s `mount` / `unmount` / `obtain` and the manifest
that declares them, all parked.

So the model is isolation by default with reachability by construction — shards
that do not inherit from one another, connected by explicit reference rather than
by context inheritance. That is a different mechanism from Cyc's, not a weaker
version of it: Cyc scopes what a query can *see*; this scopes what a repository
*is*.

## What is undecided

**Whose rule the direction is.** The tool resolves which space it is in, so
scope is a fact the substrate holds. *Which of two spaces is more shared* is not
— it is a claim about generality, and nothing in the substrate can rank two
repositories. The rule may therefore belong to a practice, which would leave the
tool holding reachability and nothing else.

**Whether promotion is an operation.** The outgoing implementation computed the
dependent subgraph that had to travel with a node and printed its size, where
the number meant opposite things in the two directions — a **test** of the claim
when one node was moved one step, a **manifest** when a body of reasoning was
being shipped deliberately. It refused rather than write a graph that broke the
citation rule. Whether that survives depends on the answer above: a tool that
cannot rank two spaces cannot compute what belongs in the more general one.

**What replaces it in the meantime.** A node is copied by hand and the reference
is a URL. That works, loses the closure check, and is the state today.

## What would trigger it

Two spaces that need to reference each other — which is
[`further-out`](further-out.md)'s trigger, not a separate one. The rule here is
what that mechanism would have to enforce once it exists; before then there is
nothing to enforce it on.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
