# The questions batch 9 has to answer

Neo4j ships this dataset with a guide, and the guide asks thirteen questions.
They are the acceptance criteria for [`find`](../../docs/batches/9-find.md),
because a query language designed from operators and precedence has never been
checked against anything anyone wanted to know.

Expected answers are computed from `movies.cypher`, not remembered.

| | question | needs | today |
|---|---|---|---|
| 1 | movies released after 2000 — **12** | `find` | ✗ |
| 2 | the same, listed | `find` | ✗ |
| 3 | the same, counted | `find` piped to `wc -l` | ✗ |
| 4 | people who directed a film released after 2010 | `find` + `backlinks` | selection ✗ |
| 5 | actors in films released after 2010 | `find` + `backlinks` | selection ✗ |
| 6 | `name` and `born` for every person | `find` + a loop | selection ✗ |
| 7 | `title` and `released` for every film | `find` + a loop | selection ✗ |
| 8 | the film titled *Cloud Atlas* | `find` | ✗ — 171 reads |
| 9 | films released between 2010 and 2015 — **Cloud Atlas** | `find` with `and` | ✗ |
| 10 | directors of *Cloud Atlas* — **Tom Tykwer, Lilly Wachowski, Lana Wachowski** | `backlinks \| grep '^directed'` | **✓** |
| 11 | Tom Hanks' co-actors — **34** | two hops, scripted | ✓ awkward |
| 12 | everyone connected to *Cloud Atlas* — **10** | `backlinks \| cut -f1` | **✓** |
| 13 | everything three hops from Kevin Bacon | variable-length traversal | ✗ **and out of scope** |

## What they settle

**Nine of thirteen turn on `find` and nothing else.** No new traversal command
is needed: 10 and 12 already work, because the output is tab-separated and
pipes. That was argued as *stdout is the answer* long before these questions
existed.

**The grammar was right and unchecked.** Every selection here — `title = "Cloud
Atlas"`, `released > 2000`, `released > 2010 and released < 2015`, `movie in
labels and …` — is tiers 1 and 2 as already specified. Nothing needs adding.

**Question 13 is the price of a deferral, and it is one question.**
[`7-find`](../../docs/batches/9-find.md) put traversal in a command rather than
in pattern syntax; `[*1..3]` is what that costs, measured against a real guide
rather than guessed at.

**And the open question has no answer here.** `released > 2000` compares a
number against text — every `released` in this dataset is numeric, so the
dataset never reaches `score: abc`. It cannot settle what an operator does when
the data will not take the type it asserted.

---

[conformance](movies_test.ts) · [batch 8](../../docs/batches/8-movies.md) · [batch 9](../../docs/batches/9-find.md)
