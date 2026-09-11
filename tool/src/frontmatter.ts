import { parse as parseYaml, stringify as toYaml } from "@std/yaml";

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

/** A lowercase hyphenated token. Anything needing quoting or escaping is a name
 * that will eventually be typed wrong and fail by silently matching nothing. */
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A value is a single line of printable text. A newline breaks the output
 * contract — properties render one per line — and a tab renders identically to
 * spaces, so two values that look the same would not match a filter. A value
 * wanting several lines is content, which is what the body is for.
 */
// deno-lint-ignore no-control-regex -- matching control characters is the point
const CONTROL = /[\x00-\x1F\x7F]/;

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

/** A property name the tool could write: a lowercase hyphenated token. */
export type Name = Branded<"Name">;
/** A word a node carries. Same shape as a name — a word two people must arrive
 * at independently cannot be one that needs quoting — but a different thing, and
 * a different namespace: a label may be called `body` without shadowing anything. */
export type Label = Branded<"Label">;
/** One value: a single line of printable text. */
export type Text = Branded<"Text">;

export const isValue = (s: string): s is Text => !CONTROL.test(s);
export const isLabel = (s: string): s is Label => NAME.test(s);

/** A property holds one value or several. Several is multiplicity on one
 * dimension, not a container — which is why the shape follows from the verb
 * that wrote it rather than from anything the tool infers. */
export type Value = Text | Text[];
export type Properties = Record<Name, Value>;

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

/** Keys alphabetical, `flowLevel: 1` so a list stays on one line. The tool is
 * the only writer, so canonical output costs nothing and keeps diffs minimal —
 * and the serialiser quotes exactly what would otherwise change meaning coming
 * back, which is what tells a list from a scalar that looks like one. */
export const write = (properties: Properties): string =>
  Object.keys(properties).length === 0
    ? ""
    : toYaml(properties, { sortKeys: true, flowLevel: 1, lineWidth: -1 });

export const isList = (value: Value | undefined): value is Text[] => Array.isArray(value);
