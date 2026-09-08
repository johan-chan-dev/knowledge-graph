# A query language

**Adopt openCypher's syntax rather than invent** — the same borrowing labels
made from Neo4j. It waits on relations: `MATCH (n:Decision) WHERE n.score > 0.7`
is a filter `--where` already covers, and the pattern syntax that justifies
Cypher has nothing to traverse until edges exist.

**Hand-write the subset.** Researched 2026-09-08, measured on this machine with
`deno compile`:

| route | binary | third-party deps |
|---|---|---|
| baseline (`console.log(1)`) | 64 MB | 0 |
| hand-written subset | **64 MB** | **0** |
| vendor Neo4j's generated parser + `npm:antlr4` | 73 MB | 1 |
| `@neo4j-cypher/language-support` as a dependency | 147 MB | 3 |

Recursive descent over `MATCH`/`WHERE`/`RETURN` is roughly 600–900 lines and
yields an AST already shaped for the executor, rather than a 500-node ANTLR tree
to lower. The ANTLR route earns its cost only if the tool must accept Cypher
somebody else wrote — spec conformance, hostile input, a compatibility claim.

**Parsing is the cheap half either way.** The expensive half is a planner and a
store that can traverse. Neo4j is fast because of index-free adjacency —
fixed-size records, `address = id × record_size`, memory-mapped. Over markdown
files, `(a)-[*1..3]->(b)` across 10k nodes reads most of them repeatedly.

### What the search found, so it is not re-run from memory

- **JSR has nothing.** No Cypher, openCypher, GQL or ANTLR package exists there.
- **`@neo4j/cypher-builder` is a builder, not a parser** — 192 exports, all AST
  constructors, no `parse`. Confirmed by inspection.
- **`libcypher-parser`** (C, Apache-2.0) is usable in principle but not here:
  no WASM build, and its only bindings are `nan` addons, which Deno cannot load
  — Deno supports Node-API only. Same for `cypher-parser` and `cypher.js`.
- **`@dortdb/lang-cypher`** (ISC) works under Deno and returns a plain JSON AST,
  the nicest output shape tested — but it is a four-star single-author project.
- **Kùzu is archived** by its authors, 2025-10-10.

**On staleness, measured rather than assumed.** `libcypher-parser`'s last
functional commit is 2021-11-10, and openCypher has moved since: `1.0.0-M19`
(2022-09-14) accepted **CIP2021-08-10 operator precedence** and CIP2021-07-07
grouping keys, refactored pattern predicates and quantifiers, fixed
`UnaryAddSubtractExpression`, and removed octal literals and list-to-boolean
coercion. The `2024.x` line (2025-04 onward) then restructured the grammar
toward ISO/IEC 39075 GQL, adding GPM and `SHORTEST`. So a 2021 parser predates
the formal precedence rules — a specific gap, not a vibe.

Neo4j's own Cypher-25 grammar lives in `neo4j/cypher-language-support` under
`packages/language-support/src/antlr-grammar/`, Apache-2.0, actively committed.
openCypher's own repository ships ISO-style BNF, not ANTLR.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
