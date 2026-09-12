import { join } from "@std/path";
import * as document from "./document.ts";
import * as frontmatter from "./frontmatter.ts";
import type { Label } from "./frontmatter.ts";
import type { Space } from "./space.ts";

/**
 * The label store. A label is a file and **the file is the word** — created the
 * first time the word is used, so the vocabulary is materialised rather than
 * derived, and listing it is a directory read however large the space grows.
 *
 * Same format as a node, so the description is the body and meta properties
 * have somewhere to live. Both go through `document.ts`, which is what makes
 * writing one half without the other impossible: this module used to start from
 * an empty frontmatter and erase whatever was there.
 */
const fileOf = (space: Space, word: Label): string => join(space.labels, `${word}.md`);

export type Written = { readonly kind: "written" } | {
  readonly kind: "unwritable";
  readonly reason: string;
};

/** Bring the word into existence, or leave it exactly as it is. Called by
 * `label`, because using a word is what creates it. */
export async function ensure(space: Space, word: Label): Promise<Written> {
  try {
    await Deno.mkdir(space.labels, { recursive: true });
  } catch (error) {
    return { kind: "unwritable", reason: document.reason(error) };
  }
  const opened = await document.open(fileOf(space, word));
  // Anything already there stays, including a file the tool cannot parse: the
  // word exists, and refusing to create it again is the whole of `ensure`.
  if (opened.kind !== "absent") return { kind: "written" };
  return await document.blank(fileOf(space, word)).flush();
}

export type Read =
  | { readonly kind: "read"; readonly description: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" };

export async function read(space: Space, word: Label): Promise<Read> {
  const opened = await document.open(fileOf(space, word));
  switch (opened.kind) {
    case "absent":
      return { kind: "absent" };
    case "malformed":
    case "unparseable":
      return { kind: "malformed" };
    case "opened":
      return { kind: "read", description: opened.document.content };
  }
}

/** Replaces the description and **keeps the frontmatter**, the way a node's
 * `write` keeps its properties. */
export async function write(
  space: Space,
  word: Label,
  description: string,
): Promise<Written> {
  try {
    await Deno.mkdir(space.labels, { recursive: true });
  } catch (error) {
    return { kind: "unwritable", reason: document.reason(error) };
  }
  const path = fileOf(space, word);
  const opened = await document.open(path);
  const doc = opened.kind === "opened" ? opened.document : document.blank(path);
  doc.content = description;
  return await doc.flush();
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
    return { kind: "unwritable", reason: document.reason(error) };
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
