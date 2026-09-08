# Batch 1 — a space, and nodes in it

**Done when** you could make a space, put material in it, find it again and read
it back, with no file opened by hand.

Shipped. The commands are in [`spec/api.md`](../spec/api.md).

## What it was for

A space had to exist before anything else could be argued about. Everything
after this batch — properties, lists, relations — presumes a place to put a node
and a way to name one.

## What it looks like

```console
$ kg space init
notes
  root     /Users/you/notes
  branch   (no commit yet)
  nodes    0
initialised a git repository at /Users/you/notes

$ id=$(kg node new <<'EOF')
> Modules own their schema. A shared one couples every module to every
> other module's release.
> EOF
01a0804b-38b7-751c-9847-ad2a253cc25f

$ kg node "$id"
Modules own their schema. A shared one couples every module to every
other module's release.

$ kg nodes list
01a0804b-38b7-751c-9847-ad2a253cc25f

$ printf 'Modules own their schema.\n' | kg node "$id" write
replaced 93 bytes

$ kg space
notes
  root     /Users/you/notes
  branch   (no commit yet)
  nodes    1
```

Make a space, put material in it, find it again, read it back, replace it —
and no file was opened by hand. **Backed by `batch 1 — a space, and nodes in
it`** in [`tool/tests/kg.test.ts`](../../tool/tests/kg.test.ts): if the surface
moves, that test fails before this page goes stale.

Two things to notice. `kg node new` prints only the id, because the id is the
only thing you could not have worked out — you sent the bytes yourself. And the
replace prints nothing at all on stdout, saying only what it displaced.

## What building it forced

**Where a space is, exactly.** `.kg/` at the root of the repository containing
the working directory: no walk upward, no search order. `init` and every later
command run the identical resolution, so they cannot disagree about which space
is in play — and `-C` moves the working directory rather than selecting a space,
because the tool cannot find spaces by name and should not appear to.

**That the tool needs git, and how to fail when it is absent.** No bundled git,
no embedded git, resolved from `PATH` and nothing else — see
[`spec/git.md`](../spec/git.md). The user's own git is the one holding their
credentials, which is what cloning a private space needs.

**That an empty stdin is ambiguous.** `cmd | kg node new` where `cmd` failed and
`kg node new </dev/null` are byte-identical requests meaning opposite things,
and the shell erases the difference before the tool sees it. Refusing and asking
which was meant beat guessing, and it matters most on a replace, where accepting
turns a silent upstream failure into content destroyed and reported as success.

**Which stream carries what.** stdout is the answer, stderr is everything else —
so a node's content pipes byte for byte while still reporting its size, and
asking for help succeeds on stdout where help shown *because* a call was wrong
goes to stderr with the refusal.

## What it settled

**Refused and absent are different exits.** A string that is not a uuid was
never a filename the tool could have minted, so it did not look and find
nothing. A well-formed id that is not here may have been removed, or this may be
the wrong space. A caller acts differently on each, so the codes differ.

**A creation time is read out of the id, never stored.** A `created:` field
would be a second copy of a number already in the filename, free to drift.

**Any uuid is well formed, not only the v7 the tool mints.** A v4 is a plausible
id this tool never issued, which makes it honestly absent rather than refused —
and checking for v7 would tie the validator to a minting scheme that is
deliberately free to change.

## What it removed on the way

The surface arrived with a `path` scope: `new` returned a location and whoever
owned the reasoning wrote prose there. That made every read and write the
caller's business, and a location handed out does not stay a computed
intermediate — it gets stored, and becomes a reference by location, which
[`design/location.md`](../design/location.md) forbids. Removing it is what
forced the tool to own writing, which is why `node new` takes content on stdin.

A `body` scope went the same way, for a reason worth keeping: it named the half
of a markdown file after the frontmatter, which is a storage word in a surface
that had just finished removing storage from the contract.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · 1 · [2](2-properties.md) · [3](3-lists.md)
