# Documentation

`kg` keeps a knowledge graph as files in a repository: one node per file, a
uuid for a name, properties in frontmatter and prose in the body. A person asks
and rules; an agent drives; the tool writes.

**This is a replacement, not a migration.** The outgoing implementation — a
Python toolbelt shipped as a plugin — is deleted, and nothing in it constrains
what is described here: not its command names, not its frontmatter shape, not
its layout on disk. Git history holds it. The two arguments it made that this
design has not settled were carried across rather than left there, and are in
[`design/parked/`](design/parked/): [raw](design/parked/raw.md) and
[sharing](design/parked/sharing.md).

## Where things are

| | |
|---|---|
| [design](design/) | why it works this way — the arguments that outlive any surface |
| [design/parked](design/parked/) | argued, and not settled enough to build |
| [spec](spec/) | what the binary does today, and nothing else |
| [batches](batches/) | what each batch decided, in the order it was decided |

## How to read it

**Start with [`spec/api.md`](spec/api.md)** if you want to use the tool. Every
scope, action and flag, with the reason beside each rule.

**Start with [`design/`](design/)** if you want to know why any of it is shaped
that way. Two arguments live there and both are load-bearing: a reference is a
name rather than a place, and a word a node carries is never written down twice.

**Start with [`batches/`](batches/)** if you are wondering how it got here, or
what is next.

## What holds it together

**The spec is true of the binary in front of you.** Nothing in it is planned,
proposed or nearly ready. Anything unbuilt is in
[`design/parked/`](design/parked/), and moves out in one direction by one
trigger: it gets built.

**A batch document records what a batch decided, never what the surface is.**
Signatures belong to the spec. Duplicating them is how the previous batch
documents rotted until they described a tool that no longer existed.

**A reason stays beside the rule it justifies.** A rule without one reads as
arbitrary, and exiling it means holding two files open to understand one
command. What separates design from spec is not rule-versus-reason but how long
the argument outlives the code — see
[the line between them](design/README.md).

---

docs · [design](design/) · [spec](spec/) · [batches](batches/)
