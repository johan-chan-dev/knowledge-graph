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

**No ordering rule was needed.** This page first decided that several nodes
would be locked in sorted id order, against two links crossing in opposite
directions. Reading the code removed the problem rather than solving it:
`nodeLink` amends one endpoint, releases, then amends the other, so a hold is
never kept while another is awaited. A deadlock needs nesting, and there is
none.

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

**Its own kind, not a fifth failure.** `acquire` returns `Contended` beside
`Opened`, rather than widening the `Failure` union that `open` and `read` share.
Widening it made six read paths answer for a case they cannot produce — the
compiler said so, and the narrower type turned six edits into two, both at sites
that do acquire.

**A refusal must let go.** `amend` can decline after reading — `add` refusing a
scalar — and returning there without flushing would hold the file for the rest
of the process. `abandon` releases without writing, and a test walks that path:
refuse, then write again, which hangs if the hold survived.

**Writers wait; they are not refused.** So no exit code is spent. An earlier
sketch of this batch reached for a third meaning of *refused* — the write is
neither malformed, nor absent, nor stale-by-the-caller's-fault — and a lock
removes the need for it entirely.

## Shipped

`document.acquire` holds the file for the whole cycle; `node.replace`,
`node.amend` and `vocabulary.write` take it, and `vocabulary.ensure` takes it on
the branch where the file already exists. Creation stays unlocked, since a
minted uuid cannot collide — and a word file created twice writes the same
twenty-one bytes, so that race is benign.

Measured, ten processes adding ten values to one list:

```
before   ["v2","v7","v9"]                    3 of 10, every process exited 0
after    ["v1","v10","v2","v3",…,"v9"]      10 of 10
```

`tests/batches/16_test.ts` holds it, and both of its cases fail when `acquire`
is put back to `open` — which is the only reason to believe them.

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
