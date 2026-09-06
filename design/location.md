# Location

**Nothing here is identified by where it sits.** One claim, and it holds at two
scales.

## A reference is a name, not a path

Things move. Material gets regrouped once enough of it exists to see the shape;
a cluster that has earned its own boundary gets taken out into a place of its
own. Every one of those breaks every path pointing into it, and the breakage is
worst for the material that was most useful, because that is what most things
pointed at.

So a node needs a **name**, and a name is not a location.

- A path says *where to look* — a fact that expires the moment anything moves.
- A name says *which one* — and survives all of it.

Both exist, and both are needed: material has to be opened somehow. A path is
computed from a name at the moment something must be opened, and thrown away
after.

**Thrown away only holds if it never gets out.** A path that is handed to
someone does not stay a computed intermediate — it is written into a note,
passed to another program, remembered across a conversation, and from then on it
is a stored reference by location, which is the one thing the claim forbids.
Whoever holds it will act on it eventually, and will be acting on where the
material used to be.

So the asymmetry runs one way and all the way down. A name goes in; a path is a
step in the machinery and never a value anyone else holds. There is no way to
address material by where it sits, only by what it is called.

**A name is assigned once and never changes.** Not renamed when the material is
reorganised, not reissued when it moves, not reused when it is retired. A name
that can change is a location wearing a better disguise.

**And it must be unique without asking anyone.** Nothing here can enumerate
every place a name might eventually be read, so uniqueness cannot be established
by checking. It holds because names are minted with enough entropy that
collision is not an event worth designing against.

## The same holds one scale up

A collection is not addressed by where it sits either. It may live inside a
repository that exists for something else entirely — an application keeping its
knowledge beside its code — and may later be taken out into a repository of its
own.

So the rule is:

> **Nothing inside may record where the thing it is inside currently sits.**

Which leaves the collection needing a name of its own, and the same answer
serves: **its name is the name of the directory holding it.** Not its path — the
last segment only, which travels when the whole thing is moved or copied
somewhere else. Nothing has to write it down, because the filesystem is already
storing exactly one name for it and that name is not a location.

That is the node arrangement one scale up. A node's name is its filename rather
than its path; a collection's name is its directory rather than its path. Both
put the name in the slot the filesystem keeps for names, and both survive the
move that a path does not.

Whether that has been honoured is mechanically checkable: **if moving the
collection requires editing anything inside it, something recorded where it
was.**

## What this costs

The material is opaque to anyone without the tool. A directory listing returns
names that say nothing; nothing can be found by reading the folder.

That is a real cost and it is charged against a reader who does not exist here.
The material is written to be read through a tool, working alongside the person
whose thinking it holds — so filenames carrying no meaning costs nothing that
was on offer, and buys a reference that survives every rearrangement.
