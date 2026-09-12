# kg

Deno and TypeScript, compiled to a binary. `deno.json`'s imports are the whole
dependency list: `@std/*`, and [Zod](https://jsr.io/@zod/zod), which holds the
argument shapes in `src/surface.ts`.

Argument parsing is `src/argv.ts` rather than a library, because **a flag
belongs to a command**: there is no global flag list for a parser to be handed,
so what is left is splitting one command line against one command's declared
flags. `docs/design/parked/arguments.md` has the measurements against the
alternatives, and what would reverse the decision.

| | |
|---|---|
| `deno task check` | typecheck |
| `deno task test` | compile, then everything |
| `deno task verify` | compile, then the batch loops against the binary |
| `deno task compile` | `build/kg` |
| `deno task movies` | the conformance check in `conformance/`, ~1m |

`test` and `verify` compile first on purpose: `tests/batches.test.ts` runs the
binary rather than the source, so a stale one would test the wrong program.

## Tests

**Colocated where a test is about a module**, which is what the Deno style
guide asks for and what `denoland/std` does throughout: `src/frontmatter.ts`
next to `src/frontmatter_test.ts`. `node.ts`, `label.ts`, `link.ts` and
`document.ts` have none, because what they do is only observable through a
command — they are covered from `tests/`.

Everything under `tests/` drives the command line rather than a function —
`space`, `nodes`, `node`, `properties`, `usage` through the dispatch entry, and
`tests/batches/` through the compiled binary. That split is deployctl's and
fresh's shape: module tests beside their module, a `tests/` tree for the ones
that need the program.

`tests/batches/` holds one file per batch, numbered to match
[`../docs/batches/`](../docs/batches/), so a failing loop names the document
whose transcript needs revisiting. `binary_test.ts` is the one that is about no
batch: that `deno compile` produces the same program the source does.

**No `unit/` or `integration/` directory.** Nothing in userland Deno names
directories by test level, and the level is visible anyway from what a file
imports. Where a harder guarantee is wanted, the Deno-native lever is
`Deno.test({ permissions: … })` rather than a folder.

`helpers.ts` and `batches/spawn.ts` carry no `_test` in their names, so
`deno test` does not collect them.

`conformance/` sits outside `tests/` because it answers a different question:
not *does this code do what it says* but *does the borrowed model hold someone
else's graph*. It replays ~800 `kg` commands against the binary, which is a
minute of process spawning rather than a minute of tool, and has its own task.

---

[docs](../docs/README.md) · [spec](../docs/spec/) · [design](../docs/design/) · [batches](../docs/batches/)
