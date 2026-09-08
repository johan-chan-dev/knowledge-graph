# Batch 2 — nodes carry properties

**Done when** you could annotate a node and find it again by its annotation.

Shipped. The commands are in [`spec/api.md`](../spec/api.md).

## What it was for

A node had a body and nothing else. Properties are the first thing that makes
the frontmatter structure rather than an empty fence, and everything a practice
will ever record about a node lives there.

## What it looks like

```console
$ kg node "$a" set kind decision
set kind

$ kg node "$b" set kind authority
$ kg node "$b" set valid-until 2027-01-01

$ kg node "$b" set kind authority
replaced kind

$ kg node "$b" --properties
kind: authority
valid-until: 2027-01-01

$ kg node "$b"
OWASP is authoritative on session handling until 2027.
kind: authority
valid-until: 2027-01-01

$ kg nodes list --where kind=decision
01a0804b-8e77-7517-a8fc-e14d530cc9a5
01a0804b-8f17-7a54-a862-c92ec3d8a03e

$ kg nodes list --where kind=decision --without valid-until
01a0804b-8e77-7517-a8fc-e14d530cc9a5
01a0804b-8f17-7a54-a862-c92ec3d8a03e
```

Annotate a node, then find it again by its annotation. **Backed by `batch 2 —
nodes carry properties`** in [`tool/tests/batches.test.ts`](../../tool/tests/batches.test.ts).

`set kind` and `replaced kind` are the same command twice — the second says the
property already existed, which is the one thing about a `set` you cannot know
in advance.

The two reads are the point. `--properties` puts them on stdout, pipeable,
without the body; reading the content puts the same lines on stderr, byte for
byte. stdout carries one half of a node or the other, never both. And the tool
has no idea what `kind` or `valid-until` mean — it compared text.

## What building it forced

**How much a filter may express.** Three predicates: equals, present, absent.
No comparison operators, no `or`, and no negated values — `--without a=1` has
two defensible readings, so it would need a rule nobody remembers, where absence
and inequality are different questions with single answers.

That boundary is a description of what is built, not a permanent one.
Comparison is a coherent addition when something needs it, and the operator can
carry the type without the storage taking a side — see
[`design/parked/comparison.md`](../design/parked/comparison.md).

**And it did not hold.** [Batch 3](3-lists.md) removes two of the three: the
bare `--where <name>` was a presence test wearing a comparison word, and
`--without` had no caller. What survives is `--where <name>=<value>`, the only
predicate that never moved while the family reversed five times around it — see
[search](../design/parked/search.md).

**Whether a value has a type.** It does not. Text in, text out, compared as
text. The serialiser quotes only what would otherwise change type coming back,
so `'42'` and `'2027-01-01'` keep their quotes while `hello world` stays bare —
and those quotes preserve that the tool was handed text rather than decide what
the text means.

**Which half of a node stdout carries.** One or the other, never both.
`--properties` swaps which; reading the content puts the same lines on stderr,
where they inform without obliging. A separate command for reading properties
would have been a third way to ask a question `kg node <id>` already answers.

**What an advisory is for.** stderr reports what the caller could not have
worked out. Counting the bytes you just sent, or the lines you were just
handed, tells you something twice — and a channel that repeats what you already
know is one you learn to stop reading, which then costs you the lines that
matter. So `set` says whether it replaced, a write says what it displaced, and
neither says how much you gave it.

## What it settled

**The tool compares strings and understands nothing.** It does not know what
`decided-by` names, only whether the text matches. That is slot discipline
applied to reading, and it is what lets a practice invent a field the substrate
has never heard of.

**A damaged node is reachable for the first time.** Filtering opens every file
where a bare listing is a directory read, so a listing skips an unparseable node
and names it on stderr while exiting `0`, and a command naming that node exits
`1`. One damaged file must not make a space unfindable; reporting is not the
same as failing.

## What it revealed, late

`write` preserves properties by splitting the file and rejoining it, and every
batch 1 test ran that path with an **empty** frontmatter block — so the preserve
step was unverified in precisely the place where a bug destroys data. Batch 2 is
the first thing that could observe it.

It also left a live defect. The reader flattens every parsed value with
`String(value)`, so a hand-written list becomes a scalar on the next unrelated
write:

```
before   labels: [auth, pattern]
$ kg node <id> set other x
after    labels: 'auth,pattern'
```

The serialiser was configured for lists a batch early and the reader never
caught up. That gap is the bug, and it is what
[batch 3](3-lists.md) fixes by construction.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [1](1-a-space-with-nodes.md) · 2 · [3](3-lists.md)
