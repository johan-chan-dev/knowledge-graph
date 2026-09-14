# Parked

Argued, and not settled enough to build.

**A specification presupposes a settled design.** If something is parked, its
design is by definition not finished — so it cannot be specified, and it does
not belong beside [`spec/`](../../spec/), which describes only what the binary
in front of you does.

Each of these has a shape, a reason, and no caller yet. Something leaves this
directory in one direction and by one trigger: **it gets built**, at which point
its rules move to the spec and its durable argument, if it has one, moves up to
[`design/`](../).

## Parked is not the same as unanswered

**Read here before writing that a question is open.** A page can be parked for
want of a caller while having settled a good deal along the way, and those
answers are binding on whatever batch eventually arrives.

[Batch 9](../../batches/9-find.md) declared itself blocked on *what does `>` do
against a value that is not a number* and scoped itself around the blockage.
[comparison](comparison.md) had answered it: **a value that is not numeric
simply does not match.** Thirty lines, same repository, never consulted — the
batch re-derived the question from first principles and reached *unresolved*.

This directory has a rule for leaving and had none for being consulted. The
trigger that empties a page is a batch; so is the moment to read it.

| | |
|---|---|
| [search](search.md) | the body, and presence tests over properties |
| [presence](presence.md) | how a presence test is spelled — two roads, one prototyped and reverted |
| [neighbours](neighbours.md) | reaching a node's neighbours in one call — shipped, then parked |
| [raw](raw.md) | material nobody has judged yet, and why capture must cost nothing |
| [partial-edits](partial-edits.md) | reading and writing part of a node, and the token that guards it |
| [structured-output](structured-output.md) | `--json`, and why nothing needs it yet |
| [comparison](comparison.md) | ordering; comparison itself is batch 9's, and settled here |
| [query-language](query-language.md) | openCypher, what it would cost, and what exists |
| [validation](validation.md) | declared schemas — immature, and blocked on a practice existing |
| [lifecycle](lifecycle.md) | withdrawing a node — unblocked since batch 7, undecided |
| [sharing](sharing.md) | knowledge travels, and edges run toward the more-shared space |
| [further-out](further-out.md) | dependencies between spaces, integrity, policy |

---

[docs](../../README.md) · [design](../) · parked · [spec](../../spec/) · [batches](../../batches/)
