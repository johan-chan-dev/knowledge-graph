# Git

A space needs a repository. `space init` finds the root with `rev-parse
--show-toplevel`, and runs `git init` when there is none — a space without a
repository has no history, and several rules lean on a space having an
unambiguous prior state.

**The external binary, resolved from `PATH`, and nothing else.**

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

A JavaScript implementation would be the tool's first third-party dependency,
and it would substitute a diagnosable failure for an undiagnosable one: instead
of `init` refusing plainly, a later clone would fail for reasons the user cannot
see, because the embedded git does no SSH and diverges on credentials.

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
