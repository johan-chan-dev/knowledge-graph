import { isName, isStructure, WORD_WHY } from "./frontmatter.ts";
import type { Name, Properties, Structure, Value } from "./frontmatter.ts";

/**
 * A path into a node's properties — `config.port`, and `title` too.
 *
 * **A place, which is a different thing from a name.** A name is stored and
 * obeys the word rule; a path is typed to reach a stored thing and never lands
 * on disk. The dot can therefore mean *address* here and be refused inside a
 * JSON object, with position deciding rather than anything guessing —
 * `docs/batches/15-one-write.md`.
 */
export type Path = readonly Name[];

export type Read =
  | { readonly kind: "path"; readonly path: Path }
  | { readonly kind: "refused"; readonly message: string };

export function parse(source: string): Read {
  if (source === "") return { kind: "refused", message: "an empty path names nothing" };
  const segments = source.split(".");
  for (const segment of segments) {
    if (segment === "") {
      return {
        kind: "refused",
        message: `not a path: ${source} — a segment between two dots is missing`,
      };
    }
    if (!isName(segment)) {
      // One segment is a name, so the refusal is the one every other door
      // gives; several, and the path is worth naming beside the segment.
      return {
        kind: "refused",
        message: segments.length === 1
          ? `not a property name: ${segment} — ${WORD_WHY}`
          : `not a property name: ${segment} in ${source} — ${WORD_WHY}`,
      };
    }
  }
  return { kind: "path", path: segments as Name[] };
}

export const render = (path: Path): string => path.join(".");

/** What is at the path, or nothing. A path that runs off the end of a scalar
 * finds nothing rather than complaining: reading is a question. */
export function at(properties: Properties, path: Path): Value | undefined {
  let here: Value | undefined = properties as unknown as Value;
  for (const segment of path) {
    if (!isStructure(here)) return undefined;
    here = (here as Structure)[segment];
  }
  return here;
}

export type Written =
  | {
    readonly kind: "written";
    /** The leaves touched, by path — so a report can name one rather than
     * count it, and naming the leaf rather than the place written to is the
     * difference between *replaced config* and *replaced config.port*. */
    readonly set: readonly string[];
    readonly replaced: readonly string[];
  }
  | { readonly kind: "refused"; readonly message: string };

/**
 * Merge `value` into `properties` at `path`, deeply.
 *
 * **Deep through maps, and not into a list.** A map has sub-addresses to merge
 * into because it holds things; a list holds nothing — it says several things
 * on one dimension — so it is replaced whole, and `add` and `remove` are how it
 * changes without being restated. [batch 9](../../docs/batches/9-find.md) has
 * the argument.
 *
 * Counts are **leaves**, not keys: reporting `1` whether an object carried one
 * leaf or forty tells the caller nothing they did not already send.
 */
export function merge(properties: Properties, path: Path, value: Value): Written {
  const counted: Counted = { set: [], replaced: [] };
  const held = place(properties, path);
  if (held.kind === "refused") return held;
  held.holder[held.key] = into(
    held.holder[held.key] as Value | undefined,
    value,
    render(path),
    counted,
  );
  return { kind: "written", ...counted };
}

type Counted = { set: string[]; replaced: string[] };

type Place =
  | {
    readonly kind: "place";
    readonly holder: Record<string, Value>;
    readonly key: string;
  }
  | { readonly kind: "refused"; readonly message: string };

/**
 * The map a path's last segment lives in, creating the maps above it.
 *
 * **A path may not pass through a scalar.** Replacing a value with a structure
 * because a path needed one to exist is the tool deciding what was meant, which
 * [batch 4](../../docs/batches/4-stops-guessing.md) removed it for.
 */
function place(properties: Properties, path: Path): Place {
  let holder = properties as unknown as Record<string, Value>;
  for (const segment of path.slice(0, -1)) {
    const next = holder[segment];
    if (next === undefined) {
      const fresh: Record<string, Value> = {};
      holder[segment] = fresh as Structure;
      holder = fresh;
      continue;
    }
    if (!isStructure(next)) {
      return {
        kind: "refused",
        message: `${segment} holds a value, so a path cannot pass through it`,
      };
    }
    holder = next as Record<string, Value>;
  }
  return { kind: "place", holder, key: path[path.length - 1]! };
}

/**
 * One value onto another. A map merges; anything else replaces what was there,
 * because naming the place is the whole of the instruction.
 *
 * It cannot fail, and says so by returning a `Value` rather than a union with
 * `string`. Such a union is a trap here: a value **is** a string, so the error
 * channel and the success channel have the same type and the first swallows
 * the second.
 */
function into(
  had: Value | undefined,
  value: Value,
  at: string,
  counted: Counted,
): Value {
  if (!isStructure(value)) {
    (had === undefined ? counted.set : counted.replaced).push(at);
    return value;
  }
  const out: Record<string, Value> = isStructure(had) ? { ...(had as Structure) } : {};
  for (const [name, nested] of Object.entries(value as Structure)) {
    out[name] = into(
      isStructure(had) ? out[name] : undefined,
      nested,
      `${at}.${name}`,
      counted,
    );
  }
  return out;
}

export type Removed =
  | {
    readonly kind: "removed";
    readonly gone: readonly string[];
    readonly absent: readonly string[];
  }
  | { readonly kind: "refused"; readonly message: string };

/**
 * Remove each path, and any map a removal empties.
 *
 * A container holding nothing is not a fact about the node — which is what the
 * tool already does to a list, saying *tags is now unset* rather than leaving
 * `[]` behind.
 */
export function remove(properties: Properties, paths: readonly Path[]): Removed {
  const gone: string[] = [];
  const absent: string[] = [];
  for (const path of paths) {
    let holder = properties as unknown as Record<string, Value>;
    const chain: Record<string, Value>[] = [holder];
    let missing = false;
    for (const segment of path.slice(0, -1)) {
      const next = holder[segment];
      if (!isStructure(next)) {
        missing = true;
        break;
      }
      holder = next as Record<string, Value>;
      chain.push(holder);
    }
    const key = path[path.length - 1]!;
    if (missing || !(key in holder)) {
      absent.push(render(path));
      continue;
    }
    delete holder[key];
    gone.push(render(path));
    // Walk back up, dropping every map the removal emptied.
    for (let i = chain.length - 1; i > 0; i--) {
      if (Object.keys(chain[i]!).length > 0) break;
      delete chain[i - 1]![path[i - 1]!];
    }
  }
  return { kind: "removed", gone, absent };
}
