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
| `labels` | the vocabulary |
| `label <word>` | that word |
| `link <id>` | that relation |

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

**Every command's shape is declared once**, in `tool/src/surface.ts`: which
positionals it takes, which flags are legal on it, and what it runs. Help,
dispatch and arity all read that one table, so they cannot disagree — which is
what all four of [batch 4](../batches/4-stops-guessing.md)'s argument defects
were. A flag is refused wherever the command does not declare it, rather than
accepted and ignored.

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
kg nodes list                            every id, in creation order
kg nodes find <expression>               the ids of nodes matching a condition
```

**It parses nothing.** The id is the filename, so enumerating is a directory
read — a damaged node lists like any other, and only a command naming it can
tell.

**An action, not a flag.** `list` reads the directory and parses nothing;
`find` opens and parses every node. A flag would hide a thousandfold cost behind
an option, so the difference is in the command where it is visible.

**The expression is one argument, and both it and the whole of it must be
quoted** — `>` and `<` are redirects, so `find score > 0.7` truncates a file
named `0.7` and runs a different query. Single quotes outside: double quotes let
the shell expand `$VAR`, backticks and `$( )` into the text being searched.

**A bare word is a name, a quoted string is a value**, and each operator
declares its literal — `=` and `!=` take text, `>` `<` `>=` `<=` take a bare
numeral, `in` takes a quoted value on the left and a name on the right. A
mismatch refuses before a file is opened. `not` binds tightest, then `and`, then
`or`; `and`, `or`, `not`, `in`, `has`, `is` and `no` are spent as property names.

**Presence is spelled, with the auxiliary English gives the name** — `has
tagline` / `has no tagline` for a noun, `is retired` / `is not retired` for an
adjective. Both build the same test. A name alone is refused: it would be a
proposition in one place and an operand in another with nothing on the line to
say which, as `has score and not score > 0.7` shows. `not has` and the crossed
pairs are refused too, each naming the spelling that reads.

**Absence is two-valued.** A comparison against an absent property is false and
`not` flips it, so a query and its negation always partition the space. A value
that will not take its operator's type simply does not match, which is the same
rule rather than a second one. [`absence.md`](../design/absence.md) argues the
choice.

**`--where` shipped in batch 2 and was removed in
[batch 4](../batches/4-stops-guessing.md)**, because it implemented one member
of this family while the vocabulary was still reversing, and produced a silent
wrong answer against a list. What is still parked is
[search](../design/parked/search.md): `~` over prose, the reserved operands
`body` and `created`, and ordering the results.

**No cap.** The space is the scope; one too large to enumerate is saying
something about how the material is organised, and hiding that would hide the
signal.

An empty space prints nothing and exits `0`. An empty answer is a correct
answer, and a *no nodes yet* line would land in every script that counts lines.

## node

```
kg node new                          create an empty one
kg node new --stdin                  …with content read from stdin
kg node <id>                         the content
kg node <id> --properties            the properties instead
kg node <id> write --stdin           stdin replaces the content
kg node <id> set    <name> <value>   write one property
kg node <id> unset  <name>           remove one
kg node <id> add    <name> <value>...   values into a property's list
kg node <id> remove <name> <value>...   values out of it
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

**Content is declared, not detected.** The tool reads stdin when told to and
never otherwise. `isTerminal()` answers *is something attached* rather than *is
content coming*, so an open pipe with nothing in it blocked forever.

**An empty node is legal** — one carrying the label `decision` with no prose yet is
a real thing. So the absence of `--stdin` is how you ask for one, and there is
nothing to refuse: `node new --stdin` with nothing produces exactly what `node
new` produces.

**One refusal survives, on the one call that can lose something.**

```
no content on stdin — did the command before the pipe fail?
```

`new` can only litter; `write` can destroy. A failed `cmd | kg node <id> write
--stdin` would empty a node that held prose and report success, so `write`
requires `--stdin` and refuses an empty one.

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
fix. Joining several would collide with `add`, where several values mean several
elements.

**`set`/`unset` are about the property; `add`/`remove` about its contents.** The
shape follows from the verb rather than from how many arguments arrived, so `set
x auth` is a scalar and `add x auth` is a one-element list, and neither has to
be inferred.

**`add` and `remove` refuse a scalar** — `cannot add to title: not a list`.
Promoting `auth` to `[auth, pattern]` would be the tool deciding what was meant.

**Both are idempotent, and report the effective count.** Adding one already
present changes nothing and says nothing; `add labels auth pattern` where `auth`
is already there says `added 1 to labels`. You know how many you passed — what
you could not know is how many were already there.

**`remove` taking the last element removes the key**, leaving a node
indistinguishable from one that never had the property.

**A list keeps the order it was given.** Keys sort because a mapping is
unordered by definition; a sequence is ordered by definition, so sorting one
discards what the author supplied.

**Properties are rendered as YAML.** That is what distinguishes a list from a
scalar that merely looks like one, because the serialiser quotes exactly what
would otherwise change meaning coming back:

```
count: '42'
labels: [auth, pattern]
looks: '[auth, pattern]'
```

Every rendering invented instead collided with a value that is already legal.
YAML does not, because it was designed not to — and *printing frontmatter leaks
the format* is a weak objection when the caller parses YAML natively.

**A property name is a lowercase hyphenated token** — `[a-z0-9]+(-[a-z0-9]+)*`.
Anything needing quoting or escaping is a name that will eventually be typed
wrong and fail by silently matching nothing.

**Some names are the tool's.** `set`, `unset`, `add` and `remove` refuse them:

| name | the fact it names | where that fact lives |
|---|---|---|
| `body` | the node's other half | `kg node <id>`, written with `write` |
| `created` | arithmetic on the filename | the id itself |

A property carrying either name would sit beside the fact rather than being it —
a node with a `body` property and a body has two answers to one question. The
argument for spending names this way, and the arithmetic that limits how many,
is in [`design/structure.md`](../design/structure.md).

`created` is reserved ahead of anything reading it, because a reservation is
only free before an author has used the name.

**The reservation is on writing.** A file that already carries `body:` still
reads and still lists — the reader is robustness against YAML the tool did not
write, not a second gate. **And the grammar's words are not reserved**: `and`,
`or`, `not` and `in` belong to the parser that needs them, which does not exist
yet.

**A value is a single line of printable text.** Refused: `U+0000`–`U+001F` and
`U+007F` — newline, carriage return, tab and the other control characters.
Everything else is legal, including spaces, punctuation, and `= & ? ;`, because
a URL alone needs most of them.

The restriction is about what a property is for, not about storage or output —
**a value wanting several lines is content, and content is what the body is
for.** A node has two halves precisely so that the long half has somewhere to
live.

Tab is refused for a different reason — it renders identically to spaces, so two
values that look the same would not match a filter.

**`unset` is idempotent.** Removing a property that is absent is the end state
that was asked for.

**Everything else about a node is untouched.** `set` rewrites one key; the
content and every other property survive it, and so does the reverse — `write`
replaces content and leaves properties alone.

## labels

**Classification is a slot, not a property.** `labels` is reserved: `set`,
`add`, `unset` and `remove` refuse it, and `label` / `unlabel` write it instead.
That is what makes `kg labels list` possible — a count over *whichever property
somebody chose* is not computable.

```
kg node new --with-labels auth decision   born carrying those words
kg node <id> label <word>...              carry these too
kg node <id> unlabel <word>...            stop carrying them
kg labels list                            every word, its count, its first line
kg label <word>                           what the word means here
kg label <word> write --stdin             set that description
kg label <word> forget                    drop the word from the vocabulary
```

**A word is a lowercase hyphenated token** — the rule property names follow. A
word two people must arrive at independently cannot be one that needs quoting,
and the same restriction makes it safe as a filename.

**Using a word creates it.** `label auth` ensures the vocabulary holds `auth`,
so nothing has to be declared before it can be used. Listing the words is a
directory read; the count is what costs a parse per node.

**A word outlives its last use.** When the last node drops `auth`, the word
stays with a count of `0` — the vocabulary records what has been said here, not
only what is said now. Only `forget` removes it, and forgetting the word leaves
every node still carrying it.

**`label` is both a scope and a verb**, told apart by position, as `new`,
`list` and `init` already are.

**`labels list` is tab-separated**, sorted alphabetically — which is what puts
`auth` beside `authn`, where drift is visible. The third column is the
description's **first line**; the tool takes it without reading it.

## links

**A relation is a record**, `.kg/links/<uuid>.json`, holding its type, both
endpoints and its properties once. `links` is reserved: `set`, `add`, `unset`
and `remove` refuse it, and `link` writes it.

```
kg node <id> link --as <type> --with-nodes <id>...   relate it to those nodes
kg node <id> links                                   what it points at
kg node <id> backlinks                               what points at it
kg link <id>                                         its fields and properties
kg link <id> forget                                  end the relation
kg link <id> set / unset / add / remove              its properties
```

**Both ends carry an entry**, `{type, link, direction}`, so `links` and
`backlinks` are the same node read filtered on direction — no scan, whatever the
size of the space. `type` and `direction` are duplicated from the record so that
grouping costs no record reads; the record stays authoritative.

**A record has fields and properties.** `type`, `from` and `to` are the link's
own data and cannot be set — a link's identity *is* those three, so altering one
would make it a different link. Everything else is a property obeying a node's
rules, which is why a list is built with `add` rather than by a flag inventing an
accumulation rule.

**Both ends must exist.** A link to an id that is not here is refused, `2`, the
same way `write` refuses one — a dangling edge is never written.

**`forget` ends the relation**: the record is deleted and both ends drop it. A
label outlives its last use because vocabulary records what has been said; a
link is the relationship itself.

**One command may make several links.** `--with-nodes <id>...` makes one per
target, each with the same type and properties, and prints their ids in order.

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
| `nodes list` | one id per line | — |
| `nodes find` | the matching ids, one per line | `3 nodes could not be read` *(only when some did not)* |
| `node new` | the new id | — |
| `node <id>` | the content, byte for byte | its properties, rendered |
| `node <id> --properties` | one `name: value` per line | — |
| `node <id> write` | — | `replaced 210 bytes` |
| `node <id> set` | — | `set title`, or `replaced title` |
| `node <id> unset` | — | `unset title`, or `title was not set` |
| `node <id> add` | — | `added 1 to labels`, or nothing if nothing changed |
| `node <id> remove` | — | `removed 1 from labels`, or `…, labels is now unset` |
| `node <id> label` | — | `labelled 1`, or nothing if nothing changed |
| `node <id> unlabel` | — | `unlabelled 1`, or nothing if nothing changed |
| `label <word>` | the description | — |
| `label <word> write` | — | `wrote 64 bytes` |
| `label <word> forget` | — | `forgot auth` |
| `labels list` | word, count, first line — tab-separated | — |
| `node <id> link` | the new link ids, one per line | — |
| `node <id> links` / `backlinks` | type, link id, the other end — tab-separated | — |
| `link <id>` | `type`, `from`, `to`, then one property per row | — |
| `link <id> forget` | — | `forgot <id>` |
| `link <id> set` / `unset` / `add` / `remove` | — | as `node <id>`'s |

**A closed set of names tabulates; an open one does not.** Columns work where
the tool knows the names in advance and every row carries all of them — type,
link id and the other end for `links`; word, count and first line for `labels
list`. Property names are authored, differ per node and may be missing, so a
grid over them needs a cell for a node carrying none, and that cell has nothing
legitimate to hold: the empty string is a legal value, so an absent property and
`title: ""` would render identically.

**Nothing about writing enters this.** A column works because its name is known
ahead of time, not because its value is fixed — none of `labels list`'s three is
fixed, and all three tabulate.

**A targeted write prints nothing.** Only `new` returns an id, because only
there is the id new information; echoing back one the caller just supplied is
noise. Exit `0` says it worked, the way `git add` does.

**What a write reports is what changed, not what you asked for.** `replaced 210
bytes` carries the size you displaced; `replaced title` says the property already
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

**A failure names its kind, never a path.** A write that cannot land reports
`permission denied` or `already exists` — the runtime's own message carries the
offending file, including the temporary one, which is an implementation detail
this tool does not emit. And a consumer closing a pipe early is not an error at
all: it exits `0`.

**Names are long, because the caller is an agent.** `--properties` rather than
`--props`, and `--contain-properties` over `--cp` when it arrives. A flag is typed by a model far more
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
| a property the tool could not write | `cannot read 01997a3e-…: Kind is not a property name` | `1` |
| a value the tool could not write | `cannot read 01997a3e-…: a holds a value with a control character` | `1` |
| properties will not read | `cannot read 01997a3e-…: labels is an empty list` | `1` |
| bad property name | `not a property name: Valid_Until — expected a lowercase hyphenated token` | `1` |
| empty stdin | `no content on stdin — did the command before the pipe fail?` | `1` |
| bad property value | `not a property value: contains a control character — a value is a single line` | `1` |
| `add`/`remove` on a scalar | `cannot add to title: not a list` | `1` |
| `--properties` off `node <id>` | `--properties belongs to \`kg node <id>\`` | `4` |
| `write` without a source | `node <id> write needs --stdin — that is where the content comes from` | `4` |
| empty stdin on `write` | `no content on stdin — did the command before the pipe fail?` | `1` |
| a write that cannot land | `cannot write <id>: permission denied` | `1` |
| two values to `set` | `node <id> set takes one value — quote it if it contains spaces` | `4` |
| too few arguments | `node <id> set needs a name and a value` | `4` |
| a reserved name | ``body is reserved — it is the node's content, written with `write` `` | `1` |
| an unknown action | `node <id> takes one action: write, set, unset, add, remove` | `4` |
| an unknown scope | `unknown scope: nodez` | `4` |

**The absent message names the space**, because *wrong space* is one of the two
real causes and the caller cannot see which from the id alone.

Style: lowercase, no trailing period, `—` before a hint, a remedy where one
exists and none where fixing the argument is self-evident, and **never a
filesystem location except the space's own root**.

**The full help follows a message only when the caller named something that does
not exist** — an unknown scope or action, where the answer is the list of what
does. An arity or flag message already names the form it is about, so printing
twelve more would bury it.

## Deliberately absent

**No way to ask where a node is.** A location would be an invitation to act on
it, and every act on a node is a command. It would also nail the layout into the
contract.

**No query language.** Expressive enough for the hardest view is a larger thing
than the practices it would serve.

**No index.** Membership is computed at read time and stored nowhere. Should one
ever be built it is an accelerator that may be deleted without notice, and no
command may depend on it existing.

**No daemon, no renderer, no scores.**

**No practice anything.** No kinds, no constructor questions, no queue, no
rulings. Those belong to a practice tool composed over this surface.

---

[docs](../README.md) · [spec](README.md) · api · [storage](storage.md) · [git](git.md) · [parked](../design/parked/)
