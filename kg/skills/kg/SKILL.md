---
name: kg
description: >-
  This project's memory — a graph of markdown notes with typed frontmatter and
  typed relations, holding what the project decided, learned, measured and why.
  Use it whenever the user asks to keep, remember, record, note down or file
  something the conversation has just established, in any language: "garde ça",
  "retiens ça pour la prochaine fois", "note ça quelque part", "remember this",
  "add that to your knowledge base". Use it too whenever they ask what was
  decided and why, what cites or supersedes what, or what is still open. The
  user decides what enters: nothing is written unasked, and an agreed batch goes
  in piece by piece so each write can be reviewed. It replaces Claude Code's own
  auto-memory, which should be off. Reach for it before hand-editing any
  frontmatter — every field has a verb that writes it correctly. Not for ADR or
  documentation files at a path the user names, outside note vaults, generic
  JSON wrangling, or plotting graphs of metrics.
---

# kg

A store of nodes, the words that classify them, and the typed relations between
them. Markdown with YAML frontmatter on disk; JSON on the way out.

**This page holds only what the tool cannot tell you itself.** Its refusals name
the boundary when you reach it, and `docs/` in the plugin's repository argues
why everything is the way it is. What neither can carry is the habit nobody is
refused for skipping, and the `jq` a question needs once the pattern has done
its half.

## The habit this serves

The graph is this project's memory, and it fills through conversation rather
than through an import. A session has a shape:

1. **Sparring.** Something gets established while working — a decision, a
   constraint, a measured number, a road not taken and the reason. Name it as
   it settles, in one line, and keep it in your own scratch notes. Nothing
   reaches the graph yet.
2. **Consolidation.** It gets argued, corrected, narrowed. Most of what passes
   through step 1 does not survive step 2, which is the whole reason step 3 is
   a separate act rather than a consequence.
3. **Integration, when asked.** The user says to keep it. Only then does
   anything reach the disk.

**Writing needs a word from the user. Proposing is yours to do, and expected.**
Two acts, and only the first is gated. A graph that fills itself is one its
owner stops trusting to read back, because they never chose what is in it — so
never write on your own judgement. But silence is not the safe side of that
rule: it costs twice over. What nobody named is gone when the session closes,
and what you quietly save up instead arrives as a heap too large to read
honestly. **A review of forty facts is not forty reviews; it is a rubber
stamp** — which hands the user the illusion of having chosen, the one thing the
rule exists to protect.

So say it as it settles: one line, no ceremony, no pause in the work. And if a
long session has gone by with nothing landing, say that too — the backlog is
itself worth naming before it grows into the thing nobody can check.

**The modelling is yours; the user should never have to think in nodes.** They
say what is worth keeping, in their own words and at their own grain. Which of
it becomes a node, which a property, which a relation and under which type, is
the expertise they are delegating — asking them to supply it hands back the
work they came with. So capture first, into a scratch document where nothing
has a shape yet, and design the subgraph afterwards, once the whole of what was
agreed is in front of you.

**How far to model: a body is a remainder, not a verdict.** What stays in a
node's prose is what nobody has lifted out *yet*. So the question is never
*does this deserve to be structure* — that is a prediction about questions
nobody has asked — but *what has this conversation actually needed*. Lift that
much and leave the rest.

**What you lift is an exhibit, not a thesis.** A passage is produced *in
support of* something: it carries where it came from — the quote, the offsets,
the digest of the source it was taken from — and it points at the claim it is
adduced for. Those are two nodes, and keeping them apart is what makes the
graph answerable. One passage is adduced for several claims, sometimes opposing
ones, and it stays neutral between them — **the relation carries the side, the
exhibit does not**. Weld the two and the same passage has to be copied for
every argument it serves, two sources saying one thing never meet anywhere, and
no verb undoes it afterwards.

**So a pass begins with a look, not with a write.** Read the anchors already
pointing at that source — their quotes are what earlier passes took — and check
the claim before minting a second spelling of one that exists. The first pass
then stays true of what it claimed and of nothing more. The exception worth
checking is a re-grain: two anchors overlapping inside one body are two
readings of a single sentence, and no digest will catch it, because the body
never moved. Calling content body-grade would close that door and buys nothing:
capture has to stay free, because the scarce input is the judgement, never the
material.

That is also what the review in step 3 is *about*. The facts were settled in
step 2 and are not on trial again; what the user is checking, piece by piece,
is whether the shape you chose is one they will be able to ask questions of in
six months.

**An agreed batch goes in piece by piece.** Integration is a review, not an
import — one node, one property, one relation at a time, each small enough to
be read and corrected before the next one is written. Ten writes the user
watched are worth more than one bulk write they have to audit afterwards, and
the verbs are atomic precisely so that costs nothing. Pieces stay small because
they were named as they appeared — not because a heap was cut up afterwards.

## Finding it again

The same loop read backwards, and it runs in a fixed order because each step
costs more than the one before it.

1. **Spell.** `labels list`, `types list`, one node read as an example. The
   failure is almost never *it is not there* — the user knows it is, they put it
   there — it is *I cannot spell it*. Two hundred milliseconds settles that, and
   the session hook has usually done it before you were asked.
2. **Anchor, then expand.** A pattern on the label you now have, then the
   relations out of what it returned. A typed relation is a **declared**
   proximity, chosen and reviewed by someone; nothing estimated beats it for
   *what is connected to this*.
3. **Compute.** `jq` over what came back. When the question is about the whole
   corpus — a ranking, a distribution, a threshold — load the whole thing:
   `kg nodes list | kg nodes --stdin --properties`, two calls, 148 ms at 171
   nodes against 113 ms for a single anchored pattern. **A corpus-wide question
   is within a third of a local one**, so there is no reason to approximate one
   into a sample.
4. **Come back with what you found — never with a blank question.** *Around
   which discussion?* hands the user back the work they arrived with. *There are
   `Decision` and `Note`, and three decisions mention the format — which?* hands
   them a choice. Same interruption, opposite value.
5. **Sweep the bodies last.** A filename is an id, so a phrase becomes resolved
   nodes in one pipe — 0.2 s over a few hundred files:

   ```bash
   grep -ril '<phrase>' .kg/nodes/ | sed 's|.*/||;s|\.md$||' \
     | kg nodes --stdin --properties
   ```

   The structure holds what someone chose to lift, and is therefore shaped by
   what has been asked before; the prose is not. That makes it the only unbiased
   reserve here, and the only one no pattern reaches.

**An empty result is a question, not an answer.** `[]` and exit `0` mean either
*the graph does not say it* or *nobody has lifted it yet*, and only step 5 tells
those apart. If the prose has it, say so and offer to lift it: a demand that has
just proved itself against the record is the honest moment to extract, and it is
not the same thing as a topic that merely came up.

## The answer is a document

A subgraph is not an answer. It is the material an answer is made of — the graph
carries no order, and an answer does. So what comes back from a search is a
**projection**: short, aimed at the question, and carrying three things that
stop it from being believed more than it should be.

**What it was projected from** — which patterns, which fallbacks, and what was
not consulted. A projection that loses the link to what it projected is the
failure the whole provenance apparatus exists to prevent, arriving one level up.

**What it dropped.** Being concise is a judgement, and what gets cut is where
bias enters. Saying *these three, and four more I judged off-topic* costs a
clause and restores the reader's ability to disagree.

**Which part is the graph's and which part is yours.** Flattening is where an
argument gets added — that is what a document is for, and it is also how a
reading gets laundered into a fact. Keep the line visible, the same way an
exhibit is kept separate from the thesis it supports.

And it is **not a node**. It reaches the graph only if the user says to keep it,
like everything else.

## Two memories is one too many

Claude Code carries an auto-memory of its own: a `memory/` directory it writes
to on its own judgement, with an index loaded into every session. That is the
opposite policy to the one above, and running both puts the same fact in two
places, one of which the user never chose.

Check it once, the first time the graph is used in a session:

```bash
jq -r '.autoMemoryEnabled // empty' .claude/settings.json ~/.claude/settings.json | head -1
ls ~/.claude/projects/*/memory/*.md 2>/dev/null | head
```

**Nothing printed means on** — it is the default, and the second command shows
what it has already written. Project settings win over the user's, so the first
file to answer is the effective one.

Recommend `"autoMemoryEnabled": false` **in this repository's
`.claude/settings.json`**, not the user's. Measured twice: it removes the memory
instructions from the session entirely rather than merely quieting them, and a
repository file overrides a user default left on. The scope is the point — the
conflict exists only where a space exists, a user-level switch would also
silence every project that has no graph, and a committed one travels with the
repository.

Files already under `memory/` stay where they are. They are markdown and worth
reading once before being abandoned — whatever is still true belongs in the
graph, and gets there like everything else: on request, piece by piece.

## First, three commands

```bash
kg labels list      # the words that classify a node
kg types list       # the words that name a relation
kg nodes list | head -1 | xargs -I{} kg node {} --properties
```

Roughly 0.2 s, and the vocabulary is in front of you. **Do this before writing a
pattern.** Measured across 23 models on a real query language: a request that
matches the schema succeeds 89% of the time, one that has to guess it, 17%. The
gap is the whole reason this section is first.

Words are **case-sensitive and stored as written** — `Person` and `person` are
two different labels, and a pattern spells what `labels list` prints.

## The division of labour

| | does |
|---|---|
| **a pattern** | structure and equality — labels, relation types, direction, property maps, paths |
| **`jq`** | comparison, presence, negation, aggregation, projection |

A pattern is the `MATCH`; the `jq` after it is the `RETURN`. There is no `WHERE`
clause — say it and the tool tells you so.

## Selecting

```bash
# every node carrying a word
kg nodes match '(:Movie)'

# equality, with or without a label
kg nodes match '({title: "Cloud Atlas"})'

# a relation — and both its ends come back
kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})'

# the same relation read from the other end — direction is the arrow, and a
# pattern pointing the wrong way matches nothing rather than guessing
kg nodes match '(:Movie)<-[:DIRECTED]-(:Person)'

# alternation, and a map on the relation itself
kg nodes match '(:Person)-[:ACTED_IN|DIRECTED]->(:Movie)'
kg nodes match '(:Person)-[:ACTED_IN {roles: "Neo"}]->(:Movie)'

# a chain, and a variable used twice is a join: acted in a film they directed
kg nodes match '(p)-[:ACTED_IN]->(m)<-[:DIRECTED]-(p)'

# several parts, for a node with three edges in the pattern — one chain cannot
# cover them without walking an edge twice, which the uniqueness rule forbids
kg nodes match '(p:Person)-[:ACTED_IN]->(:Movie), (p)-[:DIRECTED]->(:Movie)'

# a path into a structure
kg nodes match '(:Service {config.port: "8080"})'
```

**A pattern returns both ends of every relation it names**, resolved, as JSON —
so the anchor is in the result and the edges come back attached. Asking for one
side is the caller's `select`, which is why almost every recipe below has one.

**A relationship binds at most once inside one pattern.** That is what keeps a
two-hop pattern from coming back along the edge it arrived on — and it is why
*co-actors* excludes the actor themselves.

## Computing — the recipes

Every one of these was run against a 171-node graph.

```bash
# project one side
kg nodes match '(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})' \
  | jq -r '.[] | select(.labels | index("Person")) | .name'

# a comparison
kg nodes match '(:Movie)' | jq '[.[] | select((.released|tonumber) > 2000)] | length'

# a presence test
kg nodes match '(:Person)' | jq -r '[.[] | select(.born == null) | .name]'

# count by relation type, for one node
kg node "$ID" --properties \
  | jq '[.links[] | .type] | group_by(.) | map({(.[0]): length}) | add'

# a negated pattern, when it is about the node's own edges — one line
kg nodes match '(:Person)-[:ACTED_IN]->(:Movie)' \
  | jq '[.[] | select(.labels|index("Person"))
        | select((.links//[]) | any(.type=="DIRECTED" and .direction=="out") | not)]'
```

**A negative answer is about what was lifted, not about the world.**
`select(.born == null)` finds nodes where nothing was ever extracted into
`born`, which is not the same set as people with no birth year. The graph is
closed over what someone chose to write and open over the prose nobody has
mined yet, so say which one you are reporting: *of the nodes carrying this
property*, never *of the people*. The distinction costs a clause and is the
difference between a gap in the record and a fact about the world.

**Where `jq` alone stops.** The recipes above work because a resolved node
carries its own entries, with `type`, `direction` and `neighbour`. As soon as a
negated pattern constrains the **far** node, you need its properties too — and a
match returns only the subgraph it named:

```bash
# actors who directed no film released after 2010
kg nodes match '(:Person)-[:ACTED_IN]->(:Movie)' > sub.json
kg nodes list | kg nodes --stdin --properties > all.json
jq -s '(.[1] | INDEX(.id)) as $by
  | [ .[0][] | select(.labels|index("Person"))
      | select( [ (.links//[])[] | select(.type=="DIRECTED" and .direction=="out")
                  | $by[.neighbour] | select((.released|tonumber) > 2010) ] | length == 0 ) ]' \
  sub.json all.json
```

The whole graph loads in two calls — 171 nodes in about 0.2 s — so this is
ordinary rather than heroic at the sizes this tool is for.

## Writing

**Never hand-edit frontmatter.** Every rule here has a verb that keeps it by
construction, and a file edited by hand puts the rules back to being checked
afterwards, which is what the verbs exist to remove.

```bash
ID=$(kg node new --with-labels Decision)          # an id, on stdout
printf 'the prose\n' | kg node new --stdin --with-labels Decision

kg node "$ID" set title "The vocabulary is openCypher's"
kg node "$ID" set --stdin <<'JSON'
{ "status": "settled", "config": { "port": "8080" }, "sources": ["batch-12"] }
JSON
kg node "$ID" set config --stdin <<< '{"port": "9090"}'   # merged there
kg node "$ID" set config.tls.ca "here"                    # a scalar at a path

kg node "$ID" add sources rfc-7396      # a list grows without being restated
kg node "$ID" delete config.tls sources # several paths, any depth

kg node "$A" link --as SUPERSEDES --with-nodes "$B" --with-properties 'since=2026-09'
kg node "$ID" label Decision            # using a word is what creates it
printf 'what it means here\n' | kg type SUPERSEDES write --stdin
```

**A place and a thing.** Every write names where and what: `set title "x"` is a
path of length one, `set config --stdin` is a path and an object, `set --stdin`
is the root and an object. The merge is deep through maps and replaces a list
whole — `add` and `remove` are how a list's items move.

**A record is a document of properties**, so `kg link <id>` takes the same
`set`, `delete`, `add` and `remove`.

## The output is not an input

`--properties` prints the stored shape **plus** the resolution: `neighbour` is
computed, `labels` and `links` have their own verbs, and the plural form adds
`id`. The obvious round trip refuses rather than dropping them quietly:

```bash
kg node "$ID" --properties | jq 'del(.labels, .links) | .status = "live"' \
  | kg node "$ID" set --stdin
```

## Refusals worth knowing before you meet them

| | |
|---|---|
| `no such label: person — did you mean Person?` | the vocabulary is case-sensitive; `labels list` prints it |
| `a property is text, so write it quoted` | `{released: 2000}` never matches — the store holds text |
| `labels is reserved — written with \`label\`` | the tool's slots have their own verbs |
| `this verb takes a name, not a path` | `add` and `remove` are top-level; a nested list is replaced with `set` |
| `a pattern takes no condition` | that half is `jq`'s |
| `a variable-length path is not built` | `*1..3` — a fixed pattern plus one call per hop, today |

## Exit codes

`0` done · `1` refused, the argument broke a rule and nothing was read · `2`
absent, well-formed and not here · `4` the command's form is wrong.

**An empty answer is `[]` and exits `0`.** A query and its negation partition
the space: absence reads as false, so there is no third value to check for.

## If `kg` is not there

The binary is built rather than downloaded — `deno task --cwd tool compile` in
the plugin's repository, about 7 s the first time, with Deno the only
dependency. The session hook says so when it is missing or older than its
source.
