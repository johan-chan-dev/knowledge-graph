# Batch 13 — one output format

**Done when** the tool has one format for structured output, and no flag chooses
it.

## What it has to fix

**Seven `--json` flags**, on `nodes list`, `node <id>`, `nodes --properties`,
`nodes --stdin --properties`, `labels list`, `types list` and `link <id>`. Each
is the same question asked again — *which format do you want* — in a tool whose
whole surface is otherwise built so the command already says what it returns.

**And the answer was never really a preference.** Measured on the movies graph:

| | YAML | JSON | |
|---|---|---|---|
| one node, flat | 193 B | 201 B | YAML by **3%** |
| an array of 171 resolved nodes | 105 357 B | 98 873 B | JSON by **6%** |

YAML wins on a flat mapping — no braces, no quoted keys — and loses the moment
the shape is an array of mappings, where indentation replaces the braces without
saving anything. So neither format is right everywhere, the default was being
chosen per command, and the flag existed to undo the choice.

**The reader settles it.** Every structured output of this tool is read by a
program — `jq`, or a model building the next command. `docs/design/naming.md`
says as much about names: *the caller here is mostly a model reading one
command's output to build the next*. A format that half the outputs default to
and the other half flag away from is a decision handed to the caller for no
reason.

## What it should look like

```console
$ kg node 01a0…7c2f --properties
{
  "born": "1965",
  "labels": ["Person"],
  "links": [
    {
      "direction": "out",
      "link": "01a09f8b-2cbc-7992-829b-d3e1709175ae",
      "neighbour": "01a09f8b-263b-7033-bab3-3dc6b88b66e7",
      "type": "DIRECTED"
    }
  ],
  "name": "Tom Tykwer"
}

$ kg nodes list
01a09f8a-bba6-7530-ad76-fc70ad341f30
01a09f8a-bc5c-7138-8735-34a0c58ac2a7

$ kg labels list
Movie
Person

$ kg node 01a0…7c2f --properties --json
unknown flag: --json — structured output is JSON
```

**Named, not linked:** `tool/tests/batches/13_test.ts`.

## The rule

**Two shapes, and the command's subject picks which.**

| the output is | the shape |
|---|---|
| a list of identities — ids, words | one per line |
| anything structured — properties, a record, an array of either | **JSON, indented** |

**No flag arbitrates, because the subject already did.** That is the same move
[batch 9](9-find.md) made when it put the cost in the action rather than in a
flag, and [batch 11](11-resolution.md) when it made the scope name the shape —
*one node's properties are one thing; many nodes' are an array of them*. This
takes the last thing still being asked and derives it too.

**Indented, not compact.** A human reading one node is the only reader the
default has to please — a program parses either — and the indentation is what
keeps that reader served without a second format. `jq` is not needed to make the
output legible; it is needed to select from it.

**Lines are not YAML**, so nothing about `nodes list` or `labels list` changes
except the flag that offered to wrap them in an array. A list of uuids is
already shell-shaped: `wc -l`, `grep`, `cut` and `xargs` all work on it, and
`jq -R` is there for a caller who wants the array.

## What this drops, and it was an argument of mine

`kg node <id> --properties` printed the **stored form plus the resolution** —
the same serialiser as the file, the same sorted keys, the same quoting, with
`neighbour` added. `spec/storage.md` records it, and it meant reading the output
taught you the file format.

It goes. Honestly weighed, it was aesthetic rather than useful: nobody pastes an
output into a frontmatter, because `set` writes there instead. What it cost to
keep was a second format across the whole surface.

**YAML stays where it was always the point.** The store is unchanged —
frontmatter in `nodes/` and `labels/` and `types/`, records in `links/` — and
`frontmatter.ts` stays its only writer. What ends is YAML as an **output**
format, which is a different job with a different reader.

## The sequence

| | | why here |
|---|---|---|
| **1** | one JSON writer, indented, in `outcome.ts` | self-contained; nothing calls it yet |
| **2** | the mapping outputs move to it — `node <id> --properties`, `nodes --properties`, `nodes --stdin --properties`, `link <id>` | needs step 1. Each loses its `--json` as it moves, so the flag never outlives the choice it undid |
| **3** | the line outputs lose theirs — `nodes list`, `labels list`, `types list` | independent of 2, and the smallest: nothing about the default changes, only that the alternative goes |
| **4** | `spec/api.md` and `spec/storage.md` follow | last, because the surface stops moving at step 3 |

## What it leaves

**Compact JSON.** Nothing asks for it: a program does not care, and the size
difference against indented is smaller than the difference against YAML that
this batch already accepts. If a caller ever needs it, `jq -c` is one pipe.

**`node <id>` without `--properties` still returns content byte for byte.** It
is not structured output — wrapping prose in an escaped string is strictly worse
than handing it over, and a caller who asked for the body wants the body.
[Batch 11](11-resolution.md) settled that and this does not reopen it.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · [batches](README.md) · [9](9-find.md) · [10](10-one-writer.md) · [11](11-resolution.md) · [12](12-vocabulary.md) · 13 · [14](14-match.md)
