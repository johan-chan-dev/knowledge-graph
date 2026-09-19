# Batch 16 — two writers at once

**Done when** two processes may write different nodes at the same time, and two
writing the same node do not lose each other's work.

## What it has to fix

**A lost update, and nothing announces it.** Two processes updating one node
both read it, both change their copy, both write. The second rename wins and the
first change is gone — with a perfectly valid file left behind, which is what
makes it dangerous. [`storage.md`](../spec/storage.md) names the cycle:
*read-modify-write. Each endpoint holds an entry under the reserved `links`.*

Measured, the window that has to be closed:

```
read + write + rename, 200 cycles
  median 1.04 ms   p95 2.61 ms   min 0.38 ms
```

**`link` is the likeliest collision, because it writes a node the caller did not
name.** `link --as X --with-nodes B` rewrites `B`'s frontmatter. Two sessions
attaching to one shared concept collide on it, and extraction produces shared
concepts by design.

**And a lost entry makes the two read paths disagree.** Measured by removing one
from a node while its record stays:

```
nodes match '()-[:CITES]->()'   →  2 nodes   (reads the records)
node <id> --properties          →  no links  (reads the node's entry)
```

**[Batch 10](10-one-writer.md) named this and did not build it**, under *what it
unblocks*: *write only if the file has not moved since it was read*. It also put
every frontmatter write in one place, which is why the guard is one change in
one module rather than four.

## What it decides

**The lock is on the node file itself.** Not a lock directory, not a dotfile,
not `/tmp` — nothing new on disk at all. `flock` is held by the descriptor, so
**the kernel releases it when a process dies**: there is no orphan to reap and
no reaper to write.

`/tmp` was considered and refused for a sharper reason than tidiness: a lock
reached by two different paths, or removed by a cleaner while held, **exists and
does not exclude**. A guard that silently fails to guard is worse than none,
because the caller believes it is safe.

**An inode check, because the write is a swap.** The temporary file is renamed
over the target, so a descriptor locked before someone else's swap holds a lock
on a file no longer at that path. After acquiring, compare the descriptor's
inode with the path's; if they differ, release, reopen, retry. Verified:

```
holding the lock        fd.ino == stat(path).ino   →  true
after a rival's rename  fd.ino == stat(path).ino   →  false
```

**Several nodes are locked in sorted id order.** `link` touches both endpoints,
so two links crossing in opposite directions would deadlock. Ids are uuids, so
sorting is total and deterministic and the deadlock cannot form.

**Minting exempts; deriving does not.** `node new` and a link record take a
fresh uuid, so no one else can be writing that path and no lock is needed. A
**word file does not**: `.kg/labels/<slug>.md` is named by a fold of the word, so
two sessions using `Decision` for the first time target the same path. That is a
create-if-absent and belongs with the modifications.

The line is not *creation against modification* — it is **a minted name against a
derived one**. A uuid guarantees exclusivity by construction; a slug guarantees
the opposite, since [naming](../design/naming.md) exists so that confusable words
*must* collide. What protects the vocabulary from homonyms is what exposes it to
concurrency.

**Writers wait; they are not refused.** So no exit code is spent. An earlier
sketch of this batch reached for a third meaning of *refused* — the write is
neither malformed, nor absent, nor stale-by-the-caller's-fault — and a lock
removes the need for it entirely.

## What it does not settle

**The two read paths.** That a node's `links` entry is an index while the record
is the data, and that only one of the two readers consults it, is a question
about the data model. A lock stops a *race* from causing the divergence; it does
nothing about a hand edit, a `git restore`, or a merge. That argument belongs
elsewhere and is not this batch's.

**Partial writes across files.** `link` writes a record and two nodes. A process
dying between them leaves a record whose endpoints do not both list it — each
file atomic, the set of them not. A lock does not make three writes one, and
nothing here pretends otherwise.

**Contention under a real load.** The 1 ms above says two writers on one node
wait about a millisecond. Whether an ingestion produces contention at all is an
outcome to measure, not a figure to assume — see
[scifact](../design/parked/scifact.md), whose parallel ingestion is the caller
for this batch.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md)
