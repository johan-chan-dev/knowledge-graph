import * as frontmatter from "./frontmatter.ts";
import type { Properties } from "./frontmatter.ts";

/**
 * A markdown file with frontmatter, as one thing.
 *
 * The discipline this carries — read the file, hold **both** halves, write them
 * back through a temporary file and a rename — used to live in `node.ts`,
 * attached to `nodes/<uuid>.md` rather than to the form. Labels were the second
 * thing wearing that form and received a partial reimplementation instead:
 * their writes started from an empty frontmatter, and never renamed.
 *
 * A handle rather than a set of operations, because the loss it prevents is
 * structural. `flush` cannot drop a half, since the handle was opened before it
 * was changed and holds what it read. What it can lose is a flush nobody
 * called — a write that does not happen, where nothing changes, against a
 * silent destruction.
 *
 * It needs no guards of its own: `properties` is `Record<Name, Value>` with
 * branded types, so an unchecked string will not go in. `boundaries.md` made
 * the check the only route to the type; this inherits it.
 *
 * What it does not know: where files live, what a name means, how an id is
 * minted. Those stay with `space.ts`, `frontmatter.ts` and `node.ts`.
 *
 * **Two shapes, and the caller names which.** A node or a label is markdown —
 * fences, then a body. A link record is YAML alone: properties, no fences, no
 * body, because a link carries no prose. Only what `open` separates and what
 * `flush` assembles differ; the atomic write, the failure vocabulary and the
 * rule that a write carries what it read are shared. Guessing the shape from
 * `.md` or `.yaml` would be detection where this tool declares.
 */

export type Unwritable = { readonly kind: "unwritable"; readonly reason: string };
export type Written = { readonly kind: "written" } | Unwritable;

/** Spelled as object members rather than a union of kind strings, so a switch
 * over a result is exhaustive to the compiler. */
export type Failure =
  | { readonly kind: "absent" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unparseable"; readonly reason: string };

/** Both halves, mutable, and one way to put them back. */
export type Document = {
  properties: Properties;
  content: string;
  flush(): Promise<Written>;
};

export type Opened = { readonly kind: "opened"; readonly document: Document } | Failure;

function handle(path: string, properties: Properties, content: string): Document {
  const document: Document = {
    properties,
    content,
    // Reads its own fields at flush time, so every change made in between is
    // carried, and neither half can be written without the other.
    flush: () =>
      atomically(
        path,
        frontmatter.join(frontmatter.write(document.properties), document.content),
      ),
  };
  return document;
}

/** Properties alone — a link record. No fences, no body, so there is no second
 * half to lose and no `content` to set by mistake. */
export type Record_ = {
  properties: Properties;
  flush(): Promise<Written>;
};

export type Read = { readonly kind: "read"; readonly record: Record_ } | Failure;

function holder(path: string, properties: Properties): Record_ {
  const record: Record_ = {
    properties,
    flush: () => atomically(path, frontmatter.write(record.properties)),
  };
  return record;
}

/** A YAML document: the whole file is the mapping. */
export async function read(path: string): Promise<Read> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(path);
  } catch {
    return { kind: "absent" };
  }
  const parsed = frontmatter.read(raw);
  if (parsed.kind === "unreadable") {
    return { kind: "unparseable", reason: parsed.reason };
  }
  return { kind: "read", record: holder(path, { ...parsed.properties }) };
}

/** A YAML document not yet on disk. */
export const empty = (path: string): Record_ => holder(path, {});

export async function open(path: string): Promise<Opened> {
  let raw: string;
  try {
    raw = await Deno.readTextFile(path);
  } catch {
    return { kind: "absent" };
  }
  const parts = frontmatter.split(raw);
  if (parts === undefined) return { kind: "malformed" };
  const read = frontmatter.read(parts.frontmatter);
  if (read.kind === "unreadable") return { kind: "unparseable", reason: read.reason };
  return {
    kind: "opened",
    document: handle(path, { ...read.properties }, parts.content),
  };
}

/** A document not yet on disk. `open` reports absence instead of inventing one,
 * because `write` on an unknown id must refuse rather than create. */
export const blank = (path: string): Document => handle(path, {}, "");

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
async function atomically(path: string, text: string): Promise<Written> {
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

/** Deno's own message carries the offending path — including the temp file,
 * which is an implementation detail the tool never emits. The error's kind is
 * what a caller can act on. */
export function reason(error: unknown): string {
  if (!(error instanceof Error)) return "unknown error";
  const kind = error.name.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return kind === "error" ? "write failed" : kind;
}
