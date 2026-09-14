import { parse as parseYaml, stringify as toYaml } from "@std/yaml";
import { validate as isUuid } from "@std/uuid";

/**
 * What a node file is made of, and nothing about where it lives.
 *
 * Pure by design: every case here — a missing fence, a value that must not be
 * retyped, a list against a scalar that merely looks like one — is cheap to
 * reach with a string and expensive to reach through a filesystem and a
 * command line.
 */

/**
 * A node is a frontmatter block and a body, and the block is written even when
 * it holds nothing, so a node is always well-formed and this reader can stay
 * strict.
 *
 * LF only. `space init` writes a `.gitattributes` that stops git converting,
 * and nothing else writes here — so tolerating CRLF would only half-handle a
 * file that cannot occur, which is worse than refusing it.
 */
const OPEN = /^---[ \t]*\n([\s\S]*?)---[ \t]*(?:\n([\s\S]*))?$/;

/**
 * A key: `validUntil`, camelCase, and **the same string typed and stored**.
 *
 * Nothing needing quoting or escaping, which is what rules out spaces and
 * punctuation. camelCase because that is what markdown frontmatter writes
 * (Hugo, Astro) and because kebab cannot be a key at all — `o.valid-until` is a
 * subtraction in JavaScript, which is why no API ships one.
 *
 * It begins lowercase so that the first character is never a case decision;
 * after that a capital is a word boundary and nothing else.
 * `docs/design/naming.md` has the measurements.
 */
const NAME = /^[a-z][a-zA-Z0-9]*$/;

/** A label word, a relation type: kebab, because the word names a file, and a
 * case-insensitive filesystem would merge `actedIn.md` with `actedin.md`. */
const WORD = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A value is a single line of printable text. The reason is what a property is
 * *for*, not storage and not rendering: **a value wanting several lines is
 * content, and content is what the body is for.** A node has two halves
 * precisely so the long one has somewhere to go.
 *
 * One thing the rest of the surface leans on follows from it: a value cannot
 * hold a tab, so every tab-separated output is lossless by construction.
 */
// deno-lint-ignore no-control-regex -- matching control characters is the point
const CONTROL = /[\x00-\x1F\x7F]/;

/** Noncharacters are not characters — permanently unassigned, and reserved for
 * a process's internal use rather than for interchange. Nobody types one; a
 * value acquires one by being pasted out of something damaged, and it would
 * then travel intact all the way to the output. `\uFDD0`–`\uFDEF`, and the last
 * two code points of every plane, which is what the mask catches. */
const NONCHARACTER = /[\uFDD0-\uFDEF]/;
const noncharacter = (s: string): boolean => {
  if (NONCHARACTER.test(s)) return true;
  for (const character of s) {
    if ((character.codePointAt(0)! & 0xFFFE) === 0xFFFE) return true;
  }
  return false;
};

export const isName = (s: string): s is Name => NAME.test(s);

/**
 * Names the tool holds facts under, which a property may not shadow. `body` is
 * the node's other half; `created` is arithmetic on its filename. A property
 * carrying either name would sit beside the fact rather than being it.
 *
 * The grammar's own keywords are not here — they belong to the parser that
 * needs them, and reserving a name is permanent.
 */
const RESERVED: Record<string, string> = {
  body: "it is the node's content, written with `write`",
  created: "it is read from the id, and cannot be written",
  labels: "it is how a node classifies, written with `label`",
  links: "it is how a node relates, written with `link`",
};

export const reservedReason = (name: string): string | undefined => RESERVED[name];

/**
 * A checked string is a different type from any other string.
 *
 * TypeScript is structurally typed, so `type Name = string` is an alias and
 * protects nothing. The phantom property makes the shapes differ; it is erased
 * at runtime, so a `Name` *is* a string and costs nothing. What it buys is that
 * the guard below becomes the only way to obtain one — the check stops being a
 * rule someone has to remember and becomes the only route to the type.
 *
 * `docs/design/boundaries.md` is the argument. The two manufacturers are a
 * guard, and a generator that produces a legal value by construction.
 */
declare const brand: unique symbol;
export type Branded<T extends string> = string & { readonly [brand]: T };

/** A key: camelCase, beginning lowercase, the same typed and stored. */
export type Name = Branded<"Name">;
/** A word a node carries: kebab, because the word names a file. A different
 * namespace from a key too — a label may be called `body` without shadowing
 * anything. */
export type Label = Branded<"Label">;
/** One value: a single line of printable text. */
export type Text = Branded<"Text">;

export type Uuid = Branded<"Uuid">;

/** Why a string is not a value, for a refusal that names the right cause. The
 * guard answers yes or no; a caller told *contains a control character* about a
 * noncharacter would go looking for the wrong thing. */
export function notAValue(s: string): string | undefined {
  if (CONTROL.test(s)) return "contains a control character";
  if (noncharacter(s)) return "contains a noncharacter";
  return undefined;
}

export const isValue = (s: string): s is Text => !CONTROL.test(s) && !noncharacter(s);
export const isLabel = (s: string): s is Label => WORD.test(s);
/** Any uuid is well formed, not only the v7 this tool mints — a v4 is a
 * plausible id it never issued, which makes it honestly absent rather than
 * refused. */
export const isId = (s: string): s is Uuid => isUuid(s);

/** A property holds one value or several. Several is multiplicity on one
 * dimension, not a container — which is why the shape follows from the verb
 * that wrote it rather than from anything the tool infers. */
/** A node's end of a relation. The record holds the relation itself; this entry
 * is what makes both directions a single node read. `type` and `direction` are
 * duplicated from the record deliberately — grouping then costs no record reads,
 * and the record stays authoritative if they ever disagree. */
export type Direction = "out" | "in";
export type Entry = {
  readonly type: Label;
  readonly link: Uuid;
  readonly direction: Direction;
};

export type Value = Text | Text[] | Entry[];
export type Properties = Record<Name, Value>;

/** A list of values, which a list of relations is not. */
export const isList = (value: Value | undefined): value is Text[] =>
  Array.isArray(value) && value.every((each) => typeof each === "string");

export const isLinks = (value: Value | undefined): value is Entry[] =>
  Array.isArray(value) && value.every((each) => typeof each === "object");

export type Split = { readonly frontmatter: string; readonly content: string };

export function split(raw: string): Split | undefined {
  // `exec` hands back a null; it does not travel past this line.
  const match = OPEN.exec(raw);
  if (match === null) return undefined;
  const content = match[2] ?? "";
  // The fence is followed by one blank line, belonging to neither half.
  return {
    frontmatter: match[1] ?? "",
    content: content.startsWith("\n") ? content.slice(1) : content,
  };
}

export const join = (frontmatter: string, content: string): string =>
  `---\n${frontmatter}---\n\n${content}`;

export type Read =
  | { readonly kind: "properties"; readonly properties: Properties }
  | { readonly kind: "unreadable"; readonly reason: string };

const unreadable = (reason: string): Read => ({ kind: "unreadable", reason });

/**
 * Scalars are read under YAML 1.2 core — the default schema turns
 * `2027-01-01` into a date, which would be the tool deciding what a field it
 * has never heard of means.
 *
 * **This door enforces the same vocabulary as the writing one.** A name or a
 * value the tool could never write is refused here rather than loaded, because
 * loading it produces a property that displays and cannot be unset — see
 * `docs/design/boundaries.md`. Reserved names are deliberately not part of that:
 * `body` is a name the tool can represent perfectly and declines to write, which
 * is a different thing from one it has no way to hold.
 *
 * The refusal names the property, since the block is the caller's to fix and
 * "something in here is wrong" does not tell them where.
 */
export function read(frontmatter: string): Read {
  if (frontmatter.trim() === "") return { kind: "properties", properties: {} };
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter, { schema: "core" });
  } catch {
    return unreadable("the block is not YAML");
  }
  // A YAML null is recognised here so it can be refused — the one place the
  // word appears in this tool's own vocabulary, and it stops here.
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return unreadable("the block is not a mapping");
  }

  const out: Properties = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (!isName(name)) {
      return unreadable(`${name} is not a property name`);
    }
    // `links` is the one nested shape in the format, and the format owns it:
    // an author still cannot nest, and this is validated against exactly the
    // three fields the tool writes.
    if (name === "links") {
      const entries = readLinks(value);
      if (typeof entries === "string") return unreadable(entries);
      out[name] = entries;
      continue;
    }
    if (Array.isArray(value)) {
      // An empty list is a key carrying nothing — present, with no value on
      // that dimension. `remove` deletes a key rather than leaving one, so the
      // tool never writes this; refusing it keeps absent and present-but-empty
      // from being two different ways to be absent.
      if (value.length === 0) return unreadable(`${name} is an empty list`);
      if (value.some((each) => each === null || typeof each === "object")) {
        return unreadable(`${name} holds something that is not a value`);
      }
      // `every` with a guard narrows the array, so the check that refuses is
      // also the thing that produces the typed value.
      const values = value.map(String);
      if (!values.every(isValue)) {
        return unreadable(`${name} holds a value with a control character`);
      }
      out[name] = values;
    } else if (value === null || typeof value === "object") {
      return unreadable(`${name} has no value`);
    } else {
      const text = String(value);
      if (!isValue(text)) {
        return unreadable(`${name} holds a value with a control character`);
      }
      out[name] = text;
    }
  }
  return { kind: "properties", properties: out };
}

/**
 * Keys alphabetical, and block style — the YAML a person writes by hand, which
 * is what every markdown frontmatter in the wild uses.
 *
 * It was `flowLevel: 1` until [batch 10](../../docs/batches/10-one-writer.md),
 * chosen when a list was a list of words and justified as keeping diffs
 * minimal. Lists of maps arrived with relations and the argument inverted:
 * adding one link rewrote a line that grows with the node's degree. `labels`
 * costs a line; that was the only case flow style won.
 *
 * The tool is the only writer, so canonical output costs nothing — and the
 * serialiser quotes exactly what would otherwise change meaning coming back,
 * which is what tells a list from a scalar that looks like one.
 */
export const write = (properties: Properties): string =>
  Object.keys(properties).length === 0
    ? ""
    : toYaml(properties, { sortKeys: true, lineWidth: -1 });

/** Several mappings as one YAML sequence — the plural of `write`, and the same
 * canonical rules. An empty list prints nothing, as an empty node does. */
export const writeEach = (each: readonly Properties[]): string =>
  each.length === 0 ? "" : toYaml(each, { sortKeys: true, lineWidth: -1 });

/** The entries, or why they will not read. */
function readLinks(value: unknown): Entry[] | string {
  if (!Array.isArray(value)) return "links is not a list of relations";
  const entries: Entry[] = [];
  for (const each of value) {
    if (each === null || typeof each !== "object" || Array.isArray(each)) {
      return "links holds something that is not a relation";
    }
    const { type, link, direction, ...rest } = each as Record<string, unknown>;
    const extra = Object.keys(rest)[0];
    if (extra !== undefined) return `a relation has no field ${extra}`;
    if (typeof type !== "string" || !isLabel(type)) {
      return `not a relation type: ${
        String(type)
      } — expected a lowercase hyphenated token`;
    }
    if (typeof link !== "string" || !isId(link)) {
      return `not a link id: ${String(link)} — expected a uuid`;
    }
    if (direction !== "out" && direction !== "in") {
      return `not a direction: ${String(direction)} — expected out or in`;
    }
    entries.push({ type, link, direction });
  }
  return entries;
}
