# Naming

A name is a property name, a label word or a relation type — the three share one
rule, because all three are words somebody has to arrive at independently and
type again later.

**The point is to avoid what needs quoting**, not to have a house style. Once a
space is excluded, the separator is decided by **whoever reads the name**, and
that is a different reader in each place.

## One reader, one convention

| what | how | read by |
|---|---|---|
| CLI commands and flags | `--with-labels`, `set valid-until` | a command line |
| a **key**, in frontmatter or JSON | `validUntil` | a program |
| a **value** | `acted-in`, `github-issue-412` | nobody — stored as given |
| a `.ts` file | `frontmatter_test.ts` | Deno |
| a `.md` file | `query-language.md`, `acted-in.md` | a URL |

**A label's file is not a separate rule.** It is a markdown file and it is
kebab, like every other one — but for a different reason: nobody chose the name.
`label.ts` puts it as *the file **is** the word*, and a word is kebab by its own
rule, so the two can never disagree.

**Only keys are translated.** Everything else in a file is the author's data,
and [storage](../spec/storage.md) already says properties are **stored as given
and never retyped** — so a label word arrives as `acted-in` and stays
`acted-in`, in the `labels` list, in a link entry's `type`, in a record, and as
the name of its file. Translating it would be retyping it.

That leaves a file carrying two shapes, and that is the honest reading rather
than an oversight: `validUntil` is a key the tool wrote, `acted-in` is a word
the author chose.

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

**kebab on the command line, because a flag is kebab and they share a
sentence.** `set valid-until … --with-labels x` reads as one thing. That
consistency is the whole reason, and it does not extend past the command line.

## The lowercase rule survives, because it governs what is typed

`Title` and `title` as two different properties is a trap, and the rule against
it is the better-argued of the pair. camelCase does not threaten it: the capital
exists only in the **stored** key, which the tool produces and nobody types. A
`ValidUntil:` written by hand is refused by the reading door, as any name the
tool could not have written already is.

It is also why a label's word is never camelCase. A word is a value, and its
file is named after it — and on a case-insensitive filesystem `actedIn.md` and
`actedin.md` are **one file**, silently, holding whichever was written last. A
space's vocabulary would depend on the filesystem under it.

## The translation, and the one thing it costs

`valid-until` ↔ `validUntil`, and the shapes are the same segments:

```
name   [a-z0-9]+(-[a-z][a-z0-9]*)*
key    [a-z0-9]+([A-Z][a-z0-9]*)*
```

**A segment after the first begins with a letter.** Without that, `a-2x` and
`a2x` are both names and both become `a2x` — one of them could never be read
back. That shape is the only thing the rule loses; `2fa`, `v2-index` and
`valid-until` are all still names.

So a stored key is legal exactly when it is the image of a name, and the reading
door keeps refusing anything else — unchanged in what it does, and now with
something to compare against.

**An expression is surface.** `find 'valid-until > 2020'` is typed by a caller,
so it is kebab, and the rule that tells `-0.5` from `valid-until`
([batch 9](../batches/9-find.md)) stays exactly as it is.

---

[docs](../README.md) · [design](README.md) · [spec](../spec/) · [batches](../batches/)
