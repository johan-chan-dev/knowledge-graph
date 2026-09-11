# Parsing arguments

**The surface should decide the grammar, and it currently doesn't.**
`@std/cli/parse-args` handles boolean flags and single-value ones. It has no
variadic flag — and the first command that wants one is `--with-labels auth
decision` in [batch 6](../../batches/6-labels.md).

## Why the variadic form is the one worth wanting

For an agent, it is the only shape with nothing to remember:

| | what the caller has to know |
|---|---|
| `--with-labels auth decision` | nothing — it reads `<word>...` in help and supplies words |
| `--with-labels auth,decision` | encode: join by comma, no spaces. `auth, decision`, which is what anyone writes, breaks |
| `--with-label a --with-label b` | that repetition accumulates, which is deducible from nothing |
| `node new auth decision` | that bare words after `new` are labels |

Every alternative adds a convention, and a convention is a thing an agent can
get wrong and a help text has to teach.

## What it would take

Not a workaround. The table in `surface.ts` already declares which flags each
command accepts; **let it declare their shape too** — boolean, one value,
several — and tokenise from that. One pass: walk argv, recognise a flag, consume
the number of values it declares, everything else is positional.

That is not a second parser bolted onto the first. It replaces `parse-args`
entirely, removes a dependency rather than adding one, and returns the flag
rules to the table, which is where [batch 5](../../batches/5-the-entry-point.md)
argued every part of a command's shape belongs. Roughly forty lines.

## Why not a CLI framework

Measured rather than assumed, against `@cliffy/command` and `@cliffy/flags`:

- **Positionals land in `unknown`** — the same bucket used to detect unknown
  flags, so the separation this tool relies on would have to be rebuilt.
- **It throws, in its own voice.** `Unknown option "--where". Did you mean option
  "--stdin"?` against this tool's `unknown flag: --where`. Every refusal in
  [`spec/api.md`](../../spec/api.md)'s table would become a translation at the
  boundary, and the suggestion is the framework guessing — which is what
  [batch 4](../../batches/4-stops-guessing.md) exists to have removed.
- **Four exit codes.** `0` ok, `1` refused, `2` absent, `4` usage. A framework
  has one error path.

The cost of adopting one grows with every refusal added to the spec, so *later*
is the one answer that is definitely wrong. Either the surface's voice is worth
owning, in which case own the tokeniser too, or it is not.

## The lesson worth keeping

A library's capabilities were quietly deciding the grammar: the comma form was
proposed because it was free to implement, and justified afterwards by the
delimiter being safe. That is the wrong order. **The surface is decided first,
and the parsing follows.**

## What would trigger it

The first command that ships a flag carrying values — `--with-labels` is the
candidate, and `find` and relations will likely bring more. Until then
`parse-args` is adequate, and nothing is blocked.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
