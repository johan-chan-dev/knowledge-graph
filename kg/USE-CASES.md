# Use cases

Each is real. They are the friction met while building the origin repository on
2026-08-19/20, before any of this existed — which is why the operation list looks
the way it does rather than like a graph API.

---

## 1. Research becomes a node

**What happened.** Four searches and three fetches to check whether agent speed
amplifies bias. Then a 60-line file typed by hand with eleven frontmatter fields,
a separate edit to `INDEX.md` to add the entry, a relation added to another node,
and a validator warning — *no inbound link* — answered by going back to add a
reciprocal citation.

**With the toolbelt:**

```
kg new knowledge/practice/automation-bias.md \
    --type pattern --title "Automation bias, fluency, and error compounding" \
    --jurisdiction universal --vendor universal \
    --topics decision-making,verification,agent-practice \
    --confidence partial --in 12mo \
    --link depends-on:practice/debiasing.md
```

Frontmatter, index entry and relation in one act. The prose is still mine — the
tool never writes an argument.

---

## 2. Filing a task

**What happened.** Read every task file to find the highest `id`, picked the next
one, typed four fields, ran the validator twice because `due: deferred` needs a
`due-when` and the first attempt did not have one.

**With the toolbelt:**

```
kg task new design-kg-toolbelt --cost high --due now
kg task new design-search-and-geo --cost high --due deferred \
    --due-when "Discovery legibility returns and the thesis survives"
```

The id is assigned, `queued` is today, and the second form cannot be written
without its trigger.

---

## 3. Draining a task — where the value actually showed up

**What happened.** A task whose own first heading read *"this task is done"* had
been queued for two days. `git rm` it, and the pre-commit hook refused with five
broken links. Reading each one to repoint it surfaced **two stale blockers** —
text asserting *X is blocked by Y* where Y had answered two days earlier.
Invisible to every check, because nothing fails when a blocker clears.

**With the toolbelt:**

```
kg task retire 9

  refused — 5 inbound references:
    knowledge/stack/token-blast-radius.md:109   prose
    tasks/phase-one-acceptance.md:63            prose  "1.5 is blocked by"
    knowledge/meta/INDEX.md:188                 index  (struck through)
    docs/checklist.md:168                       prose  "S1 waits on"
    ...
  repoint them, or --force
```

**The refusal is the feature.** Deletion is only cheap where nothing points at
the container, and being made to look is what produced the finding.

---

## 4. Moving files

**What happened.** Relocating two index files one directory deeper. Done with a
regex in two passes; the second re-based what the first had just created. **157
broken links**, every path plausible and one level too deep, caught only because
the hook refused the commit. Reverted and redone in a single pass.

**With the toolbelt:**

```
kg mv knowledge/INDEX.md knowledge/meta/INDEX.md --dry-run

  79 references would be re-based
    33 relative links inside the file itself
    46 parent links inside the file itself
     6 inbound from other files
```

---

## 5. Impact analysis — "what breaks if this changes?"

**What happened.** `grep -rln "fulfilment-schedule.md"` returned twelve files. All
twelve *referenced* the node; **none implemented it**, and there was no way to see
that from the output. The gap was found instead by grepping four other files for
words that were not in them.

**With the toolbelt:**

```
kg inbound products/etalade/knowledge/product/fulfilment-schedule.md

  typed  (5)  withdrawal-exposure   depends-on
              charge-structure      depends-on
              ...
  prose  (7)  verify-multi-intent-checkout      (context)
              ...
```

Tier-aware: a citation from a local graph is never surfaced under a global node.

---

## 6. A settle pass

**What happened.** Six `provisional` decisions, each with a `revisit-when`. Read
all six by hand to sort the ones a public source could answer from the ones only
the user can. Checked two against sources; neither had fired; recorded the check
and the date **inside the node**, because `revisit-when` has nowhere else to carry
*"looked, and it has not happened"*.

**With the toolbelt:**

```
kg stale

  recheck overdue      none
  provisional, trigger unread since decided:
    stack/validation   "Remote functions leave experimental…"      2026-08-17
    stack/data         "…drizzle-orm 1.0 reaches GA…"              2026-08-17
    commerce/platform-duties  "The DAC7 carve-outs are fetched…"   2026-08-16
    ...
```

It lists; it does not decide. Whether a trigger has fired is an event in the
world.

---

## What none of these need

No configuration file, no reference grammar, no machine-readable output. Every
one is a skill that already knows the repository, passing paths it already has.
