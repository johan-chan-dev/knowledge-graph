import { join } from "@std/path";
import * as frontmatter from "./frontmatter.ts";
import type { Label } from "./frontmatter.ts";
import { reason } from "./node.ts";
import type { Space } from "./space.ts";

/**
 * The label store. A label is a file and **the file is the word** — created the
 * first time the word is used, so the vocabulary is materialised rather than
 * derived, and listing it is a directory read however large the space grows.
 *
 * Same format as a node, so the description is simply the body and meta
 * properties have somewhere to live later. What the tool never does is read
 * that description.
 */
const fileOf = (space: Space, word: Label): string => join(space.labels, `${word}.md`);

export type Written = { readonly kind: "written" } | {
  readonly kind: "unwritable";
  readonly reason: string;
};

/** Bring the word into existence, or leave it exactly as it is. Called by
 * `label`, because using a word is what creates it. */
export async function ensure(space: Space, word: Label): Promise<Written> {
  const path = fileOf(space, word);
  try {
    await Deno.mkdir(space.labels, { recursive: true });
    await Deno.stat(path);
    return { kind: "written" };
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      return { kind: "unwritable", reason: reason(error) };
    }
  }
  try {
    await Deno.writeTextFile(path, frontmatter.join("", ""));
    return { kind: "written" };
  } catch (error) {
    return { kind: "unwritable", reason: reason(error) };
  }
}

export type Read =
  | { readonly kind: "read"; readonly description: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" };

export async function read(space: Space, word: Label): Promise<Read> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(fileOf(space, word));
  } catch {
    return { kind: "absent" };
  }
  const parts = frontmatter.split(raw);
  if (parts === undefined) return { kind: "malformed" };
  return { kind: "read", description: parts.content };
}

export async function write(
  space: Space,
  word: Label,
  description: string,
): Promise<Written> {
  try {
    await Deno.mkdir(space.labels, { recursive: true });
    await Deno.writeTextFile(fileOf(space, word), frontmatter.join("", description));
    return { kind: "written" };
  } catch (error) {
    return { kind: "unwritable", reason: reason(error) };
  }
}

export type Forgotten =
  | { readonly kind: "forgotten" }
  | { readonly kind: "absent" }
  | { readonly kind: "unwritable"; readonly reason: string };

/** Removes the word from the vocabulary. Nodes carrying it still carry it —
 * the file is what the space knows about the word, not the membership. */
export async function forget(space: Space, word: Label): Promise<Forgotten> {
  try {
    await Deno.remove(fileOf(space, word));
    return { kind: "forgotten" };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return { kind: "absent" };
    return { kind: "unwritable", reason: reason(error) };
  }
}

/** Every word the space knows, alphabetically — a directory read. Alphabetical
 * because it puts `auth` beside `authn`, which is what makes drift visible. */
export async function words(space: Space): Promise<Label[]> {
  const found: Label[] = [];
  try {
    for await (const entry of Deno.readDir(space.labels)) {
      if (!entry.isFile || !entry.name.endsWith(".md")) continue;
      const word = entry.name.slice(0, -3);
      if (frontmatter.isLabel(word)) found.push(word);
    }
  } catch {
    return [];
  }
  return found.sort();
}
