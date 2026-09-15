# A label index

```
.kg/labels/person.md      the word, and what it means here
.kg/labels/person.ids     ← the nodes carrying it
```

**What would remove the floor under
[batch 14](../../batches/14-match.md)'s cost**: a pattern is entered at one node
pattern, and finding it means parsing every node, because nothing says which
nodes carry `Person`.

## The refusal it revisits

[Batch 6](../../batches/6-labels.md) declined to make a label's file carry its
members, and `spec/api.md` records the reason: *the count it used to carry
forced a parse of every node*.

**That reason is about a count computed on read, and this is not that.** An
index written at `label` and `unlabel` time costs one line appended or removed
where the write already happens — the node file and the label file are both
being touched, and `document.ts` is the single writer for both. Nothing is
computed on read; a read is a directory entry and a file.

So the objection batch 6 raised does not reach this shape, which is why the page
exists rather than the decision standing.

## What it would buy, measured

Batch 14's cost on the movies graph is **424 files parsed** — 171 nodes and 253
records — and 93% of that is parsing rather than I/O. An index turns the anchor
from *parse every node* into *read one file*:

| | today | with an index |
|---|---|---|
| `(:Movie {title: "Cloud Atlas"})` as the entry | 171 nodes | 38, then 1 |
| `(:Person)-[:DIRECTED]->(:Movie)` | 171 nodes | 133 |

It also makes the anchor heuristic *matter*. Without an index every entry point
costs the same pass, so choosing between them is join order in memory —
microseconds. With one, the choice is the difference between reading 38 files
and 133.

## What it costs

**A second thing to keep true.** The index is derived, so it can disagree with
the nodes, and nothing in this tool currently can. `git` is the versioning and
there is no repair command — so a page that adds derived state has to say how it
is rebuilt and when it is checked, and this one does not yet.

**And it is not needed at this size.** 424 files is 171 ms. The trigger is a
graph where the anchor pass is felt, which is around ten thousand nodes on the
measurements in batch 14 — two orders of magnitude from anything that exists.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
