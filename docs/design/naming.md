# Naming

A key, a label word, a relation type and a value are four vocabularies with four
different deciders. They used to share one rule. They no longer do, and the
split is what this page is about.

**Two goals, and they stopped pointing the same way.** A name must avoid what
needs quoting — that is the old goal, and it still decides keys and filenames.
But a label word must also be spellable inside a `kg match` pattern **without a
backtick**, and that rule is openCypher's rather than ours.

## The guide

| what | form | who decides | enforced |
|---|---|---|---|
| a command, a flag | `nodes match`, `--with-labels` | the tool | it is the tool's own word |
| a **key** | `validUntil`, `release_date` — same rule as a word; camelCase is the house form | the author; the tool when it writes | at the door |
| a **label word**, a **relation type** | `Person`, `ACTED_IN` — openCypher's `UnescapedSymbolicName` | the author, **form included** | at the door |
| a **value** | `Cloud Atlas`, `github-issue-412` | the author | one line, printable — nothing else |
| a **label's file**, a **type's file** | `person.md`, `acted-in.md` — the slug of the word | the tool, derived | a collision refuses |
| a `.ts` file | `frontmatter_test.ts` | Deno | — |
| a `.md` file | `query-language.md` | a URL | — |

**Two levels of constraint, not three.** A key, a label word and a relation
type share one rule, and within it the author picks the word *and its form* —
camelCase and PascalCase are what the tool writes, never what it demands. A
value has no separator rule at all. The filenames under `labels/` and `types/`
are nobody's: they are computed, and they are the only names here that nobody
types.

### A key: the same rule as a word, and camelCase as a house form

**One rule for all three vocabularies** — `/^[\p{ID_Start}_][\p{ID_Continue}]*$/u`,
the same as a label word. camelCase is what the tool writes, what it prints in
examples and what it suggests. It is not a gate.

It used to be one, and that was the measurement below being read as answering a
question it does not ask. Hugo, Astro and Google say **what form to write**;
none of them says what to refuse. Promoting a house form into a door is the same
slip as the kebab label one rung lower.

**What the gate cost.** GitHub's API — 86 keys, 68 with an underscore, counted
in the table below — is an entire vocabulary it refused. Importing such a graph
would mean renaming every key on the way in, which is the translation this page
removed for labels.

**What it bought: nothing measurable.** `releaseDate` and `releasedate` both
pass any shape rule, so the fragmentation a gate is imagined to prevent is not
the fragmentation that occurs. And a key names no file, so there is no slug for
it to collide in.

**And the label floor does not transpose.** Labels are a closed, enumerable set
— `kg labels list` — so an unknown word can be refused with its near neighbour
named. Keys are open: any node may carry any key. A mistyped key therefore falls
into two-valued absence and matches nothing, silently, and refusing unknown keys
would break the `find 'p'` / `find 'not p'` partition that
[absence](absence.md) exists for. The shape rule protects a key in neither
direction, so the permissive one is preferred for not blocking real data.

**Typed and stored alike, which the relaxation does not touch.** `set validUntil`
writes `validUntil:`; `set release_date` writes `release_date:`. Nothing is
translated either way, so what a command prints is what the next command takes.
That symmetry was always the real argument, and it never needed a single form.

**What stays refused is exactly openCypher's list**, which is why adopting it
costs nothing that was being protected:

| refused | why, and why Cypher refuses it too |
|---|---|
| `valid-until` | `o.valid-until` is a **subtraction** in JavaScript; Cypher needs a backtick for the same reason |
| `2fa` | a leading digit is ambiguous with a numeral in the `find` grammar, and `ID_Start` excludes it |
| `with.dot`, `with space`, `""` | not an identifier anywhere |

Two pinned cases flip from refused to accepted: `Title` and `valid_until`.

### A label word, a relation type: openCypher's, verbatim

```
UnescapedSymbolicName = IdentifierStart, { IdentifierPart }
IdentifierStart       = ID_Start | Pc        a letter, or _
IdentifierPart        = ID_Continue | Sc     letters, digits, _
```

which is `/^[\p{ID_Start}_][\p{ID_Continue}]*$/u`. Stored as written, case
included. Three reasons, in order of weight.

**A name must never need quoting.** Anything outside that set has to be escaped
in Cypher — `` [:`acted-in`] `` — and the reason to refuse it is the one this
page opens with rather than a compatibility claim: **a word two people must
arrive at independently cannot be one that needs quotes.** Cypher's escape rule
is evidence that the line is in the right place, not the rule this follows.

**The relationship to openCypher is inspiration, not conformance.** What is
borrowed is a grammar a great many people already know; what is not promised is
that everything written here runs there. `kg nodes match` already means to break
it in one place — a property **path** like `{config.port: "x"}`, which openCypher
cannot express at all, having no nested property. That is deliberate, and it
fails at *their* parser rather than meaning something else there, which is the
behaviour to want from a divergence.

**The failure it removes is a silence, not a friction.** The movies dataset is
the most reproduced graph example there is, so a Cypher-trained agent writes
`(:Person)-[:ACTED_IN]->(:Movie)` unprompted. Against a case-folded store that
returns **zero nodes, exit 0** — a plausible answer to the wrong question, which
is the exact failure [batch 4](../batches/4-stops-guessing.md) removed `--where`
for producing. Cypher is explicit that this is not a style matter: *"`:PERSON`,
`:Person` and `:person` are three different labels"*.

**The form it replaces was not a convention, it was an artefact.**
`conformance/convert.ts` reached the old vocabulary through

```js
s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase()
```

— a **one-way** function: `acted-in` may have come from `ACTED_IN`, `acted_in`
or `actedIn`, and nothing on disk says which. What looked like the store's own
vocabulary was Neo4j's, hashed.

**Digits are not restricted, and that is a measurement rather than a
preference.** In schema.org — 1010 classes, 1676 properties, counted
2026-09-14 — exactly **one** native class carries a digit, `3DModel`, and its
digit is leading, so `ID_Start` already refuses it unescaped. The digits that do
occur live in *keys*: `gtin12`, `gtin8`, `percentile90`, `isicV4`, `iso6523Code`,
`emissionsCO2`, `sha256`, `cvdNumC19Died` — all of which `NAME` already accepts.
So a rule forbidding digits in labels would guard against roughly one word per
thousand while remaining a refusal somebody can hit. A rule whose deletion
changes nothing observable is not worth having.

The caveat: schema.org is a web-content vocabulary, and a technical graph need
not share its distribution. It is the largest sample available, and it points
one way.

### The slug: the filename is computed, never typed

The word no longer names its file. It lives in the record's own frontmatter —
`labels/<slug>.md` for a label, `types/<slug>.md` for a relation type — and the
file gets a derived name:

```js
const slug = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
  .replace(/([a-z])([A-Z])/g, "$1-$2")
  .replace(/([A-Za-z])([0-9])/g, "$1-$2")
  .replace(/([0-9])([A-Za-z])/g, "$1-$2")
  .replace(/_/g, "-").toLowerCase()
  .replace(/-+/g, "-").replace(/^-|-$/g, "");
```

`Person` → `labels/person.md`, `ACTED_IN` → `types/acted-in.md`, `Oauth2Token` →
`oauth-2-token.md`, `Décision` → `decision.md`. The two directories are separate
namespaces, so a label and a type may share a word without colliding.

**Its job is not to be pretty, it is to collide.** Two words a reader cannot
tell apart must land on one filename, where creating the second **refuses**.
That inverts the defect above: the same lossiness that made `convert.ts` wrong
as a translation is exactly what makes it right as a slug.

Measured on the filesystem this runs on, 2026-09-14: `Person.md` and `person.md`
are **one file**, last writer wins, silently. That is what the slug has to
prevent, and why lowercasing is not optional.

Four candidate rules were tried against the confusable pairs. Each of the three
rejected ones fails a group the others catch:

| rule | splits on | misses |
|---|---|---|
| `([a-z0-9])([A-Z])` — the old `convert.ts` | right edge of a digit only | `P2P`/`P2p`, `Sha256`/`SHA256` |
| `([a-z])([A-Z])` alone | camel only | `X509Cert`/`X509_Cert`, `Oauth2Token`/`OAUTH2_TOKEN` |
| `_` only, no camel split | separators only | `VehicleOwner`/`VEHICLE_OWNER` |
| **camel + both digit edges** | all four | — |

The rule behind the rule: **a clause may be case-sensitive only if the boundary
it detects has a second spelling that is not.** The camel clause survives
because the all-caps style writes the same boundary with `_`, and the underscore
clause catches it. A digit boundary has no such fallback — `SHA256` carries no
separator — so both digit clauses must be blind to case, `[A-Za-z]` on each
side.

Diacritics are stripped rather than kept. An accented filename returns exactly
the soft ground the slug exists to avoid — case folding of diacritics is the
least consistent part of a filesystem — and the collision it creates between
`Decision` and `Décision` is a pair that should be refused, not filed twice
under names an `ls` does not separate.

### A value: the author's, and untouched

One line of printable text, and no separator rule at all. `Cloud Atlas`,
`github-issue-412`, `2027-01-01` — [storage](../spec/storage.md) says properties
are **stored as given and never retyped**, and that is the whole rule.

## What the evidence says

Measured at the sources rather than from memory.

| | camelCase | snake_case | kebab-case |
|---|---|---|---|
| markdown frontmatter | [Hugo](https://gohugo.io/content-management/front-matter/) — `expiryDate`, `linkTitle`, `publishDate`; [Astro](https://docs.astro.build/en/guides/content-collections/) — `pubDate`, `updatedDate` | — | **nobody** |
| JSON | [Google's style guide](https://google.github.io/styleguide/jsoncstyleguide.xml) — *"property names must be camel-cased"* | GitHub's API — **86 keys, 68 with an underscore, zero capitals**; Stripe, OpenAI, Twilio | **nobody** |
| CLI long options | — | — | git **18**, underscore **0**; deno 4, underscore 0 |
| CLI argument keys | git — **632** config variables with an internal capital | git — 1 | npm — all of them; git — 7 |

**No medium has a single convention except flags.** Frontmatter is camelCase,
JSON splits by ecosystem, and CLI argument keys split too — git camelCase by 632
to 7, npm kebab throughout. So every argument of the form *that is the
convention* is weak, and this page does not make one.

**camelCase as the house form for a key** — the only form that fits both data
media, winning markdown frontmatter outright and tying JSON, where snake wins
neither. A *form to write*, not a form to demand: the row above is also the
measurement that says a gate would refuse two thirds of GitHub's vocabulary.
What no medium ships is a kebab key, and that one is mechanical: `o.valid-until`
is a **subtraction** in JavaScript.

**kebab for commands and flags**, the one place the measurements are unanimous.

### What openCypher enforces, and what it merely recommends

Read at the [Cypher manual](https://neo4j.com/docs/cypher-manual/current/syntax/naming/)
and the [openCypher grammar](https://s3.amazonaws.com/artifacts.opencypher.org/M23/railroad/SymbolicName.html),
because the difference decides how much of it binds us.

| | |
|---|---|
| **enforced** | a name starts with a letter or `_`; anything else needs backticks; names are **case-sensitive** |
| **recommended only** | labels PascalCase — *"capitalized words, no separators"*; relation types SCREAMING_SNAKE — *"upper case, underscores as separators"*; properties camelCase |

Only the first row binds. The second is why `ACTED_IN` rather than `actedIn`
appears in every example — the underscore avoids a backtick, which is the
tokenizer choosing, not taste.

## What this page has dropped, twice

**A key typed in kebab and stored in camelCase**, translated at the file. Two
things propped it up and went with it: a tightened name rule, needed only so the
translation could be reversed, and an asymmetry where a caller read `validUntil`
and had to type `valid-until`. It failed loudly rather than silently, which is
the right way to fail — but not failing at all is better.

**camelCase as a gate on keys.** The form survives as what the tool writes; what
went is its power to refuse. It had been promoted out of a table measuring what
other people *write*, and it was refusing vocabularies — most of GitHub's — that
nothing in this tool had a reason to reject.

**A label word in kebab, "because it names a file".** The premise was true and
is now gone: the word does not name the file, the slug does. The reasoning was
sound — a case-insensitive filesystem merges `actedIn.md` with `actedin.md` —
but it answered *how should a filename be shaped*, and got applied to *how
should a word be spelled*. Two questions, and the second one belongs to whoever
has to type the word again later.

Both drops have the same shape: a constraint from one layer had been promoted
into the vocabulary of another.

## What is still enforced, and where

| | |
|---|---|
| a key, at the argv door | `UnescapedSymbolicName` — the same rule as a word |
| a key, at the reading door | the same rule — *a block is read only if the tool could have written it* |
| a label word, a relation type, at the argv door | `UnescapedSymbolicName` — refuse anything a pattern would have to backtick |
| a label word or a relation type, at creation | its slug must be free **within its own directory**; a collision names the word already holding it |
| a label word or a relation type, at match time | an unknown word **refuses and names its near neighbour** — `no such label: person — did you mean Person?` — never returns empty; both halves read a directory rather than scanning records |
| a value | one line, printable — the rule it already had |

**The match-time row is the floor.** It holds whatever else is decided, because
the cost of a vocabulary mismatch is never paid when the word is written — it is
paid by the next reader, as a result that looks like an answer. It is also the
protection a key cannot have, keys being an open set: there, the same mistake
stays silent by design, and [absence](absence.md) is where that is argued.

---

[docs](../README.md) · [design](README.md) · [spec](../spec/) · [batches](../batches/)
