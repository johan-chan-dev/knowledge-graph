# Labels

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

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
