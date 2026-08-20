# Toolbelt

**What `kg` does.** `SCHEMA.md` is what it writes; this is the surface that
writes it.

The test for whether an operation belongs: **which invariant does it make
unreachable?** An operation that merely saves typing is a wrapper, and a wrapper
is where the rules leak back out.

## Cross-cutting decisions

**Python 3, standard library only.** A tool that needs an install step before it
runs is a tool that does not run. The frontmatter parser accepts a documented
subset of YAML — and since `kg` *writes* the frontmatter, the subset is
self-consistent. `kg check` rejects anything outside it with the line number,
rather than guessing.

**Config is `.kg.json` at the repository root**, found by walking up from the
working directory:

```json
{
  "graphs": [
    { "path": "knowledge",            "tier": "global" },
    { "path": "products/*/knowledge", "tier": "local"  }
  ],
  "tasks":     ["tasks", "products/*/tasks"],
  "meta":      "meta",
  "cap":       4,
  "mapBudget": 1400
}
```

Everything else about the method is universal. Only *which directories are
graphs* is local, which is why that is the whole of the configuration.

**References are `[<graph>:]<domain>/<slug>`.** The graph prefix defaults to the
global one, so `auth/supabase-sessions` and `etalade:stack/data` both resolve
without a path. Tasks are referenced by their `id`, which is why ids exist.

**Mutating commands rebuild the metadata layer** unless given `--no-build`. It is
cheap, and it removes the class of failure where a correct edit leaves a stale
map. `build` remains available on its own.

**`kg` writes frontmatter and a title heading. It does not write prose.** The body
is the agent's, which is exactly why the prose checks survive.

**Output is terse text; `--json` where a caller needs to compose.** Every mutating
command prints one line per file touched. Exit `0` ok, `1` refused or failed,
`2` usage.

## Read — replaces grepping

| Command | Returns |
|---|---|
| `kg show <ref>` | frontmatter, state, outbound relations, **inbound** relations, inbound prose links |
| `kg inbound <ref>` | everything citing it, typed and prose listed separately |
| `kg ls [--graph] [--type] [--state] [--domain] [--stale]` | filtered listing, one line each |
| `kg pending [--all]` | the queue — surfaced set by default, everything with `--all` |
| `kg stale` | overdue `recheck`, plus every `provisional` decision with its `revisit-when` |

`kg stale` **lists rather than decides**. Whether a trigger has fired is an event
in the world; the tool can only put the trigger in front of someone.

## Create

```
kg new <ref> --type T --title "…" [--topics a,b]
             [--jurisdiction fr,eu | universal] [--vendor …]
             [--confidence verified|partial|attested] [--recheck DATE | --in 6mo]
             # type=decision: --status --serves --revisit-when
             # type=thesis:   --basis --would-falsify

kg task new <slug> --cost high|medium|low --due now|deferred
             [--due-when "…"] [--graph G]
```

| Made unreachable |
|---|
| missing frontmatter · missing required field · unknown `type` · facet not a list |
| `[universal, fr]` — the exclusive-frame rule |
| a node absent from its `INDEX.md`, because creation writes both |
| `confidence` on a decision — the template never emits the field |
| duplicate or non-integer task `id` · `deferred` without `due-when` |

`--in 6mo` exists because a `recheck` written by hand is a date someone chose
under no constraint; a horizon is the thing actually meant.

## Transition — not field-setting

```
kg decide      <ref> --revisit-when "…" [--serves "…"]
kg provisional <ref> --revisit-when "…"
kg supersede   <old> --by <new>
kg task set    <id> [--cost C] [--due D] [--due-when "…"]
kg task retire <id> [--force]
```

A setter needs validation afterwards; a transition demands what the target state
requires and cannot leave a node half-formed. `supersede` writes **both** sides —
`status: superseded` on the old node and a `supersedes` relation on the new — or
neither.

`task retire` prints every inbound reference and **refuses** unless there are
none or `--force` is given. Deleting a drained task in the origin repo broke five
references, and repointing them is where two stale blockers surfaced — the
refusal is what creates that moment.

## Edges

```
kg link   <from> <to> --rel supersedes|contradicts|depends-on|does-not-satisfy
kg unlink <from> <to> [--rel R]
```

Only **typed relations** are ownable: they live in frontmatter, and the path is
resolved rather than typed. An inline citation lives inside a sentence, and
nothing owns a sentence.

## Move

```
kg mv <old> <new> [--dry-run]
```

Moves the file and **re-bases every inbound reference** — typed relations, prose
links, index entries — reporting each.

This operation exists because of a specific failure: relocating two index files
by regex broke **157 links**, a second pass re-basing what the first had just
created. Every path looked plausible and was one level too deep. `--dry-run`
prints the rewrite table without touching anything.

## Derived

```
kg build [--check]     # writes MAP, QUEUE, INDEX listings; --check fails instead
kg check               # read-only, never writes
```

Split deliberately. Fused, a clean repository fails its own commit with
*"regenerated — `git add`"*, which reads as an error and means work was done for
you. `build --check` is the CI form; `check` is the backstop.

### What `check` still catches

Four conditions, all on prose, none constructible:

- a link inside a node body does not resolve
- a global node cites into a local graph
- a claim at the global tier is written in the first person plural
- a generated file is stale

Down from twenty-four, and every one that went is gone because an operation makes
it unreachable.

## Init

```
kg init [--graphs knowledge] [--tasks tasks] [--meta meta]
```

Writes `.kg.json`, creates the `meta/` directories, scaffolds the doctrine stubs
from `templates/`, and prints the one thing it cannot do for you:

```
git config core.hooksPath .githooks
```

Hook paths are local config and do not travel with a clone.

## Deliberately absent

**There is no `kg node rm`.** The graph is monotonic: a node is superseded, never
deleted. Encoding that as a missing operation is stronger than refusing it —
there is nothing to refuse, and nothing to argue with.

`kg task retire` exists because a task is a different entity: it drains, its
content moves elsewhere, and its container is then removed.
