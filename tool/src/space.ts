import { basename, dirname, join, resolve } from "@std/path";

export const KG = ".kg";

export interface Space {
  /** Absolute path to the `.kg` directory. */
  readonly root: string;
}

/**
 * A space's name is the name of the repository directory holding it — not its
 * path, and not anything written down. It travels when the repository is moved
 * or cloned, exactly as a node's name travels with its file. Nothing in this
 * batch consumes it; a consumer does, when one can mount.
 */
export const spaceName = (s: Space) => basename(dirname(s.root));

/**
 * Walk up from `from` to the first `.kg/`. The directory is what marks a space;
 * nothing inside has to assert it, and nothing records the space's own name —
 * a space never refers to itself. See design/location.md.
 */
export async function findSpace(from = Deno.cwd()): Promise<Space | null> {
  let dir = resolve(from);
  for (;;) {
    const root = join(dir, KG);
    try {
      if ((await Deno.stat(root)).isDirectory) return { root };
    } catch { /* not here; keep climbing */ }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export const nodesDir = (s: Space, meta: boolean) =>
  meta ? join(s.root, "meta", "nodes") : join(s.root, "nodes");

/** Relative to the repository root, which is the parent of `.kg/`. */
export const relative = (s: Space, path: string) =>
  path.slice(dirname(s.root).length + 1);

type GitResult =
  | { readonly kind: "ran"; readonly stdout: string }
  | { readonly kind: "failed" }
  | { readonly kind: "missing" };

/**
 * Resolved from `PATH`, and nowhere else. The tool bundles no git, embeds no
 * git, and maintains no search order — the user's own is the one holding their
 * credentials, which is what cloning a private space will need. When it is
 * absent the answer is to install it, and `missing` is what lets the caller say
 * so rather than crash.
 */
async function git(args: string[], cwd: string): Promise<GitResult> {
  const command = new Deno.Command("git", { args, cwd, stdout: "piped", stderr: "null" });
  try {
    const { code, stdout } = await command.output();
    return code === 0
      ? { kind: "ran", stdout: new TextDecoder().decode(stdout).trim() }
      : { kind: "failed" };
  } catch {
    // A missing binary throws rather than returning a non-zero code.
    return { kind: "missing" };
  }
}

export type InitResult =
  | {
    readonly kind: "created";
    readonly root: string;
    readonly repo: string;
    readonly name: string;
    /** Whether this call had to create the repository too. */
    readonly repoCreated: boolean;
  }
  | { readonly kind: "exists"; readonly root: string }
  | { readonly kind: "no-git" }
  | { readonly kind: "git-failed" };

/**
 * A space sits at `.kg/` in a repository's **root**, so `init` finds the root
 * rather than using the working directory — and creates the repository when
 * there is none, since a space without one has no history, and several rules
 * lean on a space having an unambiguous prior state.
 */
export async function initSpace(cwd = Deno.cwd()): Promise<InitResult> {
  const here = resolve(cwd);
  const found = await git(["rev-parse", "--show-toplevel"], here);
  if (found.kind === "missing") return { kind: "no-git" };

  let repo = found.kind === "ran" ? found.stdout : null;
  let repoCreated = false;

  if (repo === null) {
    const created = await git(["init", "--quiet"], here);
    if (created.kind === "missing") return { kind: "no-git" };
    if (created.kind === "failed") return { kind: "git-failed" };
    repo = here;
    repoCreated = true;
  }

  const root = join(repo, KG);
  try {
    await Deno.stat(root);
    return { kind: "exists", root };
  } catch { /* absent, which is what we want */ }

  await Deno.mkdir(join(root, "nodes"), { recursive: true });
  await Deno.mkdir(join(root, "meta", "nodes"), { recursive: true });
  return { kind: "created", root, repo, name: basename(repo), repoCreated };
}
