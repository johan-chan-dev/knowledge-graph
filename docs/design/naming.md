# Naming

A name is a property name, a label word or a relation type — the three share one
rule, because all three are words somebody has to arrive at independently and
type again later.

**The point is to avoid what needs quoting**, not to have a house style. Once a
space is excluded, the separator is decided by **whoever reads the name**, and
that is a different reader in each place.

## The guide

| what | form | who decides | enforced |
|---|---|---|---|
| a command, a flag | `find`, `--with-labels` | the tool | it is the tool's own word |
| a **key** | `set validUntil 2027`, `validUntil: 2027` | the tool | at the door |
| a **label word**, a **relation type** | `acted-in` | the author picks the word, **not its form** | at the door |
| a **value** | `Cloud Atlas`, `github-issue-412` | the author | one line, printable — nothing else |
| a `.ts` file | `frontmatter_test.ts` | Deno | — |
| a `.md` file | `query-language.md`, `acted-in.md` | a URL | — |

Three levels of constraint, not two. A key's form is the tool's; a label word's
form is the tool's while the word itself is the author's; a value is the
author's entirely.

### A key: one form, typed and stored alike

camelCase, and **the same string in both places** — `set validUntil` writes
`validUntil:`. Nothing is translated, so nothing has to be reversible, and what
a command prints is what the next command takes.

That symmetry is the argument. A translation the caller performs in their head
is where errors come from, and the caller here is mostly a model reading one
command's output to build the next.

An earlier version of this page had the key typed in kebab and stored in
camelCase. It was defended on the strength of a **lowercase** rule that
`frontmatter.ts` never argued either — the comment there justifies *nothing
needing quotes*, and says nothing about capitals. Two unargued rules propping
each other up is not a reason.

### A label word: kebab, and that follows rather than being chosen

**It is a filename.** `label.ts` puts it as *the file **is** the word*, so the
word has to be safe as one — which decides its form twice over:

- **lowercase**, because a case-insensitive filesystem merges `actedIn.md` and
  `actedin.md` into one file, silently, holding whichever was written last. A
  space's vocabulary would depend on the filesystem under it.
- **kebab**, because that is already the rule for a `.md` file.

So this row is not a fourth decision — it is the two rows below it, applied to a
word that happens to name a file. And because it is a filename, the form cannot
be left to taste: the door enforces it.

### A value: the author's, and untouched

One line of printable text, and no separator rule at all. `Cloud Atlas`,
`github-issue-412`, `2027-01-01` — [storage](../spec/storage.md) says properties
are **stored as given and never retyped**, and that is the whole rule.

## What the evidence says

Measured 2026-09-14, at the sources rather than from memory.

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

**camelCase for keys, because it is the only choice that fits both data media.**
It wins markdown frontmatter outright and ties JSON; snake wins neither. And
kebab is impossible in either: `o.valid-until` is a **subtraction** in
JavaScript, which is why no API ships kebab keys.

**camelCase for a key, typed and stored alike.** It is the only form that fits
both data media — it wins markdown frontmatter outright and ties JSON, where
snake wins neither. And kebab cannot be a key in either: `o.valid-until` is a
**subtraction** in JavaScript, which is why no API ships one.

**kebab for a label word**, because it is a filename, and filenames here are
kebab for the reason `.md` files are.

**kebab for commands and flags**, which is the one place the measurements are
unanimous.

## What this drops, and why that is a gain

An earlier version had a key typed in kebab and stored in camelCase, translated
at the file. Two things existed only to hold that up, and both go with it:

**The tightened name rule.** `a-2x` and `a2x` are different names that both
become `a2x`, so a segment after the first had to begin with a letter for the
translation to be reversible. With one form there is nothing to reverse and
nothing to forbid.

**The asymmetry.** A caller read `validUntil` and had to type `valid-until`.
It failed loudly rather than silently, which is the right way to fail — but not
failing at all is better, and a translation performed in the caller's head is
where errors come from. The caller here is mostly a model reading one command's
output to build the next.

## What is still enforced, and where

The doors do not change in what they do, only in what they compare against.

| | |
|---|---|
| a key, at the argv door | the key's form |
| a key, at the reading door | the same form — *a block is read only if the tool could have written it* |
| a label word, at the argv door | the filename-safe form, because the file is the word |
| a value | one line, printable — the rule it already had |

---

[docs](../README.md) · [design](README.md) · [spec](../spec/) · [batches](../batches/)
