# The command surface

What the tool offers, in one place. [`storage.md`](storage.md) is what sits
underneath it and [`git.md`](git.md) is what it needs to exist;
[`design/`](../design/) is why any of it is so. What has been decided but not
built is in [`design/parked/`](../design/parked/), and how it got here is in
[`batches/`](../batches/).

## Shape

```
kg [-C <dir>] <scope> [<id>] [action] [arguments] [--flags]
```

**Reading a single resource is implicit. Everything else names its action.**

A single resource has exactly one thing to fetch, so a verb would add nothing —
`kg node <id>` cannot mean anything but *that node*. A collection has many
read-shaped operations, so one has to be named: you do not read a collection,
you list it, and later you may query or count it. Every write names itself,
always.

**A scope names what the operation can touch, and never overstates or
understates it.** That is the whole test, and it decides every name here:

| scope | touches |
|---|---|
| `space` | the space |
| `nodes` | the collection — membership changes here |
| `node <id>` | that node |

So `nodes list` rather than `node list`: enumerating touches the collection, and
a singular scope would claim otherwise.

**An id narrows the scope; it is never an argument to a verb.** `node <id>` is
*this node*, addressed before anything is asked of it — which puts the id beside
the noun it identifies rather than between a verb and what the verb acts on. The
chain extends without new rules: a node's properties are `node <id> <property>
<action>`, and any space-wide collection is `<plural> <action>`.

`node` is the one scope with two shapes, because you cannot address what does
not exist yet:

```
kg node new           no id — there isn't one
kg node <id> …        an id — act on that one
```

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

`kg space` is the orientation call, and `space init` ends by printing the
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
kg nodes list                              every id, in creation order
kg nodes list --where   <name>[=<value>]   the property equals, or merely exists
kg nodes list --without <name>             the property is absent
```

**Bare, it parses nothing.** The id is the filename, so enumerating is a
directory read. **Filtered, it opens every file** — which is where the tool
first runs over a whole space.

Both flags repeat and all of them are ANDed: `--where a=1 --where b --without c`
is one conjunction.

**Three predicates, and the boundary stops there.** No comparison operators, no
`or`, and no negated values — `--without retired=2027-01-01` has two defensible
readings (does it match a node with no `retired` at all?) so it would need a rule
nobody remembers. Absence and inequality are different questions, and `--without
<name>` answers the one with a single answer.

**The tool compares strings and understands nothing.** It does not know what
`decided-by` names, only whether the text matches. That is the slot discipline
applied to reading.

**A node that will not parse is skipped and named on stderr**, and the listing
still exits `0`. One damaged file must not make a space unfindable, and
reporting is not the same as failing.

**No cap.** The space is the scope; one too large to enumerate is saying
something about how the material is organised, and hiding that would hide the
signal.

An empty space prints nothing and exits `0`. An empty answer is a correct
answer, and a *no nodes yet* line would land in every script that counts lines.

## node

```
kg node new                          create one — stdin is its content
kg node <id>                         the content
kg node <id> --properties            the properties instead
kg node <id> write                   stdin replaces the content
kg node <id> set   <name> <value>    write one property
kg node <id> unset <name>            remove one
```

**The prose is the node.** `kg node <id>` returns it and nothing else — no
properties inline, no id header, no separator. It is the only command whose stdout is data rather
than a report, which is what lets it be piped into anything.

**`new` and `write` are different operations, not one with an optional id.**
Creating changes what the collection contains; replacing does not. They sit in
different shapes of the scope for that reason, and the distinction is visible in
the command rather than inferred from whether an argument was supplied.

**Ids are minted, never supplied.** `new` hands the id back — the one thing a
caller could not have worked out. `<id> write` on an id that is not here
**refuses rather than creating** — a caller cannot invent an
id, so an unknown one means the node is gone or this is the wrong space, and
creating it instead would turn a typo into a node.

**Content arrives on stdin**, so it costs one call and no intermediate file:

```bash
kg node new <<'EOF'
Keeping the id in the filename makes a rename impossible by construction.
EOF
```

**An empty stdin refuses.** `cmd | kg node new` where `cmd` failed and
`kg node new </dev/null` are byte-identical requests meaning opposite things
— the shell erases the difference before the tool sees it — so it names the
likely cause rather than guessing:

```
no content on stdin — did the command before the pipe fail?
```

Stdin at a terminal is the same end state and refuses the same way, so the tool
never hangs waiting on one and never quietly mints something nobody asked for.

**It matters most when replacing.** Accepting an empty stdin there turns a
silent upstream failure into a node's content destroyed and reported as success;
creating an empty node by accident is only litter. So both refuse.

**There is no escape hatch, because there is nothing to escape to.** A node
holding a single newline is one keystroke away and perfectly legal, so refusing
zero bytes takes no capability with it — and a flag guarding the gap between
nothing and one newline would be guarding a distinction nobody has.

### Properties

**stdout is one half of a node or the other, never both.** `--properties` swaps
which. There is no third command for reading properties, because `kg node <id>`
already answers that question.

**Reading the content puts the properties on stderr**, rendered identically —
the same lines, byte for byte, only the channel differs. An agent reading a node
wants to know how it is classified, and a consumer that discards stderr loses
nothing it needed.

```
$ kg node 01997a3e-… --properties
decided-by: 01997b12-…
valid-until: 2027-01-01
```

**Rendered, not the stored block.** Printing the frontmatter would leak the
format and invite parsing it; a rendering is the tool answering rather than
showing its file. A node with no properties prints nothing and exits `0`.

**`set` and `unset` are about the property; the value is stored as given.** The
tool writes back the text it was handed and compares text on the way out — it
never decides that `42` is a number, for the same reason the reader is pinned to
YAML 1.2 core.

**`set` takes exactly one value** and refuses a second, naming quoting as the
fix. Joining several would collide with a list operation, where several values
mean several elements — the shape has to follow from the verb rather than from
how many arguments arrived.

**A property name is a lowercase hyphenated token** — `[a-z0-9]+(-[a-z0-9]+)*`.
Anything needing quoting or escaping is a name that will eventually be typed
wrong and fail by silently matching nothing.

**A value is a single line of printable text.** Refused: `U+0000`–`U+001F` and
`U+007F` — newline, carriage return, tab and the other control characters.
Everything else is legal, including spaces, punctuation, and `= & ? ;`, because
a URL alone needs most of them.

The restriction comes from the output contract rather than from storage: this
prints one property per line, so a value spanning lines makes the output
unreadable to anything, including a person. And a value wanting several lines is
content, which is what the body is for.

Tab is refused for a different reason — it renders identically to spaces, so two
values that look the same would not match a filter.

**`unset` is idempotent.** Removing a property that is absent is the end state
that was asked for.

**Everything else about a node is untouched.** `set` rewrites one key; the
content and every other property survive it, and so does the reverse — `write`
replaces content and leaves properties alone.

## Across every command

**stdout is the answer. stderr is everything else** — advisories, warnings,
refusals. A command's stdout is always safe to pipe, and nothing a script
consumes is mixed with a message meant for a person.

**stderr reports what the caller could not have worked out.** A count of the
bytes you just sent, or the lines you were just handed, is telling you something
twice — and a channel that repeats what you already know is one you learn to
stop reading, which then costs you the lines that matter.

| | stdout | stderr |
|---|---|---|
| `space` | the readout | — |
| `space init` | the readout | `initialised a git repository at …` *(only when it did)* |
| `nodes list` | one id per line | `skipped <id>: …` for a node that will not parse |
| `node new` | the new id | — |
| `node <id>` | the content, byte for byte | its properties, rendered |
| `node <id> --properties` | one `name: value` per line | — |
| `node <id> write` | — | `replaced 210 bytes` |
| `node <id> set` | — | `set kind`, or `replaced kind` |
| `node <id> unset` | — | `unset kind`, or `kind was not set` |

**A targeted write prints nothing.** Only `new` returns an id, because only
there is the id new information; echoing back one the caller just supplied is
noise. Exit `0` says it worked, the way `git add` does.

**What a write reports is what changed, not what you asked for.** `replaced 210
bytes` carries the size you displaced; `replaced kind` says the property already
existed. Both are facts you could not have had in advance, and they are what
catches a write that meant to extend and shrank instead.

**Every read and every write goes through the tool.** No command hands back a
filesystem location, and nothing outside the tool has cause to know one. Where
nodes live, how one is serialised, what divides its frontmatter from its prose —
all of it is the tool's business, which is what lets any of it change without
breaking a caller.

**A space has a location; a node does not.** `kg space` reports where it
is because a person navigates there — it is a repository, and git, an editor and
a shell all need it. Inside it nothing is addressable but by id.

**Ids in, ids out.** An id is the only handle on a node.

**Names are long, because the caller is an agent.** `--properties` rather than
`--props`, `--without` rather than `-w`. A flag is typed by a model far more
often than by a person, and a model pays nothing for length while an abbreviation
costs it a guess. Terseness is a convenience for hands, and there are hardly any
here.

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
| properties will not parse | `cannot read 01997a3e-…: properties are not valid yaml` | `1` |
| bad property name | `not a property name: Valid_Until — expected a lowercase hyphenated token` | `1` |
| empty stdin | `no content on stdin — did the command before the pipe fail?` | `1` |
| bad property value | `not a property value: contains a control character — a value is a single line` | `1` |
| two values to `set` | `node <id> set takes one value — quote it if it contains spaces` | `4` |

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

**`find` is not `nodes list`.** Filtering narrows a known set; `find` would locate an
unknown one. The name is kept free for retrieval, which is a different operation
and an open question.

**No index.** Membership is computed at read time and stored nowhere. Should one
ever be built it is an accelerator that may be deleted without notice, and no
command may depend on it existing.

**No daemon, no renderer, no scores.**

**No practice anything.** No kinds, no constructor questions, no queue, no
rulings. Those belong to a practice tool composed over this surface.

---

[docs](../README.md) · [spec](README.md) · api · [storage](storage.md) · [git](git.md) · [parked](../design/parked/)
