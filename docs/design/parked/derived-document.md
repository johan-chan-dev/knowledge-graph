# The derived document

```yaml
# in the document's own frontmatter
derives:
  - claim:   "the vocabulary follows openCypher"
    match:   '(:Decision {topic: "vocabulary"})'
    project: '[.[] | {id, status}]'
    digest:  521112375e2e
```

**A document is a projection of a subgraph.** It imposes a total order on things
that have at most a partial one, and that order carries the argument — the
*therefore*, the *however* — which is not in the facts. Same facts, three
documents: an ADR justifies, a tutorial admits, a post-mortem explains.

None of that is a defect. What is a defect is that the projection, once written,
loses every link to what it projected. A document declaring its own `match` and
`project` gets the link back, and can say that its premises have moved.

## It is a materialised view with invalidation

The database name for it, and the name is the design. The document is a cache of
a query; the query is its freshness key. What it buys is the one thing a notes
system structurally cannot do — a note written in September does not know that
the decision it reports was reversed in October, because it has no vocabulary to
be checked against.

## The fingerprint is available today — measured, not assumed

Against the 171-node space, the same pattern run twice:

```
kg nodes match '(:Person)-[:ACTED_IN]->(:Movie {title: "Cloud Atlas"})' | shasum
  521112375e2e   521112375e2e
```

and the ids come back **sorted**. So a digest is reproducible with no change to
[match](../../batches/14-match.md) and no change to [the JSON
output](../../batches/13-output.md). The feature needs a caller, not an engine.

That ordering is a property this would rest on, and it is currently a
measurement rather than a test — see *blocked on*, below.

## The dependency is the projection, not the subgraph

Fingerprint the output of `match` and any edit to a property the document never
used declares it stale. A signal that cries wolf is one its reader learns to
silence, which costs more than having no signal.

So the digest covers what comes out **after** the `jq`. This follows from the
framing rather than being a separate choice: the document *is* the projection,
so the projection is the thing to watch.

## One pattern per claim

A document composes several subgraphs because it supports several points, and
the composition serves its purpose rather than the graph's. Declaring one
dependency per claim makes staleness **local**: the report names which argument
lost its footing, not merely that the file moved.

That is the difference between *re-read this* and *re-read paragraph three*.

## A diff, not a boolean

Storing the id set with a digest per node costs little more than one global
digest and lets the check say *X changed, Y appeared, Z left the pattern*. Two
JSON arrays and a `jq`. A boolean would send the reader back to the whole
document to find out what happened — which is the work the feature exists to
remove.

## Stale is not wrong

A premise that moves does not falsify a conclusion; it puts the argument up for
re-reading. The wording has to say **re-read**, never *invalid*, or it trains
its reader to dismiss it — the same failure as crying wolf, arrived at from the
other side.

## What it is blocked on

**A caller, and a space to hold one.** No document here declares a dependency
yet, and this repository has no `.kg/` of its own — the plugin that carries a
project's memory does not keep one. Nothing is designed around that absence; it
is simply where the first caller would have to come from.

**A test for the ordering.** The stability above is measured on one graph, once.
A future optimisation inside the matcher — a parallel walk, a label index
([label-index](label-index.md)) — could reorder results without failing anything
that exists today, and would silently break every stored digest. The guarantee
has to be written down as a test before anything depends on it.

## What it does not settle

- **Where the declaration lives.** In the document's frontmatter, as above, or
  in a node that represents the document — which would make the dependency an
  edge and put it in reach of a pattern, at the cost of a second place to keep
  in sync.
- **What a digest covers** when the projection computes rather than selects: a
  count is stable under edits that change everything about the nodes behind it.
- **Who runs the check** — a hook, a verb of its own, or CI. Each answers a
  different question about when a reader deserves to be warned.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
