# The settle pass

A graph accumulates unresolved status: triggers that may have fired, tasks that
drained without being deleted, blockers that cleared without propagating. None of
it fails anything — a stale claim keeps reading as current — so nothing surfaces
it. This is what looks.

## Health signals

The lifecycle column is only useful if violations are noticed — so
`kg check` computes what it can and **prints a census every
run** for what it cannot:

```
census  decisions 19 decided · 5 provisional · 4 open | theses 2 | tasks 9 | root decision/thesis 0
```

**Counted, never judged.** Whether tasks are *accumulating* needs history, which
a working-tree check does not have; whether a `revisit-when` has *fired* is an
event in the world, which is the entire reason it is a trigger rather than a
date. Printing the numbers unprompted is the most a checker can honestly do —
and it is the structural-over-discretionary principle applied to itself: the
figure appears whether or not anyone thought to look.

- **`tasks/` accumulating like `knowledge/`** → execution stalled, or the specs
  are not actually executable. Tasks are supposed to drain. **Counted, not
  judged — the census prints the number.** Since `queued` exists, each task's
  *age* is visible in `meta/QUEUE.md`; accumulation is a trend across commits and
  still is not something a working-tree check can see.
- **decision nodes stuck at `status: open`, older than the context that produced
  them** → usually dead. Close or delete; a stale open question is worse than none.
  **Counted, not judged** — an `open` decision carries no date to age against.
- **decision nodes at `provisional` whose `revisit-when` has already fired** →
  the trigger existed precisely so this would be noticed. Revisit or supersede.
  **Not computable, by design** — a date here would be theatre.
- **`knowledge/` entries past their recheck date** → regulatory and
  vendor-capability facts expire silently, without anything failing.
  **Computed — warns.**
- **items in a product's `docs/checklist.md` that no test ever reaches** → the
  checklist is conformance and does not drain, so a permanently unreachable item
  means either the requirement is unimplementable as stated or the thing it
  guards was never built. *Corrected: this signal first described the file as a
  register whose rows drain, which it is no longer.* **Not computable.**
- **root `knowledge/` or `tasks/` growing while only one product exists** → the
  globality claim is not being earned. With one product, almost everything is
  that product's; root should grow slowly until a second one disagrees.
  **Scoped to `decision` and `thesis` nodes** since the source test below — cited
  facts are expected at root from the start, and counting them here would fire
  the signal on the rule working correctly. **Computed — warns.** The only one of
  these a working-tree check can decide.

## The settle pass

**This section is why it exists, not how to run it.** The procedure is
`.claude/skills/settle/`, and its mechanical half is the `settle` agent —
context-heavy work that belongs in its own window rather than in a conversation.
Doctrine is carried in every session; procedure loads when a pass runs.

The signals above are mostly **not computable**, and that was recorded as a
limit. It is also a work list: each is something whose status is unresolved, and
settling it moves the status rather than removing anything.

**Nothing is pruned.** The core is monotonic — superseded nodes stay, recorded
failures stay, and `meta/MAP.md` simply does not select them. Pruning here is a
predicate in a generator, not an act anyone performs.

### Routed per item, not per category

| Where the answer lies | Who |
|---|---|
| a task's own `Done when`, checkable against the graph | **agent** — verify, then delete the drained container |
| a public source — an overdue `recheck`, a `revisit-when` naming a release | **agent** |
| **the user's business** — *"hub-sourced orders exceed direct ones"* | **user** |
| whether an `open` question still matters | **user** |

Most items are not a question for anyone. The two that are go through `meta/QUEUE.md`,
so the cap applies: a pass with eleven judgement calls surfaces four, because a
batch arriving at once is the multiple-task-load condition that produces clearing
rather than judging — see
[automation bias](knowledge/practice/automation-bias.md).

### What triggers one

Two signals, both computed and both printed rather than looked for:

- **`meta/MAP.md`'s pressure block** — budget, excluded count, overdue rechecks.
- **`meta/MAP.md`'s `reconciled: <sha>`** — the validator warns when commits have
  touched a graph since. It cannot show the commentary is *right*; it proves
  nobody has **looked**. That is the missing bound on a durable view: `tasks/`
  drains, so a view there expires with the work, and until now nothing bounded
  one that does not.

### Why it is incremental

The listing regenerates for free and cannot drift. The **commentary** cannot be
generated, and re-deriving it from 73 nodes every time is the expensive thing. So
a pass reads `git log <sha>..HEAD` over the graphs only — usually a handful of
commits, often none touching a graph at all — judges impact, edits the prose, and
advances the watermark.

**The failure mode is a rubber stamp**: advancing the watermark without a pass.
It is visible rather than guarded — an empty diff against N commits of graph
change shows in history, which is also the record. Settle passes commit with the
subject prefix `settle:`, so `git log --grep=^settle:` is the log and no second
file is needed.
