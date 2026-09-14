# Git

A space needs a repository. `space init` finds the root with `rev-parse
--show-toplevel`, and runs `git init` when there is none — a space without a
repository has no history, and several rules lean on a space having an
unambiguous prior state.

**The external binary, resolved from `PATH`, and nothing else.**

## The tool never commits

`space init` runs `git init` where there is no repository, and nothing after
that touches git. Every write lands in the working tree; **committing is the
caller's**, done when they want a checkpoint and not before.

That is the same rule as the binary itself, one step further: git is the user's,
so the history is theirs too. An automatic commit would decide for them what
counts as a unit of work, and a knowledge graph edited over an afternoon has no
obvious one.

**What follows, and should be read rather than discovered:**

- `git diff` is what shows a write, and `git status` what shows a batch of them
- an accidental write is undone by `git checkout`, and only if the space was
  committed beforehand — a bulk write over many nodes is as recoverable as the
  caller's own discipline makes it
- the tool reads the branch, and nothing else about the history

## No bundled git

A packaged application could ship one — that is what GitHub Desktop does — but
it would be the wrong git to use. The user's own is the one holding their
credentials, their helpers and their SSH agent, which is what cloning a private
space needs. A bundled git launched with a scrubbed environment fails at
precisely the operation that matters, and fails with an authentication error
rather than an obvious one.

If a distributor ever supplies one it belongs *below* `PATH`, as a last resort,
never above it as an override.

## No embedded git

An embedded implementation would substitute an undiagnosable failure for a
diagnosable one: instead of `init` refusing plainly, a later clone would fail for
reasons the user cannot see, because it does no SSH and diverges on credentials.

That is the whole argument. It does not rest on avoiding a dependency.

**One resolution path, one failure.** There is no search order to maintain.

## When it is missing

Not a dead end. This tool is used by a developer, who has git, or through an
agent, which can install it — so the refusal is written to be acted on rather
than merely reported:

```
git is not installed, and a space needs a repository.
  macOS    xcode-select --install
  Windows  winget install Git.Git
  Linux    your package manager, e.g. apt install git
```

That message is the interface. `Deno.Command().output()` **throws** when the
binary is absent rather than returning a code, so without catching it the tool
dies with a stack trace — the one form of failure an agent reads worst, because
it looks like a defect in the tool rather than a missing dependency.

## Prevention belongs to the installer

A packaged application should check for git at install time and offer to install
it. That keeps one git on the machine — the user's — and adds nothing here.

---

[docs](../README.md) · [spec](README.md) · [api](api.md) · [storage](storage.md) · git
