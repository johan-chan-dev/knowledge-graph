import { join } from "@std/path";
import type { Label, Properties, Uuid } from "./frontmatter.ts";
import { isId, isLabel } from "./frontmatter.ts";
import { mint } from "./node.ts";
import * as document from "./document.ts";
import type { Space } from "./space.ts";

/**
 * The link store. A link is a record — its own type and endpoints, plus
 * properties — and **YAML rather than markdown** because it carries no prose,
 * so a body would be dead weight.
 *
 * It was JSON until batch 11, on a reason that argued against markdown and not
 * against YAML, and the format is what kept records outside the one writer
 * batch 10 established: they wrote with a bare `writeTextFile`, no rename and
 * no read-modify-write. As a properties document they are inside it.
 *
 * **A record has fields and properties.** `type`, `from` and `to` are the
 * link's own data and never change — a link's identity *is* those three, so
 * altering one would make it a different link. Everything else is a property
 * obeying a node's rules, which `document.ts` already enforces on the way in.
 */
export type Record_ = {
  readonly type: Label;
  readonly from: Uuid;
  readonly to: Uuid;
  readonly properties: Properties;
};

export const FIELDS = ["type", "from", "to"] as const;

const fileOf = (space: Space, id: Uuid): string => join(space.links, `${id}.yaml`);

export type Written =
  | { readonly kind: "written"; readonly id: Uuid }
  | { readonly kind: "unwritable"; readonly reason: string };

/** The fields and the properties in one mapping, which is what the file is. */
const flatten = (
  record: Record_,
): Properties => ({
  ...record.properties,
  type: record.type,
  from: record.from,
  to: record.to,
} as Properties);

export async function create(
  space: Space,
  type: Label,
  from: Uuid,
  to: Uuid,
  properties: Properties,
): Promise<Written> {
  const id = mint();
  try {
    await Deno.mkdir(space.links, { recursive: true });
  } catch (error) {
    return { kind: "unwritable", reason: document.reason(error) };
  }
  const fresh = document.empty(fileOf(space, id));
  fresh.properties = flatten({ type, from, to, properties });
  const wrote = await fresh.flush();
  return wrote.kind === "written" ? { kind: "written", id } : wrote;
}

export type Read =
  | { readonly kind: "read"; readonly record: Record_ }
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly reason: string };

export async function read(space: Space, id: Uuid): Promise<Read> {
  const found = await document.read(fileOf(space, id));
  if (found.kind === "absent") return { kind: "absent" };
  if (found.kind !== "read") {
    return {
      kind: "unreadable",
      reason: found.kind === "malformed" ? "the record is not a mapping" : found.reason,
    };
  }
  const record = fields(found.record.properties);
  return typeof record === "string"
    ? { kind: "unreadable", reason: record }
    : { kind: "read", record };
}

export async function write(space: Space, id: Uuid, record: Record_): Promise<Written> {
  const found = await document.read(fileOf(space, id));
  if (found.kind !== "read") {
    return { kind: "unwritable", reason: "the record is not here" };
  }
  found.record.properties = flatten(record);
  const wrote = await found.record.flush();
  return wrote.kind === "written" ? { kind: "written", id } : wrote;
}

export async function forget(space: Space, id: Uuid): Promise<Read | Written> {
  try {
    await Deno.remove(fileOf(space, id));
    return { kind: "written", id };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return { kind: "absent" };
    return { kind: "unwritable", reason: document.reason(error) };
  }
}

/** The three fields, pulled out of the mapping. Names and values were already
 * checked on the way in — this is only about the link's own data. */
function fields(all: Properties): Record_ | string {
  const { type, from, to, ...properties } = all as Record<string, unknown>;
  if (typeof type !== "string" || !isLabel(type)) {
    return `not a relation type: ${String(type)} — expected a lowercase hyphenated token`;
  }
  if (typeof from !== "string" || !isId(from)) return `not an id: ${String(from)}`;
  if (typeof to !== "string" || !isId(to)) return `not an id: ${String(to)}`;
  return { type, from, to, properties: properties as Properties };
}

export type { Properties };
