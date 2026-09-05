import { join } from "@std/path";
import { extractTimestamp, generate as uuidv7 } from "@std/uuid/v7";
import { absent, ok, type Outcome, refused } from "./outcome.ts";
import { findSpace, initSpace, nodesDir, relative } from "./space.ts";
import { serialise } from "./node.ts";

const NO_SPACE =
  "no space here — run `kg init`, or work inside a repository that has one";

export interface ListOptions {
  readonly meta: boolean;
  readonly path: boolean;
  readonly json: boolean;
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

    if (opts.json) return ok([JSON.stringify(record(id, rel), null, 2)]);
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

  // Nothing here parses. The id is the filename and a node carries no fields
  // yet, so a listing in either form is a directory read — see
  // design/location.md.
  return opts.json
    ? ok([JSON.stringify(ids.map((id) => record(id, rel(id))), null, 2)])
    : ok(ids.map((id) => opts.path ? rel(id) : id));
}

/**
 * `created` is read out of the id — UUIDv7 carries its creation time in its
 * first 48 bits — so it is never stored and cannot drift from the name it came
 * from. A node whose filename is not an id has no creation time to read, and
 * that is a broken space rather than a case to accommodate.
 */
function record(id: string, path: string) {
  return { id, path, created: new Date(extractTimestamp(id)).toISOString() };
}
