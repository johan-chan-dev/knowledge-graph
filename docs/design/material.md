# A node is a stage, not a record

The model this borrowed has no body. A Neo4j node is labels and properties —
structure with nothing written in it. Here a node has prose, and that is the one
place the borrowing stops.

## Because the material is written, not recorded

A property graph describes things that already exist: a person, a film, an
order. Their attributes are read off them, and the graph is a second
representation of something whose shape was settled elsewhere.

Material written by hand has no such prior shape. It arrives as prose — a page,
a message, a paragraph that turned out to matter — and what it is *about* is not
visible until enough of it accumulates for the shape to be seen. So the prose
has to be the thing the tool holds, and the structure has to be something that
accretes around it afterwards.

**The body is what is connected; labels and links are how.** Strip the body and
this is a filing system for records that live somewhere else.

## Material moves, and the node is a position on that path

```
a document arrives whole
  → pieces are extracted, each becoming a node that refers back
    → extractions link to each other
      → clusters form that the original never expressed
        → the original can be dropped
```

Each extraction is a node in its own right, free to be labelled, linked and
extracted from again. Nothing about the first node privileges it: it was where
the material entered, not what the material *is*.

**And the last step is the point.** Once the extractions carry the meaning and
the source is reachable another way — a URL, a citation, anything outside — the
original is duplicated data. Keeping it is keeping a copy of something that has
been superseded by its own decomposition.

That is why a node is a stage. Most note tools treat a note as permanent and
make deletion a taboo or an afterthought; here **withdrawal is the last step of
a normal lifecycle**, not an accident to be guarded against.

## What that commits the tool to

**Capture must stay free**, which [`parked/raw`](parked/raw.md) argues from the
other end: the scarce input is judgement, and friction at capture is charged
against the wrong side.

**An extraction must be able to point at where it came from.** Without that the
path above breaks at its second step — the pieces exist and nothing records that
they were pieces *of* something. Relations are
[`parked/relations`](parked/relations.md).

**Withdrawal has to be answerable.** Dropping the original is only safe if what
still points at it can be found, which is why
[`parked/lifecycle`](parked/lifecycle.md) is blocked on relations rather than
merely waiting for them: *whether withdrawing a node is deletion or a tombstone*
is the question this lifecycle asks last and cannot avoid.

**And a reference outside the space is a URL**, never a path — which is what
makes *"the source is reachable another way"* a thing the tool can rely on. See
[`location`](location.md).

## What it does not commit to

**No opinion about when material is mature.** Whether a node has been extracted
from enough to drop is a judgement, and judgement belongs to a practice. The
tool holds the material and the links; deciding that a cluster has outgrown its
source is not its call.

**No automatic extraction.** Splitting a document is a reading of it, and a
reading is the qualifying act `raw.md` describes. A tool that split
automatically would be proposing readings at the moment capture is supposed to
cost nothing.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · [vocabulary](vocabulary.md) · [structure](structure.md) · [absence](absence.md) · [boundaries](boundaries.md) · material · [parked](parked/)
