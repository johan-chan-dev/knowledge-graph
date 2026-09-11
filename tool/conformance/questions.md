# The questions batch 9 has to answer

Neo4j ships this dataset with a guide, and the guide asks thirteen questions.
They are the acceptance criteria for [`find`](../../docs/batches/9-find.md),
because a query language designed from operators and precedence had never been
checked against anything anyone wanted to know. `movies_test.ts` asks all of
them of the imported graph.

Expected answers are computed from `movies.cypher`, not remembered.

| | question | needs | today |
|---|---|---|---|
| 1 | movies released after 2000 — **12** | `find` | ✓ |
| 2 | the same, listed | `find` | ✓ |
| 3 | the same, counted | `find` piped to `wc -l` | ✓ |
| 4 | people who directed a film released after 2010 | `find` + `backlinks` | ✓ |
| 5 | actors in films released after 2010 | `find` + `backlinks` | ✓ |
| 6 | `name` and `born` for every person | `find` + a loop | ✓ |
| 7 | `title` and `released` for every film | `find` + a loop | ✓ |
| 8 | the film titled *Cloud Atlas* | `find` | ✓ |
| 9 | films released between 2010 and 2015 — **Cloud Atlas** | `find` with `and` | ✓ |
| 10 | directors of *Cloud Atlas* — **Tom Tykwer, Lilly Wachowski, Lana Wachowski** | `backlinks \| grep '^directed'` | ✓ |
| 11 | Tom Hanks' co-actors — **34** | two hops, scripted | ✓ awkward |
| 12 | everyone connected to *Cloud Atlas* — **10** | `backlinks \| cut -f1` | ✓ |
| 13 | everything three hops from Kevin Bacon | variable-length traversal | ✗ **and out of scope** |

## What they settle

**Nine of thirteen turned on `find` and nothing else.** No new traversal command
was needed: 10 and 12 already worked, because the output is tab-separated and
pipes. That was argued as *stdout is the answer* long before these questions
existed.

**The grammar was right and unchecked.** Every selection here — `title = "Cloud
Atlas"`, `released > 2000`, `released > 2010 and released < 2015`, `"movie" in
labels` — is as it was specified before the questions were written. Nothing was
added to answer them.

**Question 13 is the price of a deferral, and it is one question.**
[`7-find`](../../docs/batches/9-find.md) put traversal in a command rather than
in pattern syntax; `[*1..3]` is what that costs, measured against a real guide
rather than guessed at.

**And one thing this dataset cannot check.** Every `released` here is numeric,
so the import never reaches `score: abc` — a value that will not take its
operator's type. That rule is settled in
[comparison](../../docs/design/parked/comparison.md) and held by
`src/evaluate_test.ts`, where the case can be written; a borrowed graph is the
wrong instrument for it.

---

[conformance](movies_test.ts) · [batch 8](../../docs/batches/8-movies.md) · [batch 9](../../docs/batches/9-find.md)
