# Parked

Decided, argued, and not built. Each of these has a settled shape; none of it is
exercised by anything that exists, so it waits rather than shipping ahead of a
use. [`api.md`](api.md) is what the tool actually offers.

## Partial reads

```
kg node <id> read --lines A-B        a slice
kg node <id> read --number           line numbers in the margin
```

stderr becomes `lines 40-60 of 128` — which is how a caller knows where it is in
a document and whether another read is needed.

`--number` exists because a ranged write needs line numbers and counting them by
hand is where an off-by-one comes from.

## Partial writes, and the token that guards them

```
kg node <id> append                               at the end
kg node <id> replace --lines A-B --expect <hash>   a slice
```

**An operation that depends on positions must say what it expects.** Line
numbers mean nothing without the state they were computed against, so `--expect`
carries a hash of the content as it was read, and a mismatch refuses before
writing.

| | `--expect` | can it half-destroy something |
|---|---|---|
| `write` (no id) | n/a | no — nothing existed |
| `write <id>` | optional | no — you meant to replace it all |
| `append` | not accepted | no — nothing above can move |
| `replace --lines` | **required** | yes, and silently |

`replace` is a verb rather than `write --lines` because a verb whose meaning is
a function of flag combinations is where a surface starts needing a table to
read — and because the ranged form is the only one that can corrupt a node by
being slightly wrong.

**The read that gives you line numbers gives you the hash.** `--json` returns
the content with it, so a ranged read and a ranged write share one coordinate
system, verified by one token.

**Every write returns the new hash.** That is what makes a sequence of ranged
writes work: apply them **bottom-to-top**, descending start line, so no edit
shifts the target of a later one, and chain each call's returned hash into the
next `--expect`. Line numbers stay valid because nothing above them moved; the
write stays guarded because the token was never guessed.

**No unified diff.** Ranges plus a whole-content hash validate more strictly —
any change anywhere refuses, not just one near the edit — and need no `git
apply`, no fuzz semantics, and no partial-application state.

## Structured output

```
kg <anything> --json
```

**Format, never a selector.** Same content, structured — the stderr advisories
stay prose under it, since they are confirmations rather than answers and moving
them into the object would make the flag select.

```
space  →  { "name": …, "root": …, "branch": …, "nodes": 47 }
nodes  →  [ { "id": …, "created": … }, … ]
node   →  { "id": …, "content": … }
write  →  { "id": … }
```

`created` is read out of a v7 id's first 48 bits and is `null` for an id the
tool never minted — which is a broken space, detected properly in a later batch.

**It waits because nothing needs it yet.** Ids one per line and a bare id are
already parseable; the readout is four fixed fields; and wrapping a node's
content in an escaped string is strictly worse than handing it over byte for
byte. JSON earns its place when a value can contain a newline or a shape nests,
and neither is true until labels arrive.

## Properties that hold a list

```
kg node <id> add    <name> <value>...      elements into its list
kg node <id> remove <name> <value>...      elements out of it
kg nodes list --contains <name>=<value>    the list includes it
```

**`set`/`unset` are about the property; `add`/`remove` are about its contents.**
The shape follows from the verb rather than from how many values were passed, so
`set labels auth` is a scalar and `add labels auth` is a one-element list — the
same principle as a flag's name stating its arity.

**`add` on a property that is a scalar refuses** — `cannot add to labels: not a
list`. Promoting `auth` to `[auth, pattern]` silently would be the tool deciding
what was meant.

**`remove` taking the last element removes the key**, leaving exactly what a node
that never had it looks like. A property emptied must be indistinguishable from
one never set; `labels: []` would be a residue of history.

**Filtering a list needs its own predicate.** `--where labels=auth` would have to
mean *equals* for a scalar and *contains* for a list — one operator, two
meanings. `--contains` says what it does.

## Labels

**Labels may not need to be a word the tool knows.** A label is a property named
`labels` whose value is a list, and every operation labels wanted falls out of
lists: `labels add auth` is `add labels auth`, `--with-label auth` is `--contains
labels=auth`, and removing the last one removing the key is the list rule.

What remains that is genuinely *about labels* is the token shape on their
**values** — `[a-z0-9]+(-[a-z0-9]+)*`, so a word two people must arrive at
independently cannot need quoting. Whether the substrate enforces that, or a
practice does, is the open question: a tool that validates `labels` specially
knows the word `labels`, which is the thing slot discipline says it should not.

A vocabulary view — every label in use across the space, with counts — is the
other piece, and it waits on the same answer.

## Node lifecycle beyond creation

`node remove` and `node retire` both wait on the same unanswered question:
whether withdrawing a node is deletion or a tombstone. The argument that an
identity is never withdrawn rests on relations, and relations do not exist yet —
so deletion is honest while nothing can reference a node, and becomes wrong the
moment they do. Building it now means building it twice.

## Further out

Relations. Dependencies between spaces — `mount`, `unmount`, `obtain`, and the
manifest that declares them. Integrity checking. Whatever policy decides which
properties are legitimate — a practice-blind tool cannot know a field is a
forgery, and the guard for that lives above this layer.
