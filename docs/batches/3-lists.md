# Batch 3 — a property can hold a list

**Done when** a property can carry several values, and you can add and remove
them one at a time.

Shipped. The commands are in [`spec/api.md`](../spec/api.md).

## What it looks like

The example property is `sources` rather than `labels`, which
[batch 6](6-labels.md) took: classification is a slot the tool knows about, so
the name is no longer an author's to use. Nothing else about this batch changed.

```console
$ kg node "$a" add sources github-issue-412 rfc-7396
added 2 to sources

$ kg node "$a" add sources rfc-7396

$ kg node "$a" --properties
kind: decision
sources: [github-issue-412, rfc-7396]

$ kg node "$a" remove sources rfc-7396
removed 1 from sources

$ kg node "$a" remove sources github-issue-412
removed 1 from sources, sources is now unset
```

The second `add` says nothing: `auth` was already there, so nothing changed and
there is nothing the caller could not have worked out. The counts are the
**effective** ones for the same reason.

And the refusals, which are half of what this batch decides:

```console
$ kg node "$a" add kind authority
cannot add to kind: not a list

$ kg nodes list --where valid-until
--where needs a comparison — use --where <name>=<value>

$ kg node "$a" set note "$(printf 'one\ntwo')"
not a property value: contains a control character — a value is a single line
```

**Backed by** `batch 3 — a property can hold a list` in
[`tool/tests/batches/3_test.ts`](../../tool/tests/batches/3_test.ts), alongside the
two batches before it.

## What building it forced

**Separating what a node file *is* from where it lives.**
[`frontmatter.ts`](../../tool/src/frontmatter.ts) is pure — the fence, the value
rules, the YAML round-trip — and `node.ts` is the I/O over it. Widening a value
to hold a list is the change that made the split worth doing, because every case
it introduces is cheap to reach with a string and expensive to reach through a
filesystem and a command line. Nine unit tests, seven milliseconds.

**That replacing content has to read the properties.** `write` preserves them,
so a block that will not read is a block it cannot safely write back — a failure
mode that did not exist while the reader could flatten anything into a string.

## What it adds

| | |
|---|---|
| `kg node <id> add <name> <value>...` | values into a property's list |
| `kg node <id> remove <name> <value>...` | values out of it |

## What it changes

**`--properties` emits YAML.** A list and a scalar that merely looks like one
are then distinguishable, because the serialiser quotes exactly what would
otherwise change meaning:

```
bracketed: '[auth, pattern]'      a scalar
sources: [github-issue-412, rfc-7396]   a list
single: [auth]                    a one-element list, not `single: auth`
```

Every rendering invented instead of this one was ambiguous against a value that
is already legal today. YAML is not, because it was designed not to be — and
*printing frontmatter leaks the format* is a weak objection when the caller
parses YAML natively. Emitting YAML is a choice about output, not a claim about
storage.

**A property value is a single line of printable text**, and so is each element
of a list. No control characters. The constraint is the output contract's:
properties render one per line, and a value wanting several lines is content,
which is what the body is for.

## What it removes

This is the first batch to take shipped surface away.

| | |
|---|---|
| `--where <name>` bare | two questions sharing a name — presence is not comparison |
| `--without <name>` | never asked for, no caller |

Both are batch-2 corrections, landing here because batch 3 is what exposed them.
`--where` now always carries a comparison, and there is no absence test until
something wants one — it returns as `--without-properties` in
[search](../design/parked/search.md).

Nothing outside this repository uses `kg`, so a wrong flag is cheaper to delete
than to carry. That window closes when the plugin ships on top of the tool,
which is the argument for the filters churning now rather than then.

## What it deliberately does not do

**A list still cannot be filtered by value.** `--where sources=auth` refuses; the
question *which nodes carry auth* has no answer in this batch.

That is not an oversight, it is the lesson of the sitting that designed it. The
filter vocabulary reversed five times in an hour — `--contains` invented, given
`-any` and `-all`, then reclaimed for the body; `--with` invented and dissolved;
`--where` losing its bare form; `--without` parked. A design moving that fast is
being discovered rather than refined, so the parts that never moved are the
parts that ship. See [lists](../design/parked/lists.md) and
[search](../design/parked/search.md).

## Why this and not partial edits

Three reviews split two to one for lists, and the deciding argument was
structural. Reading part of a node hands back a content hash to guard the write
that follows, and that hash was specified to arrive via `--json` — which
[structured-output](../design/parked/structured-output.md) says waits until a
value can nest, which is what *this* batch creates. So partial edits in batch 3
would ship a required flag with no sanctioned source for its value.

Putting the hash on stderr looked like an escape until it met the rule it
breaks: stderr is about the operation, which is what makes it safe to discard.
A hash a write requires is part of the answer, and stderr that is load-bearing
can never carry a warning again.

## What it has to answer

**How the shape follows from the verb, not the argument count.** `set`/`unset`
are about the property, `add`/`remove` about its contents — so one value passed
to `set` is a scalar and one passed to `add` is a single-element list, and
neither has to be inferred.

**What `add` does to a scalar.** Refuses. Promoting `auth` to `[auth, pattern]`
would be the tool deciding what was meant.

**Whether elements keep insertion order.** Keys sort because a mapping is
unordered by definition; a sequence is ordered by definition, so sorting one
discards what the author supplied. Insertion order stands.

**What a nested structure does.** A map or a list of lists inside a property has
no meaning here and cannot round-trip — the block is refused, naming the
property at fault.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · [2](2-properties.md) · 3
