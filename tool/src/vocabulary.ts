import { join } from "@std/path";
import * as document from "./document.ts";
import * as frontmatter from "./frontmatter.ts";
import type { Label, Name, Properties } from "./frontmatter.ts";

/**
 * A store of words. `labels/` holds what a node *is*, `types/` what a relation
 * *is* — the same mechanism twice, which is the point: this page's rule says a
 * label word and a relation type share one rule, and two vocabularies under one
 * rule should not be under two mechanisms.
 *
 * A word is a file, created the first time the word is used, so the vocabulary
 * is materialised rather than derived from the corpus — listing it stays a
 * directory read however large the space grows, and a misspelling can be
 * refused with its neighbour named rather than answered with nothing.
 *
 * Same format as a node, so the description is the body and meta properties
 * have somewhere to live. Everything goes through `document.ts`, which is what
 * makes writing one half without the other impossible.
 */

/** Where the word itself lives, now that the filename is a fold of it. */
const WORD = "word" as Name;

/**
 * **The file is named by the slug, not by the word.** A case-insensitive
 * filesystem merges `actedIn.md` and `actedin.md` silently, keeping whichever
 * was written last, so a space's vocabulary would otherwise depend on the
 * filesystem under it. Folding first makes that collision *visible* — it lands
 * on one path, and `ensure` refuses the second word rather than shadowing the
 * first.
 */
const fileOf = (dir: string, word: Label): string =>
  join(dir, `${frontmatter.slug(word)}.md`);

/** The word a file holds, or nothing if it holds none this tool could have
 * written. Read rather than inferred from the filename: the slug is lossy on
 * purpose, so it cannot be turned back into the word. */
const wordIn = (properties: Properties): Label | undefined => {
  const held = properties[WORD];
  return typeof held === "string" && frontmatter.isLabel(held) ? held : undefined;
};

export type Written =
  | { readonly kind: "written" }
  /** The slug is occupied by a different word — `SciFi` against `sci_fi`. */
  | { readonly kind: "taken"; readonly by: Label | undefined; readonly slug: string }
  | { readonly kind: "unwritable"; readonly reason: string };

/** Bring the word into existence, or leave it exactly as it is. Called by the
 * command that uses a word, because using it is what creates it. */
export async function ensure(dir: string, word: Label): Promise<Written> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    return { kind: "unwritable", reason: document.reason(error) };
  }
  const path = fileOf(dir, word);
  const opened = await document.open(path);
  if (opened.kind === "opened") {
    const held = wordIn(opened.document.properties);
    // Anything already there stays: the word exists, and refusing to create it
    // again is the whole of `ensure`.
    if (held === word) return { kind: "written" };
    if (held !== undefined) return { kind: "taken", by: held, slug: frontmatter.slug(word) };
    // A file naming no word contradicts no word, so this adopts rather than
    // refuses — which is what keeps a hand-written label file usable. Nothing
    // is inferred from the filename: the caller supplied the word, and the
    // slug it folds to is the file we are looking at.
    opened.document.properties[WORD] = word as unknown as frontmatter.Text;
    return await opened.document.flush();
  }
  // A file that will not parse holds the slug without naming its word, which is
  // a collision this cannot resolve and must not overwrite.
  if (opened.kind !== "absent") {
    return { kind: "taken", by: undefined, slug: frontmatter.slug(word) };
  }
  const fresh = document.blank(path);
  fresh.properties[WORD] = word as unknown as frontmatter.Text;
  return await fresh.flush();
}

export type Read =
  | { readonly kind: "read"; readonly description: string }
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" };

/** Absent covers *the slug holds a different word*: asking about `sci_fi` must
 * not answer with `SciFi`'s description. */
export async function read(dir: string, word: Label): Promise<Read> {
  const opened = await document.open(fileOf(dir, word));
  switch (opened.kind) {
    case "absent":
      return { kind: "absent" };
    case "malformed":
    case "unparseable":
      return { kind: "malformed" };
    case "opened":
      return wordIn(opened.document.properties) === word
        ? { kind: "read", description: opened.document.content }
        : { kind: "absent" };
  }
}

/** Replaces the description and **keeps the frontmatter**, the way a node's
 * `write` keeps its properties — so the word survives being described. */
export async function write(
  dir: string,
  word: Label,
  description: string,
): Promise<Written> {
  const made = await ensure(dir, word);
  if (made.kind !== "written") return made;
  const path = fileOf(dir, word);
  const opened = await document.open(path);
  if (opened.kind !== "opened") {
    return { kind: "unwritable", reason: "the word is not here" };
  }
  opened.document.content = description;
  return await opened.document.flush();
}

export type Forgotten =
  | { readonly kind: "forgotten" }
  | { readonly kind: "absent" }
  | { readonly kind: "unwritable"; readonly reason: string };

/** Removes the word from the vocabulary. Nodes carrying it still carry it —
 * the file is what the space knows about the word, not the membership. */
export async function forget(dir: string, word: Label): Promise<Forgotten> {
  const found = await read(dir, word);
  if (found.kind === "absent") return { kind: "absent" };
  try {
    await Deno.remove(fileOf(dir, word));
    return { kind: "forgotten" };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return { kind: "absent" };
    return { kind: "unwritable", reason: document.reason(error) };
  }
}

/**
 * Every word the space knows, **ordered by slug** — a directory read, then one
 * small read per word to recover the word from its file.
 *
 * By slug rather than by the word, because the order exists to put `auth`
 * beside `authn` so drift is visible, and code-unit order would file every
 * capitalised word before every lowercase one — putting `Auth` and `auth` at
 * opposite ends of the list, which is the one pair the order is for.
 */
export async function words(dir: string): Promise<Label[]> {
  const found: { slug: string; word: Label }[] = [];
  let entries: Deno.DirEntry[];
  try {
    entries = await Array.fromAsync(Deno.readDir(dir));
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const slug = entry.name.slice(0, -3);
    if (!frontmatter.isSlug(slug)) continue;
    const opened = await document.open(join(dir, entry.name));
    if (opened.kind !== "opened") continue;
    const word = wordIn(opened.document.properties);
    if (word !== undefined) found.push({ slug, word });
  }
  found.sort((a, b) => a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0);
  return found.map((each) => each.word);
}
