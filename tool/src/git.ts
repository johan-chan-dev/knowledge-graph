/**
 * The external binary, resolved from PATH, and nothing else. `missing` is a
 * distinct outcome because `Deno.Command().output()` throws when the binary is
 * absent rather than returning a code — uncaught, the tool dies with a stack
 * trace, which is the failure an agent reads worst.
 */
type Ran =
  | { readonly kind: "ran"; readonly ok: boolean; readonly stdout: string }
  | { readonly kind: "missing" };

async function git(args: string[], cwd: string): Promise<Ran> {
  try {
    const { success, stdout } = await new Deno.Command("git", {
      args,
      cwd,
      stdout: "piped",
      stderr: "null",
    }).output();
    return { kind: "ran", ok: success, stdout: new TextDecoder().decode(stdout).trim() };
  } catch {
    return { kind: "missing" };
  }
}

export type RepoRoot =
  | { readonly kind: "root"; readonly path: string }
  | { readonly kind: "none" }
  | { readonly kind: "missing" };

export async function repoRoot(cwd: string): Promise<RepoRoot> {
  const result = await git(["rev-parse", "--show-toplevel"], cwd);
  if (result.kind === "missing") return { kind: "missing" };
  return result.ok ? { kind: "root", path: result.stdout } : { kind: "none" };
}

/** The checked-out branch, or null on a repository with no commit yet. */
export async function branch(cwd: string): Promise<string | null> {
  const result = await git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  if (result.kind === "missing" || !result.ok) return null;
  return result.stdout === "HEAD" ? null : result.stdout;
}

export async function initRepo(cwd: string): Promise<boolean> {
  const result = await git(["init", "--quiet"], cwd);
  return result.kind === "ran" && result.ok;
}

/** Written to be acted on rather than merely reported. */
export const NO_GIT = [
  "git is not installed, and a space needs a repository.",
  "  macOS    xcode-select --install",
  "  Windows  winget install Git.Git",
  "  Linux    your package manager, e.g. apt install git",
].join("\n");
