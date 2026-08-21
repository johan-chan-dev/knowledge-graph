---
name: graph
description: Work with a repository's knowledge graph — create or change nodes, relate them, supersede a decision, file or retire a task, find what cites a node, and check the graph. Use whenever a repository has a .kg.json and something needs adding to, changing in, or reading out of the graph. Never hand-edit node frontmatter; every operation below writes it correctly by construction.
---

# kg

`python3 ${CLAUDE_PLUGIN_ROOT}/kg.py <op> …` — run from anywhere inside a
repository holding a `.kg.json`.

## The rule

**Never hand-write or hand-edit frontmatter.** Every operation validates the
*result* before writing, so a node cannot reach an invalid state — that is the
whole design, and editing around it puts it back to being checked afterwards.

Write prose freely. `kg` writes the frontmatter and a title heading and stops;
the body is yours.

## Operations

```
kg new <path> --kind fact|concept|decision|thesis --title "…" [--set '{…}']
kg set <path|task-id> --set '{…}'          # merges; null deletes a key
kg supersede <path> --title "…" --set '{…}'
kg link <from> <to> --rel R [--set '{…}']  # rel: supersedes|contradicts|depends-on|does-not-satisfy
kg unlink <from> <to> [--rel R]
kg mv <old> <new> [--dry-run]
kg task new <slug> --cost high|medium|low --due now|deferred [--due-when "…"]
kg task retire <id> [--force]
kg inbound <path>
kg stale
kg check
kg migrate [path] [--dry-run]
kg init [--graphs …] [--tasks …]
```

`--set` takes JSON and means the same thing everywhere: merge into the
attributes dict.

## What to reach for

| Situation | Operation |
|---|---|
| a new claim, decision or thesis | `new` |
| an existing node is **wrong** | `set` — correct in place, git holds the history |
| a decision was **right and got overtaken** | `supersede` — inserts a version, path unchanged, citations never rot |
| "what breaks if I change this?" | `inbound` |
| a rename or a move | `mv --dry-run` first, always |
| a task has drained | `task retire` — it lists inbound references and refuses |
| before committing | `check` |

## Read the refusals

They carry the reasoning, not a rule number. A refusal naming `revisit-when`,
tier direction or a dangling reference is telling you something about the graph,
not about the syntax — read it before working around it.

## The shape

`${CLAUDE_PLUGIN_ROOT}/SCHEMA.md` — what a node is: `kind`, `attributes`,
`relations`, the frames, the confidence values, the tier rule.
`${CLAUDE_PLUGIN_ROOT}/TOOLBELT.md` — why each operation exists and which
invariant it makes unreachable.
