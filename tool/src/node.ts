import { join as joinPath } from "@std/path";
import { generate as generateV7 } from "@std/uuid/v7";
import * as document from "./document.ts";
import type { Properties, Uuid } from "./frontmatter.ts";
import { isId } from "./frontmatter.ts";
import type { Space } from "./space.ts";

/** Where node files live, and what a node's id is. The form itself —
 * reading it, carrying both halves, writing it back atomically — is
 * `document.ts`; what a node file *is* belongs to `frontmatter.ts`. */

export { isId };
export type { Uuid };
export type { Failure, Unwritable } from "./document.ts";
import type { Failure, Unwritable } from "./document.ts";

/** The other way to obtain a checked value: generated legal by construction,
 * rather than checked on arrival. A door is not the only manufacturer. */
export const mint = (): Uuid => generateV7() as Uuid;

const fileOf = (space: Space, id: Uuid): string => joinPath(space.nodes, `${id}.md`);

export type Read =
  | { readonly kind: "read"; readonly content: string; readonly properties: Properties }
  | Failure;

export async function read(space: Space, id: Uuid): Promise<Read> {
  const opened = await document.open(fileOf(space, id));
  return opened.kind === "opened"
    ? {
      kind: "read",
      content: opened.document.content,
      properties: opened.document.properties,
    }
    : opened;
}

export type Created =
  | { readonly kind: "created"; readonly id: string }
  | Unwritable;

export type Replaced =
  | { readonly kind: "replaced"; readonly replaced: number }
  | Unwritable
  | Failure
  | document.Contended;

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
  const fresh = document.blank(fileOf(space, id));
  fresh.properties = properties;
  fresh.content = content;
  const wrote = await fresh.flush();
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
  const opened = await document.acquire(fileOf(space, id));
  if (opened.kind !== "opened") return opened;

  const displaced = bytes(opened.document.content);
  opened.document.content = content;
  const wrote = await opened.document.flush();
  if (wrote.kind === "unwritable") return wrote;
  return { kind: "replaced", replaced: displaced };
}

export type Amended =
  | { readonly kind: "amended"; readonly properties: Properties }
  | { readonly kind: "refused"; readonly message: string }
  | Unwritable
  | Failure
  | document.Contended;

/**
 * Read, hand the properties to `change`, write back. Every other property
 * survives and so does the content, because the handle holds both halves.
 *
 * `change` returns a message to refuse — which is how `add` declines a scalar
 * without this module needing to know what `add` is.
 */
export async function amend(
  space: Space,
  id: Uuid,
  change: (properties: Properties) => string | void,
): Promise<Amended> {
  const opened = await document.acquire(fileOf(space, id));
  if (opened.kind !== "opened") return opened;

  const refusal = change(opened.document.properties);
  if (typeof refusal === "string") {
    await opened.document.abandon();
    return { kind: "refused", message: refusal };
  }

  const wrote = await opened.document.flush();
  if (wrote.kind === "unwritable") return wrote;
  return { kind: "amended", properties: opened.document.properties };
}

const bytes = (s: string): number => new TextEncoder().encode(s).length;
