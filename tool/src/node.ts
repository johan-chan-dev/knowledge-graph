import { join } from "@std/path";
import { validate as isUuid } from "@std/uuid";
import { generate as mint } from "@std/uuid/v7";
import type { Space } from "./space.ts";

/**
 * A node is a frontmatter block and a body. The block is written even when it
 * holds nothing, so a node is always well-formed and the reader can stay
 * strict. The id is the filename and appears nowhere inside.
 */
const OPEN = /^---[ \t]*\r?\n([\s\S]*?)---[ \t]*(?:\r?\n([\s\S]*))?$/;

/** Any uuid is well formed, not only the v7 this tool mints — a v4 is a
 * plausible id it never issued, which makes it honestly absent rather than
 * refused. */
export const isId = (s: string): boolean => isUuid(s);

export { mint };

const fileOf = (space: Space, id: string): string => join(space.nodes, `${id}.md`);

type Split = { readonly frontmatter: string; readonly content: string };

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

export const bytes = (s: string): number => new TextEncoder().encode(s).length;

export function measure(content: string): string {
  const count = content === "" ? 0 : content.replace(/\n$/, "").split("\n").length;
  const size = bytes(content);
  const human = size < 1024
    ? `${size} bytes`
    : size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${count} ${count === 1 ? "line" : "lines"}, ${human}`;
}
