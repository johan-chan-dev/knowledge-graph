# Toolbelt

**What `kg` does.** `SCHEMA.md` is what it writes; this is what writes it.

The test for whether an operation belongs: **which invalid state does it stop
`kg` from producing?** An operation that only saves typing is a wrapper, and a
wrapper is where the rules leak back out.

Note the scope of that sentence. These are states `kg` will not write. They are
**not** properties of the graph — see the limit at the end of this file.

## It is not a CLI product

It is invoked as a command, because that is how an agent calls anything. It is
**not** a command-line product, and the difference is what got cut:

| Cut | Why |
|---|---|
| config discovery | the skill knows the repository it is in; paths are passed |
| a reference grammar (`graph:domain/slug`) | invented to avoid paths. A path is shorter and unambiguous |
| `--json` output | the caller reads text |
| an output contract | there is one caller, and it is in the same repository |

What remains is a script with explicit arguments and a documented exit code.

## Two entry points, and the line between them is a git hook

| | Called by | Why it exists |
|---|---|---|
| **construction** | a skill, which knows what the user chose | a hook has no judgement to apply |
| **`build` / `check`** | `.githooks/pre-commit`, and CI | **a git hook cannot invoke a skill** |

That is the whole reason there are two. Everything else — `new`, `link`, `mv`,
`retire` — is only ever reached from a skill, so it needs arguments, not a
surface.

## Raw nodes

A node outside every declared graph is **raw**: it carries no `kind`, appears in
no index, and is checked for nothing.

That is not a gap. `kind` is a *judgement* about what a thing is — fact, concept,
decision, thesis — and making that judgement is the qualifying act. A node nobody
has judged yet has no kind, and its absence is the positive statement, the same
way a decision's forbidden `confidence` positively states *chosen, not checked*.
Nothing about a raw node is checkable, because it claims nothing.

```
kg new sources/<name>.md --set '{"url": "...", "captured": "2026-08-22"}'
```

There is no dedicated capture command, and there was one for a day. Deriving a
filename from a URL, refusing a second capture of the same page, knowing that a
video yields three artifacts — all of that is **policy**, and policy belongs to
the skill that knows what the user asked for. The tool writes nodes and edges and
knows nothing about URLs. If the skill derives the path deterministically, `new`
already refuses the duplicate, because it refuses any node that exists.

**A kind outside a graph is refused**, since qualifying a claim is what a graph
is for.

**Edges cross the raw boundary in both directions.** The citation rule constrains
what a *claim* may rest on; a raw node makes no claim and has no scope, so the
rule cannot apply to it either way. That crossing is the point — a qualified node
pointing at what it was drawn from is the whole reason the layer exists.

`check` counts raw nodes separately: **raw against qualified is the number that
shows the practice failing**, and an uncounted inbox is how it fails unnoticed.

## Write

```
kg new <path> --kind K --title "…" [--set '{…}']
kg set <path|task-id> --set '{…}'
kg supersede <path> --title "…" --set '{…}'
kg task new <slug> --cost C --due D [--due-when "…"]
kg task retire <id> [--force]
kg link <from> <to> --rel R [--set '{…}']
kg unlink <from> <to> [--rel R]
kg mv <old> <new> [--dry-run] [--force] [--closure]
```

**`set` takes a path or a task id**, because they are the same act on the same
key. It merges into `attributes`; `null` deletes.

**`adopt`, `decide` and `provisional` were dropped.** `new` prepends frontmatter
to a file that already has a body, so adoption is a case of creation rather than
a second verb. And `set` validates the *merged result* before writing, so
`{"status":"decided"}` without a `revisit-when` is refused — which is the whole
guarantee a bespoke transition verb existed to provide.

| `kg` will not produce |
|---|
| missing frontmatter · missing required field · unknown `type` · facet not a list |
| `[universal, fr]` — the exclusive-frame rule |
| a node absent from its `INDEX.md`, because creation writes both |
| `confidence` on a decision — the template never emits the field |
| duplicate or non-integer task `id` · `deferred` without `due-when` |
| `decided` without `decided:` or `revisit-when:` |
| half-written supersession — `--supersedes` writes **both** sides |
| a relation target that does not resolve |
| broken inbound links after a rename |

**`new` writes a skeleton, not a node.** Frontmatter, a title heading, and the
index entry — then the body is written separately. Two steps, and the split is
honest: the skeleton is deterministic and the argument is not. You choose the
type, the frame and the title *before* writing the reasoning; that is what
choosing them means.

**`adopt` is the reverse case, and needs its own verb.** A file that already has
content becomes a node: frontmatter added, index entry appended, **body
untouched**. This repository's own history is the argument — an 853-line design
document became 20 nodes — and it is the install story for any repository that
already has documents.

The two differ in one thing, whether a body exists, and get separate verbs
because their failure modes are opposite: **`new` refuses on an existing file**,
since silently overwriting a draft is unrecoverable in the moment; **`adopt`
refuses on a missing one** and never writes prose. A single flag would collapse
them and put the destructive path one keystroke from the safe one.

**`supersede` inserts into a chain; it does not create a replacement.** The live
node keeps its path — which is its identity — so inbound citations never rot. A
snapshot goes to `<stem>.vN.md` carrying only its own chain link, and the live
node's `supersedes` edge is repointed at it. A linked-list insert.

An earlier design made the replacement a *new file* and marked the old one
superseded, which quietly orphaned every citer onto history.

**`--aspect` is the one edge attribute that survived.** *Which* part of a target a
node depends on is neither computable from the endpoints nor substantial enough
to be its own node. Everything else proposed — frame overlap, provenance, dates —
is computable, or lives in git, or needs a source and is therefore a node.

**`--closure` moves the dependent subgraph with it, and the number it prints
means opposite things in the two directions.**

| Moving | The count is | A large one means |
|---|---|---|
| personal → shared, inside one space | the **cost of a generality claim** | the claim is false — usually a refusal |
| personal space → shared space | the **unit of sharing** | nothing is wrong; that is the shipment |

Read with `--dry-run`. In the origin repo, promoting one stack node returns **all
40 nodes of the product graph**, because that graph is a single connected
component under its own edges. As a promotion that is the answer to "is this
shared", arriving as a count rather than as an argument. As a *share* the same 40
are simply what has to travel for the reasoning to be readable at the far end.

**The closure stops at the space boundary.** It walks only inside the source
space; a dependency in a third space is left where it is, and `mv` refuses rather
than write a graph that breaks the citation rule. Bounding it by space rather
than by scope is what stops one product's move from silently shipping another
product's reasoning — with several products, "personal" is not one place. What the
closure declines to carry is exactly what somebody else owns.

**`mv` refuses to cross a space boundary that would break the citation rule.**
Promoting carries the node's own downward edges up with it; demoting leaves every
citation from above pointing down. Both were previously silent — a promotion in
the origin repo produced 19 errors and exited 0, leaving them to be found at
commit time rather than at the moment they could still be reconsidered.

**`mv` re-bases every inbound reference** — typed relations, prose links, index
entries. It exists because doing that by regex broke 157 links in the origin
repo: a second pass re-based what the first had just created, every path
plausible and one level too deep.

**`task retire` refuses while references remain**, unless forced. That refusal is
where two stale blockers surfaced — text saying *X is blocked by Y* where Y had
answered days earlier, invisible to every check.

## Read — only what grep does badly

```
kg inbound <path>                                # what cites this, typed and prose
kg neighbors <path> [--hops N] [--frontmatter]   # an ego graph, as a list
kg stale                                         # overdue recheck, every provisional trigger
```

**`neighbors` returns a list, not the nodes.** Measured on one graph at two hops:
the list is ~378 tokens, adding every neighbour's frontmatter is ~1,821, and
reading the bodies is ~14,000. Frontmatter is 10% of that graph and carries
`serves` and `revisit-when`, so the expensive read is usually avoidable rather
than merely boundable — which is why there is no `--budget`. Searching is not
reading.

Two, not five. `show` and `ls` were cut: the graph is markdown and the caller
opens files natively. What survives are **computations** — `inbound` needs
relative-link resolution across every node, `stale` needs date arithmetic — and
both were hand-rolled repeatedly in the origin repo before being named.

`inbound` is **scope-aware**: it must not surface a personal citation under a shared
node, or the derived layer reintroduces downward visibility that the schema
forbids.

`stale` **lists rather than decides**. Whether a `revisit-when` has fired is an
event in the world; a tool can only put the trigger in front of someone.

## Program — because a hook has no skills

```
kg build [--check]     # writes MAP, QUEUE, INDEX listings; --check fails instead
kg check               # read-only, never writes
kg init                # once per repository
kg migrate [path] [--dry-run]   # flat frontmatter to kind/attributes/relations
```

**`build` is provisional, pending viewer tools.** It materialises three queries
into committed files because there is nothing to render them on demand. Once
there is, those files become a **cache rather than the artifact** — and only one
reason survives the change: `meta/MAP.md` is an `@`-import, and imports are
files, so the agent-context path needs something on disk at session start.

Keep it thin for that reason. The durable piece is the **resolver** underneath —
find candidate references, resolve each to an absolute path, compare — which
`check`, `inbound` and `mv` need identically and no viewer decision can
invalidate. Elaborating `build` would be building on the part most likely to
move.

**Derived** means computed from the source and holding nothing of its own. The
test is exact: delete it, rebuild, byte-identical.

`build` and `check` are separate because fused — as they were in the origin repo
— a clean repository fails its own commit with *"regenerated — `git add`"*, which
reads as an error and means work was done for you.

`check` catches only what no constructor can own, all of it prose:

- a link inside a node body does not resolve
- a shared node cites into a personal graph
- a claim at shared knowledge is written in the first person plural
- a generated file is stale

Four, down from twenty-four. Every one that went is gone because a constructor
produces the field correctly and re-checking it would be work done twice — and
the four that remain do so because **nothing owns a sentence**.

### The limit, stated plainly

**`check` does not re-validate frontmatter at all.** The twenty checks were not
replaced by a guarantee; they were dropped because the writer was assumed to be
`kg`. A node written by hand, by another tool, or living in a mounted repository
that does not run `kg` is validated by nothing, anywhere.

So the saving is real and it is a property of **how a node was produced**, never
of the graph that holds it. Anything that admits a second writer — mounting a
foreign space, adopting a node from elsewhere, an editor — removes the premise
the reduction rests on.

`init` writes the config, creates the `meta/` directories, scaffolds the doctrine
stubs, and prints the one thing it cannot do:

```
git config core.hooksPath .githooks
```

Hook paths are local config and do not travel with a clone.

## Deliberately absent

**There is no `kg node rm`.** The graph is monotonic: a node is superseded, never
deleted. Encoding that as a missing operation is stronger than refusing it —
there is nothing to argue with.

`kg task retire` exists because a task is a different entity: it drains, its
content moves elsewhere, and its container is then removed.

## Calibration

`adr-tools` ships 8 subcommands and **no validation at all** — everything is
constructed, so there is nothing to check. `@modelcontextprotocol/server-memory`
ships 9. Twelve here, four of which are setup or hook-only.

An earlier draft had sixteen plus a config schema and a reference grammar. That
was a product surface for a caller that lives in the same repository.
