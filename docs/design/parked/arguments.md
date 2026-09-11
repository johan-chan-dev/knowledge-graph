# Parsing arguments

> **Superseded.** [Batch 7](../../batches/7-relations.md) builds this. Kept
> until then because the measurements are worth having, but the diagnosis below
> was wrong in its premise and is corrected at the end.

**A flag belongs to a command, and the tool declares it globally.**
`@std/cli/parse-args` is handed a union of every flag there is, so each one
parses on every command and three separate pieces of machinery walk that back.

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

## Why not a CLI framework — corrected

The measurements below stand; the conclusion drawn from them did not.

- `@cliffy/command` **cannot express this grammar** — `node <id> set <name>
  <value>` comes back as `id` plus `rest=["set","kind","decision"]`, so the
  table dispatches anyway, and an unknown flag after the id lands in `rest`
  silently.
- `@cliffy/flags` **does work**, and handles all four shapes. Its errors throw
  and are catchable, so this tool's voice survives. The earlier claim here that
  positionals and unknown flags share a bucket was wrong: an unknown flag
  throws, so only positionals remain.

What decides against it is not fit but size. With a per-command spec the job is
about forty-five lines and fully bounded — no short flags, no aliases, no
negation, no coercion, flag names `[a-z-]+`, values that never begin with `-`.
Cliffy would be four shapes out of many plus an error-translation layer. **If
short flags or aliases are ever wanted, that reverses.**

## The lesson worth keeping

Two, and the second matters more.

**A library's capabilities were quietly deciding the grammar.** The comma form
was proposed because it was free to implement and justified afterwards by the
delimiter being safe. The surface is decided first, and the parsing follows.

**And the library question was downstream of a design flaw the whole time.**
With a global flag union, variadic parsing looked hard enough to need help.
Once flags belong to commands, it is four lines. Several rounds were spent
comparing parsers for a problem that mostly dissolved when the union went.

## What would trigger it

The first command that ships a flag carrying values — `--with-labels` is the
candidate, and `find` and relations will likely bring more. Until then
`parse-args` is adequate, and nothing is blocked.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
