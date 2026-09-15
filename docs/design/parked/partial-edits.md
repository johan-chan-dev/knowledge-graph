# Editing part of a node

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

**The read that gives you line numbers gives you the hash.** Structured output returns
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

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
