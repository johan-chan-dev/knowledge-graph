# Trigger evaluation set

`trigger-eval.json` — 20 hand-written queries labelled `should_trigger`, for
measuring whether the `graph` skill's description fires when it should.

**Ten positive, ten negative.** The negatives are the load-bearing half: Hugo
frontmatter, an Obsidian vault tidy-up, a Neo4j Cypher question, `adr-tools`.
Each is a near-miss that a description written to catch everything markdown-and-
frontmatter-shaped would wrongly claim.

**Not in the plugin payload.** The published plugin is `./kg`; this is repository
material, kept in git because the queries are the expensive part — the optimizer
re-runs in minutes, these do not re-derive.

## Standing result: unmeasured

Six optimizer runs, every one `precision=100% recall=0%` — the skill never fired,
including on queries naming `.kg.json` outright. Three hypotheses were tried; the
third holds: **the harness runs each query in the inherited working directory**,
and the queries describe a repository state that does not exist there. So the
runs measured the harness, not the description.

The proposals the optimizer emitted are therefore candidates, not results. They
were generated against feedback that was uniformly zero, so nothing in them was
selected for. Do not adopt one on the strength of it reading better.

**What would settle it:** run the harness with its working directory set to a
repository that actually holds a `.kg.json`. Until then the description in
`kg/skills/graph/SKILL.md` is unvalidated, and the README says so.
