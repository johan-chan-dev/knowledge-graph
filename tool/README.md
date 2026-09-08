# kg

Deno and TypeScript, compiled to a binary. **No third-party packages** — the
imports in `deno.json` are the whole dependency list.

| | |
|---|---|
| `deno task check` | typecheck |
| `deno task test` | compile, then everything |
| `deno task verify` | compile, then the batch loops against the binary |
| `deno task compile` | `build/kg` |

`test` and `verify` compile first on purpose: `tests/batches.test.ts` runs the
binary rather than the source, so a stale one would test the wrong program.

**Deno rather than Bun** because Bun strips types rather than checking them, and
compile-time checking of the refusal paths is the reason to be in TypeScript at
all.

**`@std/cli/parse-args` has no notion of subcommands** — it will take the first
positional after a string flag as that flag's value.

The specification is [`../docs/spec/`](../docs/spec/); the reasoning behind it
is [`../docs/design/`](../docs/design/), and how it got here is
[`../docs/batches/`](../docs/batches/).
