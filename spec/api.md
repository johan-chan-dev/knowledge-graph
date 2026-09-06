# The command surface

What the tool offers, in one place. [`storage.md`](storage.md) is what sits
underneath it and [`git.md`](git.md) is what it needs to exist;
[`design/`](../design/) is why any of it is so. What has been decided but not
built is in [`parked.md`](parked.md).

## Shape

```
kg [-C <dir>] <scope> [action] [arguments] [--flags]
```

**A bare scope reads. A scope with an action writes.** The first word says what
the operation can touch before saying what it does — so `node` tells you one
node is in play, and `nodes` tells you the collection is.

Reading has no action because *no verb* is the honest name for fetching.

| scope | | |
|---|---|---|
| `space` | the one you are in | singular — you are inside it |
| `nodes` | the collection | plural — you enumerate it |
| `node` | one of them | singular — named by its id |

## space

```
kg space              what and where this space is
kg space init         create one
```

**A space is `.kg/` at the root of the repository containing the current
directory.** That is the whole lookup: no walk upward, no search order, no
configuration. `init` and every later command run the identical resolution, so
they cannot disagree about which space is in play.

`-C <dir>` changes which directory that is, exactly as git's does — it is *run
this as if from there*, resolved before anything else happens. It is not a space
selector: the tool cannot find spaces by name and should not appear to.

**One space or none.** `init` refuses if the repository root already has `.kg/`.

**Creates the repository if there is none**, in the working directory. A space
without one has no history, and several rules lean on a space having an
unambiguous prior state — so `init` establishes that rather than assuming it.

**A space stores no name of its own** — its name is the name of the directory
holding it, read when anyone needs it. It never refers to itself.

Bare `kg space` is the orientation call, and `space init` ends by printing the
same readout: init's job is to leave you oriented, and the orientation call
already exists.

```
knowledge-graph
  root     /Users/jconan/work/notes
  branch   main
  nodes    47
```

`branch` is there because the nodes differ per branch — without it the count is
ambiguous.

## nodes

```
kg nodes              every id, in creation order
```

**Parses nothing.** The id is the filename, so enumerating is a directory read.

**No cap.** The space is the scope; one too large to enumerate is saying
something about how the material is organised, and hiding that would hide the
signal.

An empty space prints nothing and exits `0`. An empty answer is a correct
answer, and a *no nodes yet* line would land in every script that counts lines.

## node

```
kg node <id>              the content
kg node write             create one — stdin is its content → prints the new id
kg node write <id>        replace that node's content entirely
```

**The prose is the node.** `kg node <id>` returns it and nothing else — no
frontmatter, no id header, no separator. It is the only command whose stdout is
data rather than a report, which is what lets it be piped into anything.

**Ids are minted, never supplied.** `write` with no id creates and hands the id
back. `write <id>` on an id that is not here **refuses rather than creating** —
a caller cannot invent an id, so an unknown one means the node is gone or this
is the wrong space, and creating it instead would turn a typo into a node.

**Content arrives on stdin**, so it costs one call and no intermediate file:

```bash
kg node write <<'EOF'
Keeping the id in the filename makes a rename impossible by construction.
EOF
```

With stdin at a terminal the node is created empty. That is the hand-creation
case, not the normal one.

## Across every command

**stdout is the answer. stderr is everything else** — advisories, warnings,
refusals. A command's stdout is always safe to pipe, and nothing a script
consumes is mixed with a message meant for a person.

| | stdout | stderr |
|---|---|---|
| `space` | the readout | — |
| `space init` | the readout | `initialised a git repository at …` *(only when it did)* |
| `nodes` | one id per line | — |
| `node <id>` | the content, byte for byte | `128 lines, 4.2 KB` |
| `node write` | the new id | `wrote 74 bytes` |
| `node write <id>` | that id | `wrote 74 bytes, replacing 210` |

**Every operation reports its own magnitude on stderr.** Read says what you got,
write says what you displaced. The read line is how a caller knows whether it
received a whole node or part of one; the write line's second number is how an
agent that meant to extend a node catches itself having shrunk it.

**Every write returns the id of the node it wrote.** Creating is the case where
that id is new information; the rest is the same rule applied uniformly, which
costs one line and removes every special case.

**`--json` is format, never a selector.** Same content, structured. The stderr
advisories stay prose under it — they are confirmations rather than answers, and
moving them into the object would make the flag select.

```
space  →  { "name": …, "root": …, "branch": …, "nodes": 47 }
nodes  →  [ { "id": …, "created": … }, … ]
node   →  { "id": …, "content": … }
write  →  { "id": … }
```

**Every read and every write goes through the tool.** No command hands back a
filesystem location, and nothing outside the tool has cause to know one. Where
nodes live, how one is serialised, what divides its frontmatter from its prose —
all of it is the tool's business, which is what lets any of it change without
breaking a caller.

**A space has a location; a node does not.** `kg space` reports where the space
is because a person navigates there — it is a repository, and git, an editor and
a shell all need it. Inside it nothing is addressable but by id.

**Ids in, ids out.** An id is the only handle on a node.

**Validation precedes lookup**, so a refused call cannot have touched anything.

## Exit codes

| | |
|---|---|
| `0` | ok |
| `1` | refused — an argument breaks a rule; nothing was written |
| `2` | no answer — the thing asked for is well formed and not here |
| `4` | usage or internal error |

`1` and `2` differ on purpose. A string that is not a uuid is **refused** — the
tool could never have minted it as a filename, so it did not look and find
nothing. A well-formed id that is not here is **absent**: it may have been
removed, or this may be the wrong space. A caller acts differently on each.

## Refusals

| | message | exit |
|---|---|---|
| outside a space | `no space here — run: kg space init` | `2` |
| `init`, one exists | `this repository already has a space at …/.kg` | `1` |
| `init`, no git | `git is not installed, and a space needs a repository.` + install lines | `1` |
| id is not a uuid | `not an id: abc — expected a uuid` | `1` |
| id not here | `no such node: 01997a3e-… in knowledge-graph` | `2` |
| no frontmatter fence | `cannot read 01997a3e-…: no frontmatter block` | `1` |

**The absent message names the space**, because *wrong space* is one of the two
real causes and the caller cannot see which from the id alone.

Style: lowercase, no trailing period, `—` before a hint, a remedy where one
exists and none where fixing the argument is self-evident, and **never a
filesystem location except the space's own root**.

## Deliberately absent

**No way to ask where a node is.** A location would be an invitation to act on
it, and every act on a node is a command. It would also nail the layout into the
contract.

**No query language.** Expressive enough for the hardest view is a larger thing
than the practices it would serve.

**`find` is not `nodes`.** Filtering narrows a known set; `find` would locate an
unknown one. The name is kept free for retrieval, which is a different operation
and an open question.

**No index.** Membership is computed at read time and stored nowhere. Should one
ever be built it is an accelerator that may be deleted without notice, and no
command may depend on it existing.

**No daemon, no renderer, no scores.**

**No practice anything.** No kinds, no constructor questions, no queue, no
rulings. Those belong to a practice tool composed over this surface.
