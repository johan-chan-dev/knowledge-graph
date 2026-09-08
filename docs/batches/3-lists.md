# Batch 3 — a property can hold a list

**Done when** a property can carry several values, you can add and remove them
one at a time, and find nodes by what a list contains.

Planned. The shape is
[`design/parked/lists.md`](../design/parked/lists.md); this is what building it
has to answer.

## What it should look like

Not built. This is the target, and the test that has to pass for it to be done.

```console
$ kg node "$a" add labels auth pattern
added 2 to labels

$ kg node "$a" --properties
kind: decision
labels: auth, pattern
2 properties

$ kg nodes list --contains labels auth
01a0801d-42fa-7ea4-9025-b693306f23fb

$ kg node "$a" remove labels auth
removed 1 from labels

$ kg node "$a" remove labels pattern
removed 1 from labels, labels is now unset
```

And the refusals, which are half of what this batch decides:

```console
$ kg node "$a" set kind decision
$ kg node "$a" add kind authority
cannot add to kind: not a list

$ kg nodes list --where labels=auth
cannot filter labels with --where: it holds a list — use --contains

$ kg node "$a" set note "$(printf 'one\ntwo')"
not a property value: contains a control character — a value is a single line
```

**Done when** `batch 3 — a property can hold a list` passes in
[`tool/tests/batches.test.ts`](../../tool/tests/batches.test.ts), alongside the two
batches before it.

## Why this and not partial edits

Both were ready. Three reviews split two to one for lists, and the deciding
argument was neither's headline.

**A dependency that was already written down.** Reading part of a node hands
back a content hash to guard the write that follows, and that hash was specified
to arrive via `--json` — which
[`structured-output.md`](../design/parked/structured-output.md) says waits until
a value can nest, which is what *this* batch creates. So partial edits in batch
3 would either drag `--json` in on a justification its own entry calls false, or
ship a required flag with no sanctioned source for its value.

Putting the hash on stderr looked like an escape until it met the rule it
breaks: stderr is about the operation, which is what makes it safe to discard.
A hash a write requires is part of the answer, and stderr that is load-bearing
can never carry a warning again.

**And there is an active bug.** An unrelated `set` destroys a hand-written list
on disk — see [batch 2](2-properties.md). Lists fix it by construction, because
they force the reader's value type to widen, which is the only change that makes
it stop lying. Patching it alone would mean doing this batch's type change
without this batch's commands.

## What it has to answer

**How a value's shape follows from the verb, not the argument count.**
`set`/`unset` are about the property; `add`/`remove` are about its contents. So
one value passed to `set` is a scalar and one passed to `add` is a
single-element list, and neither has to be inferred.

**What `add` does to a scalar.** Refuses. Promoting `auth` to `[auth, pattern]`
would be the tool deciding what was meant.

**What a filter does when it meets the wrong shape.** `--where <name>=<value>`
against a list refuses rather than matching nothing — silently matching nothing
is the failure [`design/vocabulary.md`](../design/vocabulary.md) exists to
prevent.

**What a value may contain.** A single line of printable text: no newline, no
carriage return, no tab, no other control character. Everything else is legal,
because a URL alone needs `=`, `&`, `?` and sometimes `;`. The constraint comes
from the output contract — properties render one per line — and from the fact
that a value wanting several lines is content, and content is the body.

**How a filter takes several values without a delimiter.** Positionally. Any
separator collides with data the tool does not control, and needing a flag to
override the separator is the proof that the separator was wrong.

## What it decides beyond itself

**The substrate validates no property's values.** A rule scoped to one key's
values does not survive a change of subject, and that test only ever subtracts.
A practice declares a shape and the tool enforces what it is told — which is why
a label may never be a word the tool knows. See
[`design/parked/labels.md`](../design/parked/labels.md).

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · 3
