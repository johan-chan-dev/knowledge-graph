# Declared schemas

> **Immature.** Recorded as a requirement, not as a design. What a schema would
> be *for* is unsettled, and that blocks building any of it.

Something should be able to declare what a node must contain, and the tool
should enforce what it is told. the layering argument already places the
mechanism — a rule the tool cannot decide alone becomes decidable once a
practice supplies it — and this is the shape of that.

## Two different things wear the same name

**The shape of a value.** Turning parsed YAML into a value or a list of values,
and refusing anything else. That exists today, hand-written, in
`frontmatter.ts` — eight lines that coerce a scalar and reject a nested map.

**The content of a node.** A practice declaring that a `decision` must carry a
`valid-until`, and that `kind` may only hold certain words. That does not exist
and would be the first time the tool holds a rule about what a node *means* —
which the layering argument puts in a separate program composed over this one,
not in the substrate.

The first is a parser detail. The second is a layer. Calling both *validation*
is what makes the requirement feel ready when it is not.

## What is genuinely undecided

**Which of the two is wanted**, and whether one implies the other.

**Where a schema lives.** In the tool, in a space, or in a practice's own
program. A space carrying rules it cannot enforce is the thing
the layering argument argues against; a tool carrying a practice's rules is what
the whole substrate/practice split exists to prevent.

**What enforcement means on a node that already violates it.** A schema arriving
after nodes exist either refuses them, quarantines them, or reports — and each
answer implies a different relationship between the tool and the material.

**Whether a library helps.** A validation library earns itself against a
declared schema with nested shapes and refinements. Against *there is no schema*
— any name, any single-line value — it replaces eight lines with three and
returns a nested union error whose readable half is the property name the caller
already had. That calculus changes entirely if the second reading above is the
one wanted.

## Structured values — possible, and probably the wrong shape

A schema can describe nesting, so a property could hold one:

```yaml
source:
  url: https://example.org/p
  fetched: 2026-09-01
```

It would touch four things at once. The **value rules** — single line, printable,
no control characters — describe a scalar. The **rendering** prints one `name:
value` per line, which is why a newline in a value is refused and a map has no
one-line form that is not a re-encoding. **`add` and `remove`** put values into a
list, and `add source url` means nothing. And the **reader deliberately refuses**
a nested map today, because flattening one silently is what destroyed
hand-written lists before batch 3.

**Neo4j allows no nesting either**, and that is a constraint rather than a
limitation: properties are primitives or arrays of primitives, and structure is
expressed by more nodes and more relationships. A `source` with a url and a date
is not a property — it is a node, with a relation pointing at it.

So this is a symptom of relations being parked rather than a gap in properties,
and it is the workaround that would make relations harder to add: the structure
would already be living somewhere else. The flat spelling works today and stays
queryable —

```yaml
source-url: https://example.org/p
source-fetched: 2026-09-01
```

— and is a node waiting to be extracted.

Recorded as a possibility because a schema makes it *expressible*. Not
recommended, because expressible is not the same as right.

## What would unblock it

A practice existing, so that the rules being declared are rules somebody has,
rather than rules imagined for somebody who might.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
