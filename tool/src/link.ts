import { join } from "@std/path";
import type { Label, Name, Text, Uuid, Value } from "./frontmatter.ts";
import { isId, isLabel, isName, isValue } from "./frontmatter.ts";
import { mint, reason } from "./node.ts";
import type { Space } from "./space.ts";

/**
 * The link store. A link is a record — its own type and endpoints, plus
 * properties — and JSON rather than markdown because it carries no prose, so a
 * body would be dead weight and none of `frontmatter.ts`'s machinery applies:
 * no date coercion, no spellings of null, no quoting rules.
 *
 * **A record has fields and properties.** `type`, `from` and `to` are the
 * link's own data and never change — a link's identity *is* those three, so
 * altering one would make it a different link. Everything else is a property
 * obeying a node's rules.
 */
export type Record_ = {
  readonly type: Label;
  readonly from: Uuid;
  readonly to: Uuid;
  readonly properties: Properties;
};

type Properties = { [name: string]: Value };

export const FIELDS = ["type", "from", "to"] as const;

const fileOf = (space: Space, id: Uuid): string => join(space.links, `${id}.json`);

export type Written =
  | { readonly kind: "written"; readonly id: Uuid }
  | { readonly kind: "unwritable"; readonly reason: string };

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
    await Deno.writeTextFile(fileOf(space, id), render({ type, from, to, properties }));
    return { kind: "written", id };
  } catch (error) {
    return { kind: "unwritable", reason: reason(error) };
  }
}

export type Read =
  | { readonly kind: "read"; readonly record: Record_ }
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly reason: string };

export async function read(space: Space, id: Uuid): Promise<Read> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, id));
  } catch {
    return { kind: "absent" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { kind: "unreadable", reason: "the record is not JSON" };
  }
  const record = validate(parsed);
  return typeof record === "string"
    ? { kind: "unreadable", reason: record }
    : { kind: "read", record };
}

export async function write(space: Space, id: Uuid, record: Record_): Promise<Written> {
  try {
    await Deno.writeTextFile(fileOf(space, id), render(record));
    return { kind: "written", id };
  } catch (error) {
    return { kind: "unwritable", reason: reason(error) };
  }
}

export async function forget(space: Space, id: Uuid): Promise<Read | Written> {
  try {
    await Deno.remove(fileOf(space, id));
    return { kind: "written", id };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return { kind: "absent" };
    return { kind: "unwritable", reason: reason(error) };
  }
}

/** Fields first, then properties in a stable order — a record diffs cleanly in
 * git, which is the only reader that sees the file itself. */
function render(record: Record_): string {
  const out: { [k: string]: unknown } = {
    type: record.type,
    from: record.from,
    to: record.to,
  };
  for (const name of Object.keys(record.properties).sort()) {
    out[name] = record.properties[name];
  }
  return JSON.stringify(out, null, 2) + "\n";
}

/** The reading door, same rule as a node's: what the tool could not have
 * written, it does not read. */
function validate(parsed: unknown): Record_ | string {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "the record is not an object";
  }
  const { type, from, to, ...rest } = parsed as { [k: string]: unknown };
  if (typeof type !== "string" || !isLabel(type)) {
    return `not a relation type: ${String(type)} — expected a lowercase hyphenated token`;
  }
  if (typeof from !== "string" || !isId(from)) return `not an id: ${String(from)}`;
  if (typeof to !== "string" || !isId(to)) return `not an id: ${String(to)}`;

  const properties: Properties = {};
  for (const [name, value] of Object.entries(rest)) {
    if (!isName(name)) {
      return `not a property name: ${name} — expected a lowercase hyphenated token`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return `${name} is an empty list`;
      const values = value.map(String);
      if (!values.every(isValue)) {
        return `${name} holds a value with a control character`;
      }
      properties[name] = values;
      continue;
    }
    if (value === null || typeof value === "object") return `${name} has no value`;
    const text = String(value);
    if (!isValue(text)) return `${name} holds a value with a control character`;
    properties[name] = text as Text;
  }
  return { type, from, to, properties };
}

export type { Name, Properties };
