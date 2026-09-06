# kg

Deno and TypeScript, compiled to a binary. **No third-party packages** — the
imports in `deno.json` are the whole dependency list.

`deno task check` · `deno task test` · `deno task compile`

**Deno rather than Bun** because Bun strips types rather than checking them, and
compile-time checking of the refusal paths is the reason to be in TypeScript at
all.

**`@std/cli/parse-args` has no notion of subcommands** — it will take the first
positional after a string flag as that flag's value.

The specification is [`../spec/`](../spec/); the reasoning behind it is
[`../design/`](../design/).
