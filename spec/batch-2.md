# Batch 2 — nodes carry words

```
label <id> <name>...              add
label <id> --remove <name>...     remove
list  … [--with-label <name> | --with-labels <name>...]
```

**Done when** you can tag a node and find it again by its tags.

**Why only labels.** `set` and `unset` write arbitrary fields, which is a
different question — the tool storing something it does not understand. A label
it does understand the *shape* of: it validates one, and it is the substrate's
own grouping mechanism ([grouping](../design/grouping.md)). Keeping them apart
means the batch that introduces reading frontmatter is not also the batch that
introduces opaque values.

## What changes on disk

A node grows its first field:

```
---
labels: [auth, pattern]
---

```

**Removing the last label removes the key**, leaving `---\n---\n\n` — exactly
what `new` writes. A node that once had labels and now has none must be
indistinguishable from one that never had any; `labels: []` would be a residue
recording history that frontmatter has no business carrying.

**A label is a lowercase hyphenated token** — `[a-z0-9]+(-[a-z0-9]+)*`. Letters,
digits and hyphens, nothing else ([grouping](../design/grouping.md)).

**Frontmatter is read under YAML 1.2 core** — null, bool, int, float, string.
The default schema turns `2027-01-01` into a date, which would be the tool
deciding what a field it has never heard of means. Nothing in this batch writes
such a value, but everything in this batch *reads* frontmatter, so the reader is
held to it from the start.

## Behaviour

### `label <id> <name>...` and `label <id> --remove <name>...`

Reads the node, changes the list, writes it back.

**Names are positional, and adding is the default** — it is the common case and
gets the shortest form. Removal is rarer and says so.

**No mixing.** The `--remove` form removes only; there is no precedence question
because there is nothing to resolve. Wanting both in one call means calling
twice, which is rare enough not to design for.

A sign prefix — `+auth -pattern` — was the first shape and does not survive
argument parsing: `-pattern` is a short-flag cluster to any parser, and would
arrive as `-p -a -t -t -e -r -n`. Positional names cannot be mistaken for
anything.

**Idempotent.** Adding a label already present, or removing one that is absent,
is not an error — what was asked for is the end state, and refusing would make
the command awkward to call from a script that does not track what is already
there.

Exit `1` on a name that is not a valid token, before anything is written. Exit
`2` if the node does not exist. `label <id>` with no names is a usage error
rather than a silent no-op: nothing was asked for.

### `list … [--with-label <name> | --with-labels <name>...]`

Every name must match — `--with-labels auth pattern` returns nodes carrying
both.

**Names are positional after the flag**, the same shape as `label`. A name is
never a flag value anywhere in this tool: it is positional after the verb when
setting, positional after the flag when filtering. That works here only because
`list` has no positional argument of its own — it enumerates rather than naming
a thing — so everything up to the next flag is a name.

```
kg list --with-labels auth pattern --path
        └──────────┬───────────┘
                   both, then the flag's run ends
```

**The two spellings differ in arity, not in behaviour.** `--with-label` takes
exactly one and refuses more; `--with-labels` takes one or many. So the name is
never wrong about what it accepts, and `--with-label auth pattern` is a usage
error rather than a quiet success:

```
--with-label takes one name; use --with-labels for several
```

That is one parse — collect the names following the flag — plus an arity check,
and it means a caller producing the singular form for a single label is right
rather than merely tolerated.

**Filtering parses; bare listing still does not.** Without filters `list` is a
directory read, exactly as in batch 1. With either flag it must open each file,
so this is where the reader first runs over a whole space.

## Writing

**Writes are atomic**: a temporary file in the same directory, then a rename.
This is the first batch that modifies an existing node rather than creating one,
and an interrupted rewrite would corrupt the one thing the tool is custodian of.
Rename is atomic on every filesystem that matters; write-in-place is not.

**Serialisation stays canonical** — keys alphabetical, `flowLevel: 1` so
`labels: [auth, pattern]` stays on one line. The tool is the only writer of
frontmatter, so canonical output costs nothing and keeps diffs minimal.

## Reading a node that will not parse

Possible for the first time, and not hypothetically. `new` hands back a path so
that the body can be written with ordinary file tools — so something other than
the tool routinely edits the same file the tool owns the top of. Frontmatter
gets mangled that way.

So a filtered listing **skips an unparseable node, names it on stderr, and exits
`0`.** One damaged file must not make a space unfindable, and reporting is not
the same as failing. `label` on a specific node that will not parse is different
— that one exits `1`, because the caller asked about that node and the tool
cannot honour it.

Nothing in this batch attempts repair. Detecting damage systematically is a
later batch's job.

## Output

`--json` now carries the node's labels:

```json
{ "id": "01a06ebc-…",
  "path": ".kg/nodes/01a06ebc-….md",
  "created": "2026-09-04T23:23:47.524Z",
  "labels": ["auth", "pattern"] }
```

Everything in the envelope is the tool's own, so it is flat. A node with no
labels omits the key rather than reporting `[]`, matching what is on disk.

## Decisions this batch forces

**Where the token rule is enforced.** In `label`, at write time.
`list --with-label Auth` is not an error — it matches nothing, because read
commands report what they found rather than judging what they were asked.

**Whether the read-modify-write path is worth isolating.** `label` is the first
command that changes an existing node, and the shape — read, alter one thing,
write atomically — is not obviously specific to labels. Whether that is factored
out or left inline is a judgement to make while writing it, not before.

**What a partial failure does.** `label x good Bad` is refused whole — the
validation runs before the read, so a rejected call leaves the node untouched.

## Not in this batch

Nothing writes or reads a field other than `labels`. Nothing removes a node,
connects two, reaches outside this space, or checks the space for damage.

What comes next is decided when it is needed, not here — the shape of this
surface has changed at every batch so far, and a list of intentions written now
would mostly be wrong.

## Checking it

```
kg new                                   # → .kg/nodes/01a06ebc-….md
kg label 01a06ebc-… auth pattern
kg show 01a06ebc-…                       # labels: [auth, pattern]
kg list --with-label auth                # the id
kg list --with-labels auth pattern       # the id
kg list --with-labels auth nope          # nothing, exit 0
kg list --with-label auth pattern        # usage error, exit 4
kg label 01a06ebc-… --remove auth pattern
kg show 01a06ebc-…                       # ---\n---\n\n, as new wrote it
kg label 01a06ebc-… Bad_Label; echo $?   # 1, nothing written
kg label 00000000-0000-7000-8000-000000000000 x; echo $?    # 2
```
