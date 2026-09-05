# Batch 1 — a space with nodes in it

```
init
new  [--meta]
show <id> [--path]
list [--meta] [--path]
```

**Done when** you can create a space, add nodes to it, list them, and read one
back — without opening a file by hand.

**Why these four and no fewer:** `init` alone produces nothing observable, `new`
cannot be confirmed without `show`, and `list` is what makes a space navigable
rather than a directory you have to remember. Split further and each half is
verifiable only by inspecting files, which is the thing the tool exists to stop.

**Nothing here carries meaning yet.** A node created in this batch has no
labels, no fields and an empty body. That is the point: the batch establishes
that material can be created, named and found, and every way of saying something
*about* it arrives later.

## On disk

```
<repo>/.kg/
├── nodes/{id}.md
└── meta/nodes/{id}.md
```

**At the repository root.** A space sits at `.kg/` in a repository's root, so
`init` finds the root rather than using the working directory — run it three
directories down and the space still appears at the top.

**No manifest.** The `.kg/` directory is what marks a space; nothing inside has
to assert it.

**The space's name is the repository directory's name.** Not minted, not stored,
not derived from a remote — read off the directory when anyone needs it. It
travels when the repository is moved or cloned, exactly as a node's name travels
with its file ([location](../design/location.md)). Nothing in this batch
consumes it; a consumer does, when one can mount.

**A node** — frontmatter and a body, the id being the filename and appearing
nowhere inside it ([location](../design/location.md)):

```
---
---

```

Empty, and it stays empty until somebody deliberately puts something in it. The
frontmatter block is written even when it holds nothing, so a node is always
well-formed and the reader can stay strict.

**Ids are UUIDv7**, lowercase, canonical hyphenated form. Unique without
coordination, and lexicographically ordered by their 48-bit timestamp — so a
directory listing is in creation order for free, with no field carrying a date,
and creation time is readable back out of the name itself.

Ordering is to the **millisecond**. Two nodes minted inside the same
millisecond sort by their random bits, in no meaningful order. Nothing in this
batch depends on which of two simultaneous nodes comes first, and nothing later
should.

**Canonical order on write.** Frontmatter keys are serialised alphabetically.
The tool is the only writer, so canonical output costs nothing and keeps diffs
minimal.

**Scalars are read under YAML 1.2 core** — null, bool, int, float, string, and
nothing else. The default schema turns `2027-01-01` into a date, which would be
the tool deciding what a field it has never heard of means.

## Behaviour

### `init`

Find the repository root. Create `.kg/nodes/` and `.kg/meta/nodes/` there, and
print the path along with the space's name.

**Creates the repository if there is none**, in the working directory, and says
so. A space without a repository has no history, and several rules lean on a
space having an unambiguous prior state — so `init` establishes that rather than
assuming it.

Exit `1` if `.kg/` already exists — a repository holds one space or none — or if
git is unavailable.

Needs no remote and no network.

## Git

`init` is the only command in this batch that runs it: `rev-parse
--show-toplevel` to find the root, then `git init` when there is none. The
external binary, resolved from `PATH`, and nothing else.

**No bundled git.** A packaged application could ship one — that is what
GitHub Desktop does — but it would be the wrong git to use. The user's own is
the one holding their credentials, their helpers and their SSH agent, which is
what cloning a private space needs. A bundled git launched with a scrubbed
environment fails at precisely the operation that matters, and fails with an
authentication error rather than an obvious one. If a distributor ever supplies
one it belongs *below* `PATH`, as a last resort, not above it as an override.

**No embedded git.** A JavaScript implementation would be the tool's first
third-party dependency, and it would substitute a diagnosable failure for an
undiagnosable one: instead of `init` refusing plainly, `mount` would fail three
batches later for reasons the user cannot see, because the embedded git does no
SSH and diverges on credentials.

**No search order to maintain.** One resolution path, one failure.

**A missing git is not a dead end here.** This tool is used by a developer, who
has one, or through an agent, which can install it — so the refusal is written
to be acted on rather than merely reported:

```
git is not installed, and a space needs a repository.
  macOS    xcode-select --install
  Windows  winget install Git.Git
  Linux    your package manager, e.g. apt install git
```

That message is the interface. `Deno.Command().output()` **throws** when the
binary is absent rather than returning a code, so without catching it the tool
dies with a stack trace — the one form of failure an agent reads worst, because
it looks like a defect in the tool rather than a missing dependency.

**Prevention belongs to the installer, not the tool.** A packaged application
should check for git at install time and offer to install it. That keeps one git
on the machine — the user's — and adds nothing here.

### `new [--meta]`

Mint a UUIDv7. Write `nodes/{id}.md` — or `meta/nodes/{id}.md` with `--meta` —
containing an empty frontmatter block and an empty body. **Print the relative
path.**

The path is the interface: the tool has written what it owns, and whoever owns
the reasoning writes the body there with ordinary file tools.

### `show <id> [--path]`

Print the node — frontmatter and body — or with `--path` only its relative path.
Looks in `nodes/`, then `meta/nodes/`. Since the id is the filename this is two
file opens, not a search.

Exit `2` if neither exists. Not an error: the tool is reporting that it has no
answer, which becomes a distinction that matters once other spaces can be
mounted.

### `list [--meta] [--path]`

Enumerate nodes in `nodes/`, or `meta/nodes/` with `--meta`. Ids by default,
relative paths with `--path`, sorted by id — which is creation order, to the
millisecond.

**Parses nothing.** The id is the filename, so listing a space is a directory
read — a parser is paid for only when a question is asked about content, and in
this batch nothing asks one.

`--json` gives the same listing as objects. It parses nothing either: there is
nothing in a node yet to read.

## Output

`--json` on every command. `show --json` emits one object, `list --json` an
array of them:

```json
{ "id": "01a06ebc-45c4-78db-8ded-73c8f25be48e",
  "path": ".kg/nodes/01a06ebc-45c4-78db-8ded-73c8f25be48e.md",
  "created": "2026-09-04T23:23:47.524Z" }
```

That is everything a node has in this batch. Human output is one node per line —
the id, or the path under `--path`.

**`created` is read out of the id, never stored.** UUIDv7 carries its creation
time in its first 48 bits, so the tool computes it on the way out. There is no
`created:` field in any node, and none is wanted: it would be a second copy of a
number already in the filename, free to drift from it.

There is no fallback for a name that is not an id. Nothing but the tool writes
into `nodes/`, and every name it mints is one — so a file named otherwise means
the space is broken, and returning a row without a creation time would hide
that. Detecting it properly belongs to a later batch.

**Nothing in this batch parses a node.** The id is the filename and the
frontmatter is empty, so both forms of `list` are a directory read. The parser
arrives with the first thing worth reading.

## Exit codes

| | |
|---|---|
| `0` | ok |
| `1` | refused — a rule would have been broken; nothing was written |
| `2` | no answer — the thing asked for is absent |
| `4` | usage or internal error |

`1` and `2` are different on purpose. Refusal means the tool declined; absence
means it looked and there was nothing there.

## Built with

Deno and TypeScript, compiled to a binary. **No third-party packages** —
verified by import, 2026-09-04:

| | |
|---|---|
| `jsr:@std/yaml` | parse, stringify |
| `jsr:@std/uuid/v7` | stable; confirmed time-sortable |
| `jsr:@std/cli/parse-args` | flags |
| `jsr:@std/path` | paths |
| `Deno.test` + `jsr:@std/assert` | tests |

`@std/front-matter` was dropped during implementation: its `extract()` accepts
no options, so there was no way to hold the parser to the core schema through
it. Splitting frontmatter is a regex and one `parse` call.

`parseArgs` does not do subcommands: dispatch on `Deno.args[0]`, then
`parseArgs` on the rest against a per-command flag table, and generate help from
that same table — so help and dispatch cannot drift.

Deno rather than Bun because Bun strips types rather than checking them, and
compile-time checking of the refusal paths is the reason to be in TypeScript at
all.

## Not in this batch

Labels, fields of any kind, filters, the manifest, relations, dependencies
between spaces, integrity checking, and body writing.

## Checking it

```
kg init                                  # .kg/ appears
kg new                                   # → .kg/nodes/01997a3e-….md
kg new --meta                            # → .kg/meta/nodes/…
kg list                                  # one id
kg list --path                           # one path
kg list --meta                            # the other one
kg show 01997a3e-… --json                # frontmatter, id, path
kg show 00000000-0000-7000-8000-000000000000; echo $?   # 2
kg init; echo $?                         # 1
```
