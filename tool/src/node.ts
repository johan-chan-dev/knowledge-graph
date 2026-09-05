import { stringify } from "@std/yaml";

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
