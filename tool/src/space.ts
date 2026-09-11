import { basename, join } from "@std/path";
import { branch, initRepo, repoRoot } from "./git.ts";
import { reason } from "./node.ts";

/**
 * A space is `.kg/` at the root of the repository containing the working
 * directory. That is the whole lookup — no walk upward, no search order — so
 * `init` and every later command resolve identically and cannot disagree.
 */
export type Space = {
  readonly root: string;
  readonly name: string;
  readonly nodes: string;
  readonly labels: string;
};

/**
 * The tool writes LF and is the only writer. `-text` stops git converting in
 * either direction, so a checkout on Windows leaves a space byte-identical —
 * and a nearer rule beats the enclosing project's, so a space living beside
 * application code imposes nothing on it and inherits nothing from it.
 *
 * `text eol=lf` would also give LF, by normalising on commit — which is git
 * editing content the tool is custodian of.
 */
const GITATTRIBUTES = [
  "# Written by `kg space init`. The tool writes LF and is the only writer;",
  "# git must not convert in either direction.",
  "* -text",
  "",
].join("\n");

const at = (root: string): Space => ({
  root,
  name: basename(root),
  nodes: join(root, ".kg", "nodes"),
  labels: join(root, ".kg", "labels"),
});

export type Found =
  | { readonly kind: "space"; readonly space: Space }
  | { readonly kind: "none" }
  | { readonly kind: "no-git" };

export async function find(cwd: string): Promise<Found> {
  const repo = await repoRoot(cwd);
  if (repo.kind === "missing") return { kind: "no-git" };
  if (repo.kind === "none") return { kind: "none" };
  const space = at(repo.path);
  return (await isDir(space.nodes)) ? { kind: "space", space } : { kind: "none" };
}

export type Init =
  | { readonly kind: "made"; readonly space: Space; readonly madeRepo: boolean }
  | { readonly kind: "exists"; readonly space: Space }
  | { readonly kind: "unwritable"; readonly reason: string }
  | { readonly kind: "no-git" };

export async function init(cwd: string): Promise<Init> {
  const repo = await repoRoot(cwd);
  if (repo.kind === "missing") return { kind: "no-git" };

  let root = repo.kind === "root" ? repo.path : "";
  let madeRepo = false;
  if (repo.kind === "none") {
    if (!await initRepo(cwd)) return { kind: "no-git" };
    const made = await repoRoot(cwd);
    if (made.kind !== "root") return { kind: "no-git" };
    root = made.path;
    madeRepo = true;
  }

  const space = at(root);
  // One space or none: a repository holds one, and `init` never adopts one.
  if (await isDir(space.nodes)) return { kind: "exists", space };
  try {
    await Deno.mkdir(space.nodes, { recursive: true });
    await Deno.mkdir(space.labels, { recursive: true });
    await Deno.writeTextFile(join(root, ".kg", ".gitattributes"), GITATTRIBUTES);
  } catch (error) {
    return { kind: "unwritable", reason: reason(error) };
  }
  return { kind: "made", space, madeRepo };
}

/** Name, root, branch, size — the orientation every other command assumes. */
export async function readout(space: Space): Promise<string[]> {
  return [
    space.name,
    `  root     ${space.root}`,
    `  branch   ${await branch(space.root) ?? "(no commit yet)"}`,
    `  nodes    ${(await ids(space)).length}`,
  ];
}

/** Ids in creation order. A directory read: the id is the filename. */
export async function ids(space: Space): Promise<string[]> {
  const found: string[] = [];
  for await (const entry of Deno.readDir(space.nodes)) {
    if (entry.isFile && entry.name.endsWith(".md")) found.push(entry.name.slice(0, -3));
  }
  return found.sort();
}

export async function isDir(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}
