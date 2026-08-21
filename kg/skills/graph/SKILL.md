---
name: graph
description: Manage a repository's knowledge graph with the kg toolbelt — create and change nodes, relate them, supersede a decision, file or retire a task, trace what cites a node, and check the graph before committing. Use this whenever a repository contains a .kg.json, and whenever work involves atomic markdown notes with typed frontmatter, decision records, knowledge nodes, a two-tier global/local graph, or a queue of pending verification work — even when kg is never mentioned by name. Reach for it before hand-editing any node's frontmatter: every operation here writes it correctly by construction, and editing by hand puts the rules back to being checked afterwards, which is what the tool exists to remove.
---

# kg

```
python3 ${CLAUDE_PLUGIN_ROOT}/kg.py <op> …
```

Run from anywhere inside a repository holding a `.kg.json`. If there is no
config, `kg init` creates one.

## Why not hand-edit

Every write operation validates the **result** before writing, so a node cannot
reach an invalid state — `status: decided` without a `revisit-when` is refused
rather than reported later. Editing frontmatter directly bypasses that and turns
a guarantee back into a check. Prose is different: `kg` writes frontmatter and a
title heading and stops, and the body is yours.

## Operations

```
kg new <path> --kind fact|concept|decision|thesis --title "…" [--set '{…}']
kg set <path|task-id> --set '{…}'            # merges; null deletes a key
kg supersede <path> --title "…" --set '{…}'  # inserts a version; path unchanged
kg link <from> <to> --rel R [--set '{…}']    # supersedes|contradicts|depends-on|does-not-satisfy
kg unlink <from> <to> [--rel R]
kg mv <old> <new> [--dry-run]
kg task new <slug> --cost high|medium|low --due now|deferred [--due-when "…"]
kg task retire <id> [--force]
kg inbound <path>
kg neighbors <path> [--hops N] [--frontmatter]
kg stale
kg build [--check]
kg check
kg migrate [path] [--dry-run]
```

`--set` takes JSON and means the same thing everywhere: merge into the
attributes dict.

## Choosing an operation

| Situation | Reach for | Why |
|---|---|---|
| a new claim, decision or thesis | `new` | writes frontmatter **and** the index entry together |
| an existing node is **wrong** | `set` | a mistake is not history; git holds the diff |
| a decision was **right and got overtaken** | `supersede` | inserts a version behind the same path, so inbound citations never rot |
| "what breaks if I change this?" | `inbound` | the resolver handles both path conventions; grep cannot |
| "what does this rest on, and what rests on it?" | `neighbors` | an ego graph — returns a **list**, not the nodes. Add `--frontmatter` for `serves` and `revisit-when`, which is often the whole answer at a twelfth the cost of the bodies |
| a rename or a move | `mv --dry-run` first | it re-bases the moved file's **own** links too, which a find-and-replace misses entirely |
| a task has drained | `task retire` | lists inbound references and refuses — that refusal is where cleared blockers surface |
| before committing | `check` | run `build` first; the hook does both |

## Read the refusals

They carry reasoning rather than a rule number. A refusal naming `revisit-when`,
tier direction, or a dangling reference is telling you something about the graph
— read it before working around it, because working around it is usually the
wrong repair.

## Going deeper

Read these when the question is not "which command" but "what should this be":

| File | Read it when |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}/SCHEMA.md` | what a node *is* — kinds, attributes, frames, confidence, relations |
| `references/method.md` | placing a node, choosing a tier, deciding one node or two, judging whether a relation earns being typed |
| `references/settle.md` | resolving what the checker cannot decide — fired triggers, drained tasks, cleared blockers |
| `${CLAUDE_PLUGIN_ROOT}/TOOLBELT.md` | why an operation exists and which invariant it makes unreachable |
