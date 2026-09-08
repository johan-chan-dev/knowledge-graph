import { join as joinPath } from "@std/path";
import { validate as isUuid } from "@std/uuid";
import { generate as mint } from "@std/uuid/v7";
import * as frontmatter from "./frontmatter.ts";
import type { Properties } from "./frontmatter.ts";
import type { Space } from "./space.ts";

/** Reading and writing node files. What a node file *is* belongs to
 * `frontmatter.ts`; this knows only where they live and how to replace one
 * without ever leaving a half-written file behind. */

/** Any uuid is well formed, not only the v7 this tool mints — a v4 is a
 * plausible id it never issued, which makes it honestly absent rather than
 * refused. */
export const isId = (s: string): boolean => isUuid(s);

export { mint };

const fileOf = (space: Space, id: string): string => joinPath(space.nodes, `${id}.md`);

/** Every read hits the same three failures, so they are named once. */
type Loaded =
  | { readonly kind: "loaded"; readonly properties: Properties; readonly content: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable" };

async function load(space: Space, id: string): Promise<Loaded> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  const parts = frontmatter.split(raw);
  if (parts === null) return { kind: "malformed" };
  const properties = frontmatter.read(parts.frontmatter);
  if (properties === null) return { kind: "unparseable" };
  return { kind: "loaded", properties, content: parts.content };
}

/** Spelled as object members rather than a union of kind strings, so a switch
 * over a result is exhaustive to the compiler. */
export type Failure =
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable" };

export type Read =
  | { readonly kind: "read"; readonly content: string; readonly properties: Properties }
  | Failure;

export async function read(space: Space, id: string): Promise<Read> {
  const found = await load(space, id);
  return found.kind === "loaded"
    ? { kind: "read", content: found.content, properties: found.properties }
    : { kind: found.kind };
}

export type Written =
  | { readonly kind: "written"; readonly id: string; readonly replaced: number | null }
  | Failure;

/**
 * With no id this creates and hands the id back; with one it replaces that
 * node's content and **keeps its properties**, which is what a caller means by
 * replacing what they wrote. An id that is not here refuses rather than
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
    await atomically(fileOf(space, minted), frontmatter.join("", content));
    return { kind: "written", id: minted, replaced: null };
  }

  const found = await load(space, id);
  if (found.kind !== "loaded") return { kind: found.kind };

  await atomically(
    fileOf(space, id),
    frontmatter.join(frontmatter.write(found.properties), content),
  );
  return { kind: "written", id, replaced: bytes(found.content) };
}

export type Amended =
  | { readonly kind: "amended"; readonly properties: Properties }
  | { readonly kind: "refused"; readonly message: string }
  | Failure;

/**
 * Read, hand the properties to `change`, write back. Every other property
 * survives and so does the content, because the whole block is rewritten from
 * what was read.
 *
 * `change` returns a message to refuse — which is how `add` declines a scalar
 * without this module needing to know what `add` is.
 */
export async function amend(
  space: Space,
  id: string,
  change: (properties: Properties) => string | void,
): Promise<Amended> {
  const found = await load(space, id);
  if (found.kind !== "loaded") return { kind: found.kind };

  const properties = { ...found.properties };
  const refusal = change(properties);
  if (typeof refusal === "string") return { kind: "refused", message: refusal };

  await atomically(
    fileOf(space, id),
    frontmatter.join(frontmatter.write(properties), found.content),
  );
  return { kind: "amended", properties };
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
