# Parked

Decided, argued, and not built. Each of these has a settled shape; none of it is
exercised by anything that exists, so it waits rather than shipping ahead of a
use. [`api.md`](api.md) is what the tool actually offers.

## Partial reads

```
kg node <id> --lines A-B        a slice
kg node <id> --number           line numbers in the margin
```

stderr becomes `lines 40-60 of 128` — which is how a caller knows where it is in
a document and whether another read is needed.

`--number` exists because a ranged write needs line numbers and counting them by
hand is where an off-by-one comes from.

## Partial writes, and the token that guards them

```
kg node append   <id>                               at the end
kg node replace  <id> --lines A-B --expect <hash>   a slice
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

## Labels

```
kg labels <id>...                    read
kg labels add    <id> <name>...      add
kg labels remove <id> <name>...      remove
```

A label is a **lowercase hyphenated token** — `[a-z0-9]+(-[a-z0-9]+)*`. The tool
validates the shape and never the meaning.

**Labels are the only classification the tool has.** A node's nature, a
practice's kinds, ordinary grouping — all of it is labels, and the tool
understands none of the values. There is no node type, no classifying directory,
and no `is_x: true`, which would be a label wearing a property's clothes since
nobody ever writes `is_x: false`.

**Idempotent.** Adding one already present, or removing one absent, is the end
state that was asked for.

**Removing the last label removes the key**, leaving exactly what `node write`
writes with no labels. A node that once had labels must be indistinguishable
from one that never did; `labels: []` would be a residue of history.

## Filtering the collection

```
kg nodes --with-label     <name>           carries it              (exactly one)
kg nodes --with-labels    <name>...        carries all of them
kg nodes --without-label  <name>
kg nodes --without-labels <name>...        carries none of them
```

**Filtering opens every file**, where bare `nodes` is a directory read — so this
is where the reader first runs over a whole space.

**Names are positional after the flag**, never a flag value. That works only
because `nodes` has no positional argument of its own, so everything up to the
next flag is a name.

**A flag's name states its arity.** `--with-label` takes exactly one and refuses
a second, naming the flag that was wanted. Violating a name is a usage error
rather than a quiet success. Giving both spellings at once is refused too —
there is no sensible reading to pick between.

## Node lifecycle beyond creation

`node remove` and `node retire` both wait on the same unanswered question:
whether withdrawing a node is deletion or a tombstone. The argument that an
identity is never withdrawn rests on relations, and relations do not exist yet —
so deletion is honest while nothing can reference a node, and becomes wrong the
moment they do. Building it now means building it twice.

## Further out

Relations. Dependencies between spaces — `mount`, `unmount`, `obtain`, and the
manifest that declares them. Integrity checking. Arbitrary frontmatter fields
(`set` / `unset`) and whatever policy decides which are legitimate.
