# Data is checked where it enters, and once

The tool has exactly two doors. Everything inside is assumed legal, which is
only true if both doors enforce the same thing.

| door | what arrives | untrusted because |
|---|---|---|
| argv | the shell's words | a person or a script typed them |
| disk | YAML frontmatter | a person may have hand-edited the file |

No static type reaches either. A compile-time schema constrains what may be
*written* and is gone before anything runs, so the check has to happen at the
door or not at all — which is why this tool is written in TypeScript and still
validates twice at runtime.

## One vocabulary, or the inside does not know what it holds

A legal property name is one thing. If the door from the shell says
`[a-z0-9]+(-[a-z0-9]+)*` and the door from disk says *anything YAML will
parse*, the tool has two vocabularies and no code inside can tell which one the
value in its hand belongs to.

The failure is not theoretical, and it is worse than a mismatch:

```
kg node <id> --properties    →  Kind: Decision        shown
kg node <id> unset Kind      →  not a property name   cannot remove
kg node <id> set  Kind other →  not a property name   cannot change
```

A property the tool displays and cannot touch. The only way out is editing the
file by hand, which is the one thing the design asks nobody to do.

**So: what the tool cannot write, it must not read.** Leniency at the reading
door looks like kindness and is not — it converts a clear refusal, made once at
the moment of writing, into a node that quietly cannot be managed. A refusal
names the problem; a leaky door hides it until the day someone tries to undo
something.

The reading door already refuses four things on exactly this reasoning — a YAML
null in any spelling, an empty list, a nested map, a block that will not parse.
Each is refused because the tool has no way to represent it, and an unwritable
name is the same class of thing.

## Checked once, not repeatedly

Once a door has decided, nothing behind it checks again. Two checks are two
rules, and two rules drift — the second is written later, by someone reading
different code, and the day they disagree the behaviour depends on which ran
first.

This is why [batch 5](../batches/5-the-entry-point.md) deleted the property-name
and value checks that lived inside the command functions. The entry point had
already decided; the copies could only ever agree redundantly or disagree
silently.

It also decides where a refusal is *phrased*. The door knows the caller and the
raw input, so it can say `not a property name: Kind — expected a lowercase
hyphenated token`. Code further in knows neither, and its version of the same
refusal would be worse.

## The check should leave proof

*Checked once* is a rule someone can forget. A guard that returns a boolean
announces that it ran and then discards the evidence, so every function behind
the door still takes the same untrusted type it would have taken anyway, and the
discipline lives in whoever remembers it.

A guard that narrows the type instead makes the door the only crossing: if the
only way to obtain a checked name is to pass through the check, then nothing
behind it can be called with an unchecked one, and the rule stops depending on
memory. The proof is erased at runtime and costs nothing.

That is the natural enforcement of everything above, and it is not built yet.

## What the reading door refuses

Everything the writing door would, plus what the format cannot carry:

| refused | because |
|---|---|
| `Kind:`, `valid_until:` | not a property name — the tool could never write it |
| a value holding a control character | not a value — `set` refuses the same text |
| a YAML null, in any spelling | there is no second way to be absent |
| an empty list | a key carrying nothing is not a value |
| a nested map, an unparseable block | no way to represent it |

Each refusal names the property, because the block is the caller's to fix and
*something in here is wrong* does not say where.

**Reserved names are deliberately not on that list.** `body` is a name the tool
can represent perfectly and declines to *write*, which is different from one it
has no way to hold — so a file carrying `body:` still reads, as
[batch 5](../batches/5-the-entry-point.md) decided. The rule is about what the
format can carry, not about which names are spoken for.

---

[docs](../README.md) · [design](README.md) · [location](location.md) · [vocabulary](vocabulary.md) · [structure](structure.md) · [absence](absence.md) · boundaries · [parked](parked/)
