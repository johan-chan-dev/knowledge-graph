import { parse, stringify } from "@std/yaml";

export type Attrs = Record<string, unknown>;

/**
 * `core` is YAML 1.2 core — null, bool, int, float, string — and nothing else.
 * The default schema turns `2027-01-01` into a Date, which would be the tool
 * deciding that a field it has never heard of is a date. See spec/batch-1.md.
 */
const SCHEMA = "core" as const;

/**
 * Canonical order: alphabetical. The tool is the only writer, so canonical
 * output costs nothing and keeps diffs minimal — see spec/batch-1.md.
 */
export function canonicalise(attrs: Attrs): Attrs {
  const ordered: Attrs = {};
  for (const key of Object.keys(attrs).sort()) ordered[key] = attrs[key];
  return ordered;
}

/**
 * The on-disk shape of a node, in one place. `flowLevel: 1` keeps short
 * collections on one line; an empty mapping serialises to an empty block, so a
 * node has frontmatter even while it carries nothing.
 */
export function serialise(attrs: Attrs, body: string): string {
  const yaml = Object.keys(attrs).length === 0
    ? ""
    : stringify(canonicalise(attrs), { flowLevel: 1, schema: SCHEMA });
  return `---\n${yaml}---\n\n${body.replace(/^\n+/, "")}`;
}

export type Split =
  | { readonly kind: "split"; readonly attrs: Attrs; readonly body: string }
  | { readonly kind: "malformed"; readonly reason: string };

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)---[ \t]*(?:\r?\n([\s\S]*))?$/;

/** The inverse of `serialise`, held to the same schema in both directions. */
export function split(text: string): Split {
  const match = FRONTMATTER.exec(text);
  if (match === null) return { kind: "malformed", reason: "no frontmatter" };

  let parsed: unknown;
  try {
    parsed = parse(match[1], { schema: SCHEMA });
  } catch (e) {
    return { kind: "malformed", reason: (e as Error).message.split("\n")[0] };
  }

  // serialise writes one blank line after the closing fence; drop it so that
  // split(serialise(a, b)) is the identity.
  const body = (match[2] ?? "").replace(/^\r?\n/, "");

  if (parsed === null || parsed === undefined) return { kind: "split", attrs: {}, body };
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    return { kind: "malformed", reason: "frontmatter is not a mapping" };
  }
  return { kind: "split", attrs: parsed as Attrs, body };
}

/** Labels as written, or an empty list. A malformed value is not repaired. */
export function labelsOf(attrs: Attrs): string[] {
  const value = attrs.labels;
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

/**
 * Written to a sibling temporary file, then renamed. This is the first thing
 * that alters a node rather than creating one, and rename is atomic where
 * write-in-place is not — an interrupted rewrite would corrupt the one thing
 * the tool is custodian of.
 */
export async function writeAtomic(path: string, text: string): Promise<void> {
  const temp = `${path}.${crypto.randomUUID().slice(0, 8)}.tmp`;
  try {
    await Deno.writeTextFile(temp, text);
    await Deno.rename(temp, path);
  } catch (e) {
    await Deno.remove(temp).catch(() => {});
    throw e;
  }
}
