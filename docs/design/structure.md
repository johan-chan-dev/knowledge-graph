# Structure

**The tool may name its own parts.** Not the words a practice chose — those it
must never learn — but the things it holds by construction, which it already
knows because it built them.

## Two kinds of name, and only one is forbidden

The substrate provides slots and knows nothing of their contents. That rule is
what keeps a graph of decisions and a graph of recipes running on the same
machinery: `kind`, `validated-by` and `labels` are words somebody chose, and a
tool that knew any of them would be a knowledge tool wearing a general name.

`kind` is the sharpest of those, because it is *useful* enough that reserving it
keeps suggesting itself — every practice will classify something, and a
guaranteed shape would make the classification reliably queryable. It is still a
practice's word, borrowed from Neo4j's labels by way of
[vocabulary](vocabulary.md), and the guarantee it offers is available without
the breach: a practice declares the constraint and the tool enforces what it is
told, which is a different thing from the tool knowing the name.

But a node's prose is not a word anybody chose. Neither is the moment it was
made, nor the name it goes by. Those are facts about the **shape** of a node,
true of any graph whatever it holds, and the tool computes all three without
being told anything.

The test is the one that keeps practice vocabulary out: *does a rule about this
survive changing the subject?* A graph of recipes has bodies, creation times and
identities. It has no `kind`.

So there are two kinds of name, and the prohibition covers one of them:

| | who chose it | may the tool know it |
|---|---|---|
| what a node **is said to be** | a practice | no |
| what a node **is made of** | the format | yes — it made it |

Naming its own structure is not the substrate acquiring an opinion. It is the
substrate being able to talk about what it already does: the reader that splits
a node in two has always known there are two halves.

## Every reserved name is spent, permanently

A reserved name is one an author can never use. That is the whole cost, and it
is not recoverable — a name taken back later breaks every node already carrying
it, and there is no version of that which is not a migration.

Which makes the discipline arithmetic rather than taste. **Three facts about a
node's prose cost one name, not three**, if they are reached through the thing
they describe:

```
body            the prose
body.lines      a fact about it
body.size
```

Reserving `lines` and `size` outright would spend two more names on two facts,
and spend another on the next one. Reserving `body` spends one and buys every
fact about a body there will ever be.

## A reserved name denotes its value, and namespaces its facts

Bare, it is the thing. Followed by a dot, it is the thing's attributes. There is
no third form — no separate name for "the content of the body", because the body
*is* the content, and a second spelling would be two ways to say one thing.

The syntax needs no rule of its own: an authored name cannot contain a dot, so a
dot can only follow a reserved one. The vocabulary's own restriction decides
where paths are legal, without anything being declared.

## What may be reserved

Only when the tool starts holding the fact itself. Not when a fact would be
useful to ask about, and not when a practice would like a word protected — those
are the two ways this becomes a dumping ground, and the second is the rule about
slots restated.

So the list grows when the **format** grows, and at no other time. If edges
become part of a node's shape rather than a property of it, they qualify. If a
practice wants its own field defended from overwriting, it does not.

## When the cost lands

Nothing outside this repository depends on the tool yet, so a name reserved too
late is currently free to fix. That stops being true the day anything is built
on top — after which every addition is a migration, and the list should have
been as complete as it could be before then.

That is an argument for reserving a namespace early and implementing its members
late. Reserving costs a name; implementing costs work; and only the first one
gets more expensive with time.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · [vocabulary](vocabulary.md) · structure · [parked](parked/)
