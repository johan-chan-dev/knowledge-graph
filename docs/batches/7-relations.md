# Batch 7 — relations

**Done when** a node can say how it stands to another node, and both ends can
be asked.

Planned. The design and its argument are in
[`design/parked/relations.md`](../design/parked/relations.md); this is what the
batch builds and what it leaves.

## What it should look like

```console
$ kg node "$a" link --as supersedes --with-nodes "$b"
01a08e3f-4c21-7bb0-9e7a-5d2f8c1a4e90

$ kg node "$a" link --as cites --with-nodes "$b" "$c" --with-properties since=2026-09-10 why=drift
01a08e40-1f77-7a3e-b2c4-9e81d5a0f3b2
01a08e41-88b3-7c19-a7de-0b4f2e6c9d15

$ kg node "$a" links
cites	01a08e40-1f77-…	01a084f0-63be-…
cites	01a08e41-88b3-…	01a084f0-6401-…
supersedes	01a08e3f-4c21-…	01a084f0-63be-…

$ kg node "$b" backlinks
cites	01a08e40-1f77-…	01a084f0-631b-…
supersedes	01a08e3f-4c21-…	01a084f0-631b-…

$ kg node "$a" unlink --as supersedes --with-nodes "$b"
unlinked 1
```

Type, link id, other end — tab-separated, as `labels list` is. No arrows:
`links` and `backlinks` already say which way it runs.

And the refusals:

```console
$ kg node "$a" link --as supersedes --with-nodes 01a08000-0000-7000-8000-000000000000
no such node: 01a08000-… in knowledge-graph

$ kg node "$a" link --with-nodes "$b"
link needs --as

$ kg node "$a" link --as cites --with-nodes "$b" --with-properties drift
not a property: drift — expected name=value

$ kg node "$a" set links.supersedes x
links is reserved — a relation is written with `link`
```

**Will be backed by** `batch 7 — relations`, as `7_test.ts` in
[`tool/tests/batches/`](../../tool/tests/batches/) — written when the batch is.

## It fixes how flags are declared first

The surface above needs two variadic flags (`--with-nodes`,
`--with-properties`) and a valued one (`--as`). None of that is exotic; what
blocks it is where the flag list lives.

**A property arrives as `name=value`**, and the split is unambiguous rather than
lucky: a name is `[a-z0-9]+(-[a-z0-9]+)*` so it can never contain `=`, and a
value is single-line text, so cutting at the first `=` always cuts in the right
place. `k='v v v'` works because the shell has already removed the quotes, and
`k=a=b` gives the value `a=b`.

That makes all three multi-value flags the **same shape**, so the tokeniser
needs three kinds and not four: boolean, value, variadic.

**Today a flag is declared in six places**, and three of them exist only to undo
a fourth. `parse-args` is handed a **union of every flag in the tool**, so each
one is parseable on every command — and then a placement loop, a parameter type
and a special case in `check` walk that back. Belonging is enforced afterwards
instead of being the parse.

That is [batch 5](5-the-entry-point.md)'s own defect table one level down: it
consolidated a command's *shape* into the table and left its *flags* scattered,
so `nodes list --properties` parsing cleanly and being rejected later is exactly
`--where` parsing cleanly and being rejected later.

**So a flag belongs to a command**, with its shape:

```
flags: {
  stdin:         { kind: "boolean" },
  "with-labels": { kind: "variadic" },
}
```

Adding `--with-prop` to `link` then touches one entry. The `Flag` union goes,
the placement loop goes, and the global spec goes — a flag not declared on a
command is simply not a flag there. `--properties belongs to \`kg node <id>\``
survives as a lookup across the table when phrasing the refusal, rather than as
a rule policing a registry.

**Parsing is ours, ~45 lines, and the decision was measured.** `@cliffy/flags`
handles all four shapes correctly and its errors are catchable — the earlier
claim here that no library fits was wrong. What decided it is that with a
per-command spec the job is small and fully bounded: no short flags, no aliases,
no negation, no coercion, flag names `[a-z-]+`, values that never begin with
`-`. Cliffy would be four shapes out of many, plus translating its error voice
into this tool's. **If short flags or aliases are ever wanted, that reverses.**

**It fixes three defects [batch 6](6-labels.md) shipped**, which is why it comes
first rather than after:

| | today |
|---|---|
| `kg node new auth decision` | **silently labels the node** — no flag was given |
| `--with-labels auth --stdin decision` | `decision` still becomes a label |
| `kg node new --with-labels` | `not a label: ` rather than naming the flag |

All three are the global parse leaking. Under a per-command spec the tokens are
either consumed by a declared flag or they are positionals the table refuses,
and the question never arises.

## And the dot rule, which nothing has ever used

`links.supersedes` is refused today — *not a property name*.
[`structure.md`](../design/structure.md) designed the rule that a dot may follow
a reserved name, for `body.lines`, and nothing has exercised it since. Relations
are what make it real.

## What it decides

**A link is a record**, `.kg/links/<uuid>.json`, holding its type, both
endpoints and its properties **once**. Each endpoint carries the link's id under
`links.<type>` or `backlinks.<type>`, so both directions are a single node read
rather than a scan — ~70 µs against 7 s over 100 000 nodes.

**Two reserved names**, `links` and `backlinks`. By `structure.md`'s test they
qualify: edges becoming part of a node's shape is named there as the example of
the format growing.

**A link carries properties and exactly one type**, both Neo4j's rules. That is
why it cannot be a list element — there would be nowhere to put them.

**The commands start from the node**, never from the link. A directed edge is
not symmetric, and the source is where the caller is standing.

## What it does not do

**Nothing across spaces.** A cross-boundary reference is a URL, not a uuid, so
links never leave a space — which is exactly what makes storing both halves
safe. Multi-space is a later batch, unwritten.

**No querying by relation.** [Batch 8](8-find.md) asks about one node's
properties, and says so: traversal arrives as a command, not as pattern syntax.

**`unlink` removes the link.** The record is deleted and both endpoints drop
it. A word outlives its last use because vocabulary records what has been said;
a link is not vocabulary, it is the relationship itself, so ending it ends the
record — and an orphaned `links/<uuid>.json` nothing points at would be damage
rather than history.

**No editing a link after the fact.** The record has an id, so it is
addressable, but every command here starts from a node and `kg link <id> set`
would reintroduce a scope the surface shed. Set the properties at `link` time
or make a new one.

**No integrity checking.** A `link` touches three files and `atomically` renames
one, so a half-failed write leaves an endpoint pointing at a link the other end
does not know about. The record is authoritative, so what survives is a
repairable index rather than a lost fact — repairing it is
[`further-out`](../design/parked/further-out.md)'s.

**No opinion about cycles.** `a supersedes b supersedes a` is wrong and not
refused. [`sharing`](../design/parked/sharing.md) gets acyclicity from the
sharing axis, which does not apply inside one space.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · 7 · [8](8-find.md)
