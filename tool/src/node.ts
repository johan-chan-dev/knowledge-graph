import { join as joinPath } from "@std/path";
import { generate as generateV7 } from "@std/uuid/v7";
import * as frontmatter from "./frontmatter.ts";
import type { Properties, Uuid } from "./frontmatter.ts";
import { isId } from "./frontmatter.ts";
import type { Space } from "./space.ts";

/** Reading and writing node files. What a node file *is* belongs to
 * `frontmatter.ts`; this knows only where they live and how to replace one
 * without ever leaving a half-written file behind. */

export { isId };
export type { Uuid };

/** The other way to obtain a checked value: generated legal by construction,
 * rather than checked on arrival. A door is not the only manufacturer. */
export const mint = (): Uuid => generateV7() as Uuid;

const fileOf = (space: Space, id: Uuid): string => joinPath(space.nodes, `${id}.md`);

/** Every read hits the same three failures, so they are named once. */
type Loaded =
  | { readonly kind: "loaded"; readonly properties: Properties; readonly content: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable"; readonly reason: string };

async function load(space: Space, id: Uuid): Promise<Loaded> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  const parts = frontmatter.split(raw);
  if (parts === undefined) return { kind: "malformed" };
  const read = frontmatter.read(parts.frontmatter);
  if (read.kind === "unreadable") return { kind: "unparseable", reason: read.reason };
  return { kind: "loaded", properties: read.properties, content: parts.content };
}

/** Spelled as object members rather than a union of kind strings, so a switch
 * over a result is exhaustive to the compiler. */
export type Failure =
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable"; readonly reason: string };

export type Read =
  | { readonly kind: "read"; readonly content: string; readonly properties: Properties }
  | Failure;

export async function read(space: Space, id: Uuid): Promise<Read> {
  const found = await load(space, id);
  return found.kind === "loaded"
    ? { kind: "read", content: found.content, properties: found.properties }
    : found;
}

export type Created =
  | { readonly kind: "created"; readonly id: string }
  | Unwritable;

export type Replaced =
  | { readonly kind: "replaced"; readonly replaced: number }
  | Unwritable
  | Failure;

/** Mints an id and hands it back. It cannot fail the way `replace` can: there
 * is no file to load, so `absent` and the parse failures are not among its
 * outcomes — which is why these are two functions and not one with a nullable
 * id saying which was meant. */
export async function create(
  space: Space,
  content: string,
  properties: Properties = {},
): Promise<Created> {
  const id = mint();
  const wrote = await atomically(
    fileOf(space, id),
    frontmatter.join(frontmatter.write(properties), content),
  );
  if (wrote.kind === "unwritable") return wrote;
  return { kind: "created", id };
}

/**
 * Replaces a node's content and **keeps its properties**, which is what a
 * caller means by replacing what they wrote. An id that is not here refuses
 * rather than creating: a caller cannot invent an id, so an unknown one means
 * the node is gone or this is the wrong space.
 */
export async function replace(
  space: Space,
  id: Uuid,
  content: string,
): Promise<Replaced> {
  const found = await load(space, id);
  if (found.kind !== "loaded") return found;

  const wrote = await atomically(
    fileOf(space, id),
    frontmatter.join(frontmatter.write(found.properties), content),
  );
  if (wrote.kind === "unwritable") return wrote;
  return { kind: "replaced", replaced: bytes(found.content) };
}

export type Unwritable = { readonly kind: "unwritable"; readonly reason: string };

export type Amended =
  | { readonly kind: "amended"; readonly properties: Properties }
  | { readonly kind: "refused"; readonly message: string }
  | Unwritable
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
  id: Uuid,
  change: (properties: Properties) => string | void,
): Promise<Amended> {
  const found = await load(space, id);
  if (found.kind !== "loaded") return found;

  const properties = { ...found.properties };
  const refusal = change(properties);
  if (typeof refusal === "string") return { kind: "refused", message: refusal };

  const wrote = await atomically(
    fileOf(space, id),
    frontmatter.join(frontmatter.write(properties), found.content),
  );
  if (wrote.kind === "unwritable") return wrote;
  return { kind: "amended", properties };
}

/** A temporary file in the same directory, then a rename. An interrupted
 * rewrite would corrupt the one thing the tool is custodian of; rename is
 * atomic on every filesystem that matters, write-in-place is not.
 *
 * A failure comes back as a value rather than a throw: an uncaught one printed
 * a stack trace, which `git.ts` calls the failure an agent reads worst — and it
 * exited `1`, which promises nothing was written.
 *
 * It says which case it is rather than returning a reason-or-nothing: success
 * was the empty one, so the check read `if (failed !== null)` and the quiet
 * path was the one spelled as an absence. */
async function atomically(
  path: string,
  text: string,
): Promise<{ kind: "written" } | Unwritable> {
  const temp = `${path}.${crypto.randomUUID().slice(0, 8)}.tmp`;
  try {
    await Deno.writeTextFile(temp, text);
    await Deno.rename(temp, path);
    return { kind: "written" };
  } catch (error) {
    await Deno.remove(temp).catch(() => {});
    return { kind: "unwritable", reason: reason(error) };
  }
}

const bytes = (s: string): number => new TextEncoder().encode(s).length;

/** Deno's own message carries the offending path — including the temp file,
 * which is an implementation detail the tool never emits. The error's kind is
 * what a caller can act on. */
export function reason(error: unknown): string {
  if (!(error instanceof Error)) return "unknown error";
  const kind = error.name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return kind === "error" ? "write failed" : kind;
}
