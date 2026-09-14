# Naming

A name is a property name, a label word or a relation type — the three share one
rule, because all three are words somebody has to arrive at independently and
type again later.

**Lowercase, and no character that needs quoting.** That part was never in
doubt: `Title` and `title` as two different properties is a trap, and a name
needing quotes is one that will eventually be typed wrong and fail by silently
matching nothing.

What was never argued is the **separator**, and the rule shipped in kebab on the
strength of nothing. This page settles it.

## One convention per medium, and they are not the same medium

| | | |
|---|---|---|
| **command line** | `valid-until` | kebab, as `--with-labels` already is |
| **frontmatter, JSON, filenames** | `valid_until` | snake |

A flag is the tool's own word and a property name is the author's, so nothing
forces them to agree — but on the command line they sit in the same sentence,
and kebab is what a command line is written in.

Everything a machine reads is snake, and that is one convention rather than
two: the file, the JSON a command prints, and the name of a label's file.

## What the evidence says

Measured 2026-09-14, at the sources rather than from memory.

| | camelCase | snake_case | kebab-case |
|---|---|---|---|
| markdown frontmatter | [Hugo](https://gohugo.io/content-management/front-matter/) — `expiryDate`, `linkTitle`, `publishDate`; [Astro](https://docs.astro.build/en/guides/content-collections/) — `pubDate`, `updatedDate` | — | **nobody** |
| JSON | [Google's style guide](https://google.github.io/styleguide/jsoncstyleguide.xml) — *"property names must be camel-cased"* | GitHub's API — **86 keys, 68 with an underscore, zero capitals**; Stripe, OpenAI, Twilio | **nobody** |
| CLI flags | — | — | **the norm** |

**Kebab is standard for flags and nowhere else.** The rule had taken the
convention of one medium and applied it to another.

**And camelCase cannot be taken**, though the frontmatter world uses it, because
it needs capitals and the lowercase rule is the better-argued of the two. Losing
`Title` ≠ `title` costs more than matching Hugo.

**JSON has no single convention to follow** — it splits by ecosystem, Google one
way and the Python/Ruby lineage the other — so nothing is being crossed by
choosing snake there.

## Why snake and not kebab, once camelCase is out

**`o.valid_until` is an accessor; `o.valid-until` is a subtraction.** In
JavaScript the second is a `ReferenceError`, which is why no API ships kebab
keys and why a caller would have to write `o["valid-until"]` everywhere.

**No capitals means a label's filename cannot collide.** macOS is
case-insensitive by default: writing `actedIn.md` and then `actedin.md` leaves
one file, silently, with the second one's content. Under camelCase a space's
vocabulary would depend on the filesystem it sits on — distinct on Linux, merged
here. Snake has no capitals, so the question does not arise.

## The translation is a character substitution

`-` ↔ `_`, total and trivially reversible, with no edge case to reason about.
That is worth more than it sounds: snake ↔ camelCase is **not** total —
`isCJKLanguage` has no unique antecedent — and would have needed the read door's
*a block is read only if the tool could have written it* rule to stay honest.

Both regular expressions are the same shape, one character apart:

```
surface   [a-z0-9]+(-[a-z0-9]+)*
stored    [a-z0-9]+(_[a-z0-9]+)*
```

So a stored name is legal exactly when it is the image of a surface name, and
the read door keeps refusing anything else — unchanged in what it does, and now
with something to compare against.

**An expression is surface.** `find 'valid-until > 2020'` is typed by a caller,
so it is kebab, and the rule that tells `-0.5` from `valid-until`
([batch 9](../batches/9-find.md)) stays exactly as it is.

**A value is not a name.** `sources: [github-issue-412, rfc-7396]` is untouched:
values are single-line printable text and carry no separator rule at all.

---

[docs](../README.md) · [design](README.md) · [spec](../spec/) · [batches](../batches/)
