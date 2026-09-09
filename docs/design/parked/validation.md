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

## What would unblock it

A practice existing, so that the rules being declared are rules somebody has,
rather than rules imagined for somebody who might.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
