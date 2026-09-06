import { join } from "@std/path";
import { extractTimestamp, generate as uuidv7 } from "@std/uuid/v7";
import { absent, ok, type Outcome, refused, usage } from "./outcome.ts";
import { findSpace, initSpace, nodesDir, relative } from "./space.ts";
import { type Attrs, labelsOf, serialise, split, writeAtomic } from "./node.ts";
import { isId, isLabel } from "./tokens.ts";

const NO_SPACE =
  "no space here — run `kg init`, or work inside a repository that has one";

/**
 * A string that is not an id is refused, not reported absent: the tool could
 * never have minted it as a filename, so it did not look and find nothing — it
 * was asked something it cannot answer. An id that is well formed but not here
 * is absent, which keeps the two apart for a caller deciding whether to fix its
 * input or conclude the node is gone.
 */
const badId = (id: string) => refused(`not an id: ${id} — expected a uuid`);

export interface ListOptions {
  readonly labels: string[];
  readonly meta: boolean;
  readonly path: boolean;
  readonly json: boolean;
}

/** A node found and parsed, or the reason it could not be. */
type Loaded =
  | { readonly kind: "loaded"; readonly attrs: Attrs; readonly body: string }
  | { readonly kind: "unreadable"; readonly reason: string };

async function load(path: string): Promise<Loaded> {
  let text: string;
  try {
    text = await Deno.readTextFile(path);
  } catch (e) {
    return { kind: "unreadable", reason: (e as Error).message };
  }
  const result = split(text);
  return result.kind === "malformed"
    ? { kind: "unreadable", reason: result.reason }
    : { kind: "loaded", attrs: result.attrs, body: result.body };
}

export async function init(cwd = Deno.cwd()): Promise<Outcome> {
  const result = await initSpace(cwd);
  switch (result.kind) {
    case "exists":
      return refused(
        `${result.root} already exists — a repository holds one space or none`,
      );
    case "no-git":
      return refused(
        "git is not installed, and a space needs a repository.\n" +
          "  macOS    xcode-select --install\n" +
          "  Windows  winget install Git.Git\n" +
          "  Linux    your package manager, e.g. apt install git",
      );
    case "git-failed":
      return refused(`git could not create a repository in ${cwd}`);
    case "created":
      return ok([
        ...(result.repoCreated ? [`initialised a repository at ${result.repo}`] : []),
        `${result.root} — space \`${result.name}\``,
      ]);
  }
}

export async function newNode(
  opts: { meta: boolean },
  cwd = Deno.cwd(),
): Promise<Outcome> {
  const space = await findSpace(cwd);
  if (space === null) return refused(NO_SPACE);

  const id = uuidv7();
  const path = join(nodesDir(space, opts.meta), `${id}.md`);
  await Deno.writeTextFile(path, serialise({}, ""));
  return ok([relative(space, path)]);
}

export async function show(
  id: string,
  opts: { path: boolean; json: boolean },
  cwd = Deno.cwd(),
): Promise<Outcome> {
  if (!isId(id)) return badId(id);

  const space = await findSpace(cwd);
  if (space === null) return refused(NO_SPACE);

  for (const meta of [false, true]) {
    const path = join(nodesDir(space, meta), `${id}.md`);
    try {
      await Deno.stat(path);
    } catch {
      continue;
    }
    const rel = relative(space, path);
    if (opts.path) return ok([rel]);

    if (opts.json) {
      const node = await load(path);
      if (node.kind === "unreadable") return refused(`${rel}: ${node.reason}`);
      return ok([JSON.stringify(record(id, rel, labelsOf(node.attrs)), null, 2)]);
    }
    return ok([await Deno.readTextFile(path)]);
  }
  return absent(`no node ${id} in this space`);
}

export async function list(opts: ListOptions, cwd = Deno.cwd()): Promise<Outcome> {
  const space = await findSpace(cwd);
  if (space === null) return refused(NO_SPACE);

  const dir = nodesDir(space, opts.meta);
  const ids: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".md")) ids.push(entry.name.slice(0, -3));
  }
  ids.sort();

  const rel = (id: string) => relative(space, join(dir, `${id}.md`));

  // Unfiltered and not JSON: a directory read. The id is the filename, so
  // enumerating a space costs no parser at all — see design/location.md.
  if (opts.labels.length === 0 && !opts.json) {
    return ok(ids.map((id) => opts.path ? rel(id) : id));
  }

  const lines: string[] = [];
  const records: Record<string, unknown>[] = [];
  const warnings: string[] = [];

  for (const id of ids) {
    const node = await load(join(dir, `${id}.md`));
    if (node.kind === "unreadable") {
      // One damaged file must not make a space unfindable: report and go on.
      warnings.push(`skipped ${rel(id)}: ${node.reason}`);
      continue;
    }
    const labels = labelsOf(node.attrs);
    if (!opts.labels.every((wanted) => labels.includes(wanted))) continue;

    if (opts.json) records.push(record(id, rel(id), labels));
    else lines.push(opts.path ? rel(id) : id);
  }

  return opts.json
    ? ok([JSON.stringify(records, null, 2)], warnings)
    : ok(lines, warnings);
}

/**
 * Reads the node, alters the list, writes it back. Validation runs first, so a
 * refused call leaves the node untouched.
 *
 * Removing the last label removes the key: a node that once had labels must be
 * indistinguishable from one that never did, and `labels: []` would be a
 * residue recording history that frontmatter has no business carrying.
 */
export async function label(
  id: string,
  names: string[],
  opts: { remove: boolean },
  cwd = Deno.cwd(),
): Promise<Outcome> {
  if (names.length === 0) return usage("label needs at least one name");
  const bad = names.filter((n) => !isLabel(n));
  if (bad.length > 0) {
    return refused(
      `not a label: ${bad.join(", ")} — lowercase letters, digits and hyphens only`,
    );
  }

  if (!isId(id)) return badId(id);

  const space = await findSpace(cwd);
  if (space === null) return refused(NO_SPACE);

  for (const meta of [false, true]) {
    const path = join(nodesDir(space, meta), `${id}.md`);
    try {
      await Deno.stat(path);
    } catch {
      continue;
    }
    const node = await load(path);
    if (node.kind === "unreadable") {
      return refused(`${relative(space, path)}: ${node.reason}`);
    }

    const current = labelsOf(node.attrs);
    const next = opts.remove
      ? current.filter((l) => !names.includes(l))
      : [...current, ...names.filter((n) => !current.includes(n))];

    const attrs = { ...node.attrs };
    if (next.length === 0) delete attrs.labels;
    else attrs.labels = next;

    await writeAtomic(path, serialise(attrs, node.body));
    return ok([relative(space, path)]);
  }
  return absent(`no node ${id} in this space`);
}

/**
 * `created` is read out of the id — UUIDv7 carries its creation time in its
 * first 48 bits — so it is never stored and cannot drift from the name it came
 * from. A node whose filename is not an id has no creation time to read, and
 * that is a broken space rather than a case to accommodate.
 */
function record(id: string, path: string, labels: string[] = []) {
  const created = new Date(extractTimestamp(id)).toISOString();
  // A node with no labels omits the key, matching what is on disk.
  return labels.length === 0 ? { id, path, created } : { id, path, created, labels };
}
