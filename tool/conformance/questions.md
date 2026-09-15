# The questions batch 9 has to answer

Neo4j ships this dataset with a guide, and the guide asks thirteen questions.
They are the acceptance criteria for [`find`](../../docs/batches/9-find.md),
because a query language designed from operators and precedence had never been
checked against anything anyone wanted to know. `movies_test.ts` asks all of
them of the imported graph.

Expected answers are computed from `movies.cypher`, not remembered.

| | question | needs | today |
|---|---|---|---|
| 1 | which movies were released after 2000 — **12 ids** | `find` | ✓ |
| 2 | their titles — **12 titles** | `find` + a loop | ✓ |
| 3 | how many there are — **12** | `find` piped to `wc -l` | ✓ |
| 4 | people who directed a film released after 2010 | `find` + the entries | ✓ |
| 5 | actors in films released after 2010 | `find` + the entries | ✓ |
| 6 | `name` and `born` for every person | `find` + a loop | ✓ |
| 7 | `title` and `released` for every film | `find` + a loop | ✓ |
| 8 | the film titled *Cloud Atlas* | `find` | ✓ |
| 9 | films released between 2010 and 2015 — **Cloud Atlas** | `find` with `and` | ✓ |
| 10 | directors of *Cloud Atlas* — **Tom Tykwer, Lilly Wachowski, Lana Wachowski** | `--properties \| jq` | ✓ |
| 11 | Tom Hanks' co-actors — **34** | two hops, scripted | ✓ awkward |
| 12 | everyone connected to *Cloud Atlas* — **10** | the entries, grouped by type | ✓ |
| 13 | everything three hops from Kevin Bacon | one call per hop, scripted | ✓ awkward |

**1, 2 and 3 are one selection asked for three ways**, and they are kept apart
because the difference is the whole of what `find` returns. It hands back ids:
the set. A loop turns those into titles; a pipe reduces them to a number.
Neither is something the command does, which is why the projection question and
the counting question are the caller's and not a flag.

## What they settle

**Nine of thirteen turned on `find` and nothing else**, and no traversal
command was ever needed. 10 and 12 worked when relations printed as columns and
work now that the entries come back resolved — what carried them both is
*stdout is the answer*, argued long before these questions existed.

**All thirteen are answerable**, which was not true when this table was written:
four were ✗ and the last was out of scope. What closed them was not a feature
aimed at any of them — `find`, then one call per hop.

**The grammar was right and unchecked.** Every selection here — `title = "Cloud
Atlas"`, `released > 2000`, `released > 2010 and released < 2015`, `"movie" in
labels` — is as it was specified before the questions were written. Nothing was
added to answer them.

**Question 13 stopped being the price of a deferral.**
[Batch 9](../../docs/batches/9-find.md) put traversal in a command rather than
in pattern syntax and recorded `[*1..3]` as what that cost. What it actually
cost was a process per node; [batch 11](../../docs/batches/11-resolution.md)
made a hop one call whatever its width, so breadth-first is one call per level.
Three hops from Kevin Bacon reach 49 nodes in four calls.

It is still *awkward* rather than clean: the caller dedupes the frontier and
keeps no parents, so reachability is answerable and a **path** is not.

**And one thing this dataset cannot check.** Every `released` here is numeric,
so the import never reaches `score: abc` — a value that will not take its
operator's type. That rule is settled in
[comparison](../../docs/design/parked/comparison.md) and held by
`src/evaluate_test.ts`, where the case can be written; a borrowed graph is the
wrong instrument for it.

---

[conformance](movies_test.ts) · [batch 8](../../docs/batches/8-movies.md) · [batch 9](../../docs/batches/9-find.md)
