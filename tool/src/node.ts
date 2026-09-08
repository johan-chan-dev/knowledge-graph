import { join } from "@std/path";
import { parse as parseYaml, stringify as toYaml } from "@std/yaml";
import { validate as isUuid } from "@std/uuid";
import { generate as mint } from "@std/uuid/v7";
import type { Space } from "./space.ts";

/**
 * A node is a frontmatter block and a body. LF only — `space init` writes a
 * `.gitattributes` that stops git converting, and nothing else writes here, so
 * tolerating CRLF would only half-handle a file that cannot occur.
 * The block is written even when it
 * holds nothing, so a node is always well-formed and the reader can stay
 * strict. The id is the filename and appears nowhere inside.
 */
const OPEN = /^---[ \t]*\n([\s\S]*?)---[ \t]*(?:\n([\s\S]*))?$/;

/** Any uuid is well formed, not only the v7 this tool mints — a v4 is a
 * plausible id it never issued, which makes it honestly absent rather than
 * refused. */
export const isId = (s: string): boolean => isUuid(s);

export { mint };

const fileOf = (space: Space, id: string): string => join(space.nodes, `${id}.md`);

type Split = { readonly frontmatter: string; readonly content: string };

/** A property's value is stored as a string, always. The serialiser quotes only
 * what would otherwise change type on the way back, so those quotes preserve
 * that the tool was handed text rather than decide what the text means. */
export type Properties = Record<string, string>;

/** A lowercase hyphenated token. Anything needing quoting or escaping is a name
 * that will eventually be typed wrong and fail by silently matching nothing. */
const TOKEN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const isName = (s: string): boolean => TOKEN.test(s);

/** Scalars are read under YAML 1.2 core — the default schema turns
 * `2027-01-01` into a date, which would be the tool deciding what a field it
 * has never heard of means. */
function readProperties(frontmatter: string): Properties | null {
  if (frontmatter.trim() === "") return {};
  let parsed: unknown;
  try {
    parsed = parseYaml(frontmatter, { schema: "core" });
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const out: Properties = {};
  for (const [name, value] of Object.entries(parsed)) out[name] = String(value);
  return out;
}

/** Keys alphabetical, `flowLevel: 1` so a sequence stays on one line. The tool
 * is the only writer, so canonical output costs nothing and keeps diffs minimal. */
const writeProperties = (properties: Properties): string =>
  Object.keys(properties).length === 0
    ? ""
    : toYaml(properties, { sortKeys: true, flowLevel: 1, lineWidth: -1 });

function split(raw: string): Split | null {
  const match = OPEN.exec(raw);
  if (match === null) return null;
  const content = match[2] ?? "";
  // The fence is followed by one blank line, which belongs to neither half.
  return {
    frontmatter: match[1],
    content: content.startsWith("\n") ? content.slice(1) : content,
  };
}

const join_ = (frontmatter: string, content: string): string =>
  `---\n${frontmatter}---\n\n${content}`;

export type Read =
  | { readonly kind: "read"; readonly content: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" };

export async function read(space: Space, id: string): Promise<Read> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  const parts = split(raw);
  return parts === null
    ? { kind: "malformed" }
    : { kind: "read", content: parts.content };
}

export type Written =
  | { readonly kind: "written"; readonly id: string; readonly replaced: number | null }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" };

/**
 * With no id this creates and hands the id back; with one it replaces that
 * node's content and **keeps its frontmatter**, which is what a caller means
 * by replacing what they wrote. An id that is not here refuses rather than
 * creating: a caller cannot invent an id, so an unknown one means the node is
 * gone or this is the wrong space.
 */
export async function write(
  space: Space,
  id: string | null,
  content: string,
): Promise<Written> {
  if (id === null) {
    const minted = mint();
    await atomically(fileOf(space, minted), join_("", content));
    return { kind: "written", id: minted, replaced: null };
  }

  const existing = await read(space, id);
  if (existing.kind !== "read") return existing;

  const raw = await Deno.readTextFile(fileOf(space, id));
  const parts = split(raw)!;
  await atomically(fileOf(space, id), join_(parts.frontmatter, content));
  return { kind: "written", id, replaced: bytes(existing.content) };
}

/** A temporary file in the same directory, then a rename. An interrupted
 * rewrite would corrupt the one thing the tool is custodian of; rename is
 * atomic on every filesystem that matters, write-in-place is not. */
async function atomically(path: string, text: string): Promise<void> {
  const temp = `${path}.${crypto.randomUUID().slice(0, 8)}.tmp`;
  try {
    await Deno.writeTextFile(temp, text);
    await Deno.rename(temp, path);
  } catch (error) {
    await Deno.remove(temp).catch(() => {});
    throw error;
  }
}

const bytes = (s: string): number => new TextEncoder().encode(s).length;

export type Props =
  | { readonly kind: "read"; readonly properties: Properties }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable" };

export async function properties(space: Space, id: string): Promise<Props> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  const parts = split(raw);
  if (parts === null) return { kind: "malformed" };
  const found = readProperties(parts.frontmatter);
  return found === null ? { kind: "unparseable" } : { kind: "read", properties: found };
}

/**
 * Read-modify-write over the whole block: every other property survives, and so
 * does the content. `null` removes the key, which is how a property emptied
 * becomes indistinguishable from one never set.
 */
export type Amended =
  | { readonly kind: "amended"; readonly had: boolean }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable" };

export async function amend(
  space: Space,
  id: string,
  name: string,
  value: string | null,
): Promise<Amended> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  const parts = split(raw);
  if (parts === null) return { kind: "malformed" };
  const found = readProperties(parts.frontmatter);
  if (found === null) return { kind: "unparseable" };

  const had = name in found;
  if (value === null) delete found[name];
  else found[name] = value;

  await atomically(fileOf(space, id), join_(writeProperties(found), parts.content));
  return { kind: "amended", had };
}
