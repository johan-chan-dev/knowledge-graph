# Batch 7 — relations

**Done when** a node can say how it stands to another node, and both ends can
be asked.

Built. The design and its argument are in
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

$ kg link "$l" add roles "Bill Smoke" "Haskell Moore"
added 2 to roles

$ kg link "$l"
type	cites
from	01a08fe5-7ea8-…
to	01a08fe5-7ede-…
roles	Bill Smoke, Haskell Moore
since	2026-09-10

$ kg link "$l" forget
forgot 01a08fe5-7f4a-…
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

$ kg node "$a" add links x
links is reserved — a relation is written with `link`

$ kg link "$l" set type cites
type is the link's own data, not a property
```

**Backed by** `batch 7 — relations`, in
[`tool/tests/batches/7_test.ts`](../../tool/tests/batches/7_test.ts).

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

## What it decides

**A link is a record**, `.kg/links/<uuid>.json`, holding its type, both endpoints
and its properties **once**:

```json
{ "type": "supersedes", "from": "<A>", "to": "<B>", "since": "2026-09-10" }
```

**Both endpoints carry an entry for it**, under one reserved name:

```yaml
links:
  - type: supersedes
    link: 01a08e3f-4c21-7bb0-9e7a-5d2f8c1a4e90
    direction: out
  - type: cites
    link: 01a08e40-1f77-7a3e-b2c4-9e81d5a0f3b2
    direction: in
```

So both directions are a single node read — ~70 µs against 7 s over 100 000
nodes — and `links` and `backlinks` are the same read filtered on `direction`.
Type and direction sit on the node, so grouping costs no record reads.

**One reserved name**, `links`. By `structure.md`'s test it qualifies: edges
becoming part of a node's shape is named there as the example of the format
growing.

**The entries are a materialised index; the record is authoritative.** `type`
appears in both, so they can disagree — and when they do the record wins and the
entry is repaired, the same relationship `labels/<word>.json` has to the nodes.

**`links` holds a list of maps, and nothing else may.** The reader refuses a
nested structure today and goes on refusing it for authored names. A reserved
name's shape belongs to the format — the same argument as `body` — so `links` is
validated against exactly `{type, link, direction}` and authors still cannot
nest. [`boundaries.md`](../design/boundaries.md) is satisfied: the reading door
enforces precisely what the writing door produces.

**A link carries properties and exactly one type**, both Neo4j's rules. That is
why it cannot be a bare id in a list — there would be nowhere to put them.

**Making a link starts from the node; breaking it starts from the link.** A
directed edge is not symmetric, so creating one needs a source — you are standing
at A saying something about B. Destroying one needs only the thing destroyed, and
`link` handed back its id.

**A flag the command cannot do without is declared beside it.** `--as` and
`--with-nodes` are `required` in the table, so a missing one is a usage error —
found once by `--as` reaching the serialiser as `undefined` and throwing a stack
trace out of the tool, which is the shape of defect the declared table exists to
make impossible.

**A record has fields and properties, and only properties are writable.**
`type`, `from` and `to` are the link's own data and cannot be set; everything
else is a property obeying a node's rules. So there are no reserved names inside
a record, and `direction` on an endpoint cannot go stale — the ends it names
cannot change.

**A link's properties obey the same rules a node's do.** `kg link <id> set /
unset / add / remove`, over the record instead of frontmatter, reusing the
machinery that already exists — on the properties, never on the three fields. `--with-properties` is then a convenience at
creation carrying one value per name, and a list is built with `add` — the shape
follows from the verb, as [batch 3](3-lists.md) settled, rather than from a flag
having to invent an accumulation rule.

Making them write-once was considered and dropped: the reason was that
`kg link <id>` reintroduces a scope the surface had shed, which is tidiness
rather than an argument about the model. A record with an id and properties
whose properties obey different rules than a node's is an asymmetry with nothing
behind it.

## What it does not do

**Nothing across spaces.** A cross-boundary reference is a URL, not a uuid, so
links never leave a space — which is exactly what makes storing both halves
safe. Multi-space is a later batch, unwritten.

**No querying by relation.** [Batch 8](9-find.md) asks about one node's
properties, and says so: traversal arrives as a command, not as pattern syntax.

**`unlink` removes the link.** The record is deleted and both endpoints drop
it. A word outlives its last use because vocabulary records what has been said;
a link is not vocabulary, it is the relationship itself, so ending it ends the
record — and an orphaned `links/<uuid>.json` nothing points at would be damage
rather than history.

**No integrity checking.** A `link` touches three files and `atomically` renames
one, so a half-failed write leaves an endpoint pointing at a link the other end
does not know about. The record is authoritative, so what survives is a
repairable index rather than a lost fact — repairing it is
[`further-out`](../design/parked/further-out.md)'s.

**No opinion about cycles.** `a supersedes b supersedes a` is wrong and not
refused. [`sharing`](../design/parked/sharing.md) gets acyclicity from the
sharing axis, which does not apply inside one space.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · [3](3-lists.md) · [4](4-stops-guessing.md) · [5](5-the-entry-point.md) · [6](6-labels.md) · 7 · [9](9-find.md)
