# Reaching a node's neighbours in one call

> **Shipped, then made unnecessary.** `kg node <id> links` and
> `kg node <id> backlinks` were built by
> [batch 7](../../batches/7-relations.md) and removed by
> [batch 11](../../batches/11-resolution.md) — not parked until the foundation
> settles, but emptied by it.

## What they did

A node's frontmatter carried, for each relation, `{type, link, direction}`,
where `link` is the **record's** uuid. The node at the other end was in the
record, so the two commands read one record per relation and printed the far
end as a third column — a join, done inside one process.

```
kg node <id> --properties     type, direction, the record's uuid
kg link <id>                  type, from, to — the far end was only here
```

## What emptied them

The entry gains a fourth field. `neighbour` is the node at the other end, and it
is in the node's own file:

```yaml
links:
  - type: directed
    link: 01a090ed-513c-…
    direction: in
    neighbour: 01a090ed-1ee8-…
```

**There is no join left.** What the commands did is now a filter over a
property, which `jq` does — and does better, since a named field beats a line
prefix and the direction is reachable where the columns never exposed it:

```bash
kg node "$CA" --properties --json \
  | jq -r '.links[] | select(.type == "directed" and .direction == "in") | .neighbour'
```

So nothing is lost in capability, and no question of the guide's goes back to a
loop. A pipeline is one `jq` longer than it was.

## What is left of them, and what would bring it back

A convenience: one command instead of a filter someone writes. That is a real
thing to want, and it is not a reason to ship — a shortcut earns itself against
a caller who keeps writing the same filter, and nobody has yet.

**Spelling, if it returns.** Not as an action. `links` and `backlinks` were
actions while `--properties` was a flag, and all three answer *which view of
this node*. [`spec/api.md`](../../spec/api.md) puts reading a resource as
implicit and the aspect as a selector, so `kg node <id> --links`, or nothing.

**And it would be a selector over the same property**, not a join — which is a
much smaller thing to add than what was removed, and the reason removing it
costs so little.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
