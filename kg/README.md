# kg — the plugin

Three layers, and each carries what the others cannot.

| | speaks | carries |
|---|---|---|
| the tool's **refusals** | when you reach the boundary | where the line is, named by its cause |
| the **hook** | at the first session in a space | the binary's whereabouts, and the vocabulary |
| the **skill** | when the task is graph-shaped | the `jq` a question needs once the pattern has done its half |

**Nothing here repeats a refusal.** `spec/api.md` puts the rule for stderr and
it holds for a plugin too: *a channel that repeats what you already know is one
you learn to stop reading.* So the hook is silent outside a space, and the skill
documents the seam between two tools rather than the commands of one — `--help`
already has those.

## The binary is built, not fetched

```bash
deno task --cwd tool compile
```

About 7 s the first time and 36 MB of modules, with Deno the only dependency.
Measured against the alternatives: running from source costs **158 ms** an
invocation against **53 ms** compiled, which is the per-process cost
[batch 11](../docs/batches/11-resolution.md) exists to have removed; and
publishing binaries would be 353 MB of artefacts per version for four targets.
Seven seconds, once, is the cheapest of the three by a wide margin.

The marketplace **is** the tool's repository, so whoever installs the plugin
already has the source. The session hook says so when the binary is missing or
older than its source — a binary that is not there refuses nothing at all,
which is the one thing no refusal can report.

---

[the design record](../docs/README.md) · [the tool](../tool/README.md)
