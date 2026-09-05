import { parse, stringify } from "@std/yaml";

export type Attrs = Record<string, unknown>;

export type NodeRead =
  | {
    readonly kind: "node";
    readonly id: string;
    readonly path: string;
    readonly attrs: Attrs;
    readonly body: string;
  }
  | { readonly kind: "unreadable"; readonly path: string; readonly reason: string };

/**
 * `core` is YAML 1.2 core — null, bool, int, float, string — and nothing else.
 * The default schema coerces `2027-01-01` into a Date, which would be the tool
 * deciding that a field it has never heard of is a date. It does not know that
 * and must not guess: see design/ignorance.md.
 */
const SCHEMA = "core" as const;

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)---[ \t]*(?:\r?\n([\s\S]*))?$/;

/**
 * Canonical order: alphabetical. The tool is the only writer, so canonical
 * output costs nothing and keeps diffs minimal — see spec/batch-1.md.
 */
export function canonicalise(attrs: Attrs): Attrs {
  const ordered: Attrs = {};
  for (const key of Object.keys(attrs).sort()) ordered[key] = attrs[key];
  return ordered;
}

/** `flowLevel: 1` keeps short collections on one line. An empty mapping
 * serialises as an empty block, so every node has frontmatter even when it
 * carries nothing yet. */
export function serialise(attrs: Attrs, body: string): string {
  const yaml = Object.keys(attrs).length === 0
    ? ""
    : stringify(canonicalise(attrs), { flowLevel: 1, schema: SCHEMA });
  return `---\n${yaml}---\n\n${body.replace(/^\n+/, "")}`;
}

export type Split =
  | { readonly kind: "split"; readonly attrs: Attrs; readonly body: string }
  | { readonly kind: "malformed"; readonly reason: string };

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
  if (parsed === null || parsed === undefined) {
    return { kind: "split", attrs: {}, body };
  }
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    return { kind: "malformed", reason: "frontmatter is not a mapping" };
  }
  return { kind: "split", attrs: parsed as Attrs, body };
}

export async function readNode(path: string, id: string): Promise<NodeRead> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (e) {
    return { kind: "unreadable", path, reason: (e as Error).message };
  }
  const result = split(text);
  return result.kind === "malformed"
    ? { kind: "unreadable", path, reason: result.reason }
    : { kind: "node", id, path, attrs: result.attrs, body: result.body };
}
