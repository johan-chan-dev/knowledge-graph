# A property is absent, and that is all it means

There is exactly one way for a node not to carry something: the key is not
there. No null, no empty marker, no second kind of nothing. This argues why one
is the right number, and why the tool cannot have more even if it wanted them.

## Two words at two levels

*Undefined* and *unknown* sound like the same fact stated with different
confidence. They are not the same kind of fact at all.

| level | the claim | who can make it |
|---|---|---|
| instance | the key is not in this file | the tool, by looking |
| schema | the key **should** be here and is not | only something that declared it should |

The second is not a vaguer version of the first. It is a claim about a *slot*,
and a slot has to be declared before anything can be said about its emptiness.

SQL can say *unknown* because it has a schema: every row carries every column by
declaration, so a `NULL` cell is a slot that exists holding a value nobody
knows. That is two facts in tension — the schema promises the slot, the data
leaves it empty — and three-valued logic is the machinery for carrying both
through a comparison. Propagation is honest there. It preserves a tension that
genuinely exists.

**This layer declares no slots.** A node carries the properties it carries.
There is no prior promise for an absence to be in tension with, so there is
nothing for a third truth value to hold. Two-valued absence is not a
simplification chosen here; it is what is left when there is no schema to
anchor a richer one.

## What JavaScript got wrong, and it is not having two

JavaScript has two absences, split on *who caused it*: `undefined` is the system
saying nothing is here, `null` is the author saying it. The axis is
documentary — and no operator derives anything from it:

| | `null` | `undefined` |
|---|---|---|
| `>= 0` | **true** | false |
| default parameter | passes through | takes the default |
| `JSON.stringify` | kept | dropped |
| `??` · `?.` · `==` | *identical* | *identical* |

Half the language treats them as one thing and half as two, and the half that
separates them does so on no principle: `null >= 0` is true because `null`
coerces to zero, which has nothing to do with who wrote it.

So the failure is not the count. It is splitting absence along an axis with no
logical consequence, while lacking the one that has consequences. A schema is
what makes a single absence sufficient — with a declared slot, *who left it
empty* carries no information, which is why SQL needs no second marker and
happily lets an author write `NULL` directly. Without that anchor, JavaScript
reached for intent as a substitute, and intent does not propagate.

Read as a translation: SQL's `NULL` is `undefined` **plus a schema**. Take the
schema away and the second half evaporates.

| | schema layer | absences | what anchors absence |
|---|---|---|---|
| SQL | in the engine | 1 | the declared slot |
| JavaScript | none | 2 | intent — anchors nothing |
| here | none *in the substrate* | 1 | a practice, above this layer |

This tool is structurally in JavaScript's position and takes SQL's answer, by
refusing to let absence mean anything locally.

## Nothing-as-a-value stays expressible

The refusal is of a second *absence*, never of the intent behind one:

```
kind: null   refused    an author may not write an absence
kind: ~      refused    nor spell one differently
kind:        refused    nor by leaving it blank
kind: ""     accepted   an author may write nothing as a value
```

An empty string is a value. It compares, sorts and matches like every other
value, and a query asking for it gets a straight answer. What it never becomes
is a hole that comparison has to route around — which is the whole difference,
and why the line sits here rather than one step earlier.

## Where the missing level actually lives

A practice supplies what the substrate will not. *Every decision carries a
`valid-until`* is a schema claim, and a practice can look for its violations by
narrowing first — asking for decisions, then for the ones lacking the key. The
substrate answers both halves without learning why either matters.

**But that is detection, not a schema.** Such a question is evaluated after
resolution, node by node, against whatever exists at that moment. The
universally quantified claim is nowhere: not stored, not checked for coherence,
and not applied to a node written a minute later. It lives only in whoever
asked. Where a generalisation could be held is the open question in
[parked/validation.md](parked/validation.md), and this is the sharpest statement
of what is missing from it.

The consequence for the tool is small and worth naming: **absence is decided by
looking, never by inference.** An evaluator that writes a comparison the natural
way inherits the host language's answer — and in JavaScript `undefined > 0` and
`undefined <= 0` are both false, which is the right result reached for the wrong
reason. Presence is checked because it is a fact, not because a coercion happens
to agree.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · [vocabulary](vocabulary.md) · [structure](structure.md) · absence · [parked](parked/)
