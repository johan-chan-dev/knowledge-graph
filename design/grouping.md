# Grouping

**A word a node carries, and nothing more.** Grouping is open, and which nodes
are in a group is never written down.

## Open, because the groups arrive late

Material clusters. Some of it turns out to be about authentication, some about a
recurring pattern, some about a vendor's behaviour — and *which* clusters exist
is not knowable when the first piece is written. A subject becomes visible only
once enough material shares it that the shape can be seen at all.

So the vocabulary cannot be fixed in advance. Anything demanding the right group
at the moment of writing would be demanding a guess, and would then freeze the
guess into the structure.

**The cost of the closed alternative is charged at the worst possible moment** —
the moment of insight, when the thing just understood does not fit any of the
words that were allowed.

## A group is not a folder

The obvious implementation is a directory per subject, and it should be
resisted, because grouping and containment settle at different times by
different means.

| | grouping | containment |
|---|---|---|
| arrives by | noticing | deciding |
| costs | nothing — overlapping, revisable | a boundary that has to be maintained |
| a thing can be in | as many as apply | exactly one |

The last row decides it. A piece of material is about authentication *and* about
a pattern *and* about a vendor. A folder forces a choice between them, and the
choice then gets made on filing convenience rather than on meaning.

## Membership is computed, never stored

The only authored fact is that a node carries a word. Which nodes carry which
word follows from that, and follows *completely* — so writing it down anywhere
creates a second place stating the same fact, and two places stating one fact
are two places that can disagree.

A stored membership list has to be kept honest by construction, and the
construction is never free: something must rebuild it on every change, or
something must detect that it is behind. **A thing that could be stale is a
design error rather than something to check for**, and the version that cannot
go stale is the one that was never written down.

Computing it is a read of the material. At the scale one collection holds that
is fast enough that the question does not arise — and the day it stops being
fast enough, whatever gets built to speed it up is an accelerator that may be
deleted without notice, never something anything is allowed to depend on.

## Why the words are constrained

A group's word is meant to be **typed and matched exactly**. It is not prose; it
is a key that two people, or a person and an agent, have to arrive at
independently and land on the same string.

Anything requiring quoting or escaping is a word that will eventually be typed
wrong, and will fail by silently matching nothing rather than by complaining.
That is the whole reason the form is restricted; the specific restriction is
[the spec's](../spec/api.md).

## What a group is not

It carries no meaning the tool can act on. Nothing about a word decides what a
node must contain, what it means, or whether it is any good — those are
questions for whatever practice is being followed, and the tool has no access to
one. A word is a string that some nodes have and others do not.
