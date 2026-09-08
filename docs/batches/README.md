# Batches

The tool is built in batches. Each one is small enough to hold in your head,
does something observable on its own, and settles the questions it forces.

**A batch document records what a batch decided, never what the surface is.**
No command signatures live here — those are [`spec/api.md`](../spec/api.md)'s,
and duplicating them is exactly how the previous batch documents went stale
until they described a tool that no longer existed. What does not go stale is
history: what a batch was for, what building it forced, what it settled.

| | | |
|---|---|---|
| 1 | [a space, and nodes in it](1-a-space-with-nodes.md) | shipped |
| 2 | [nodes carry properties](2-properties.md) | shipped |
| 3 | [a property can hold a list](3-lists.md) | planned |

## Every batch shows its goal, and a test holds it there

Each document opens with a transcript of the loop that batch closes — what you
type, and what comes back. A batch that cannot be illustrated in a dozen lines
is too big.

**Each illustration is backed by a test named for its batch**, in
[`tool/tests/batches.test.ts`](../../tool/tests/batches.test.ts). The *done
when* is not a sentence, it is something that passes or does not:

```
$ deno task verify
batch 1 — a space, and nodes in it ... ok
batch 2 — nodes carry properties ... ok
```

**Against the compiled binary, not the source.** Everything else runs the
command function in process, which is fast and precise but blind to whatever
`deno compile` changes — embedded permissions, the entry path. These
transcripts were generated from the binary, so testing anything else would
leave the documented behaviour and the tested behaviour as two different
programs.

It is also why these can be organised by batch where the rest cannot. A subject
test describes current behaviour and would rot if filed under the batch that
introduced it; a batch test asks whether that batch's loop still closes, and if
it stops closing the transcript needs revisiting anyway.

So a transcript here cannot rot quietly. Change the surface and the test fails
first, and whoever fixes it is pointed at the page to correct. That is the same
trade the no-signatures rule makes, from the other side: what is written down
twice must be checkable, or it will drift.

A planned batch shows the transcript it is aiming at, and names the test that
does not pass yet.

## Why batches at all

Building whole and then correcting is how the first draft of this design got so
far ahead of anything real that it had to be abandoned. A batch is a forcing
function: it cannot be finished without answering the questions it raises, and
it cannot raise questions about things nobody is building.

**A batch ends when the loop closes** — when you can do the thing it was for
without opening a file by hand.

---

[docs](../README.md) · [design](../design/) · [spec](../spec/) · batches
