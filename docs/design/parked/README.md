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

| | |
|---|---|
| [lists](lists.md) | filtering a list by value |
| [search](search.md) | the body, and presence tests over properties |
| [raw](raw.md) | material nobody has judged yet, and why capture must cost nothing |
| [labels](labels.md) | why they may never be a word the tool knows |
| [partial-edits](partial-edits.md) | reading and writing part of a node, and the token that guards it |
| [structured-output](structured-output.md) | `--json`, and why nothing needs it yet |
| [comparison](comparison.md) | `>` and `--order-by`, where the operator carries the type |
| [query-language](query-language.md) | openCypher, what it would cost, and what exists |
| [validation](validation.md) | declared schemas — immature, and blocked on a practice existing |
| [lifecycle](lifecycle.md) | withdrawing a node, blocked on relations |
| [sharing](sharing.md) | knowledge travels, and edges run toward the more-shared space |
| [arguments](arguments.md) | the surface should decide the grammar, not the parser |
| [further-out](further-out.md) | relations, dependencies between spaces, integrity |

---

[docs](../../README.md) · [design](../) · parked · [spec](../../spec/) · [batches](../../batches/)
