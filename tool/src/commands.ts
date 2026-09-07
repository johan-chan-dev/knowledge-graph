import { absent, lines, ok, type Outcome, refused } from "./outcome.ts";
import { NO_GIT } from "./git.ts";
import { find, ids, init as initSpace, readout, type Space } from "./space.ts";
import { isId, measure, read, write } from "./node.ts";

const NO_SPACE = "no space here — run: kg space init";

/** Every command but `space init` needs a space first, and refuses the same
 * way when there is none — so the precondition is resolved in one place. */
type Resolved =
  | { readonly kind: "space"; readonly space: Space }
  | { readonly kind: "stop"; readonly outcome: Outcome };

async function resolve(cwd: string): Promise<Resolved> {
  const found = await find(cwd);
  switch (found.kind) {
    case "space":
      return { kind: "space", space: found.space };
    case "no-git":
      return { kind: "stop", outcome: refused(NO_GIT) };
    case "none":
      return { kind: "stop", outcome: absent(NO_SPACE) };
  }
}

export async function space(cwd: string): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  return lines(await readout(resolved.space));
}

export async function spaceInit(cwd: string): Promise<Outcome> {
  const result = await initSpace(cwd);
  switch (result.kind) {
    case "no-git":
      return refused(NO_GIT);
    case "exists":
      return refused(
        `this repository already has a space at ${result.space.root}/.kg`,
      );
    case "made": {
      // Init's job is to leave you oriented, and the orientation call already
      // exists — so it prints the same readout rather than inventing a message.
      const note = result.madeRepo
        ? [`initialised a git repository at ${result.space.root}`]
        : [];
      return lines(await readout(result.space), ...note);
    }
  }
}

export async function nodes(cwd: string): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  return lines(await ids(resolved.space));
}

export async function node(cwd: string, id: string): Promise<Outcome> {
  // Validation precedes lookup, so a refused call cannot have touched anything.
  if (!isId(id)) return refused(`not an id: ${id} — expected a uuid`);

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await read(resolved.space, id);
  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
      return refused(`cannot read ${id}: no frontmatter block`);
    case "read":
      // stdout is the content, byte for byte — the only command whose output
      // is data rather than a report.
      return ok(result.content, measure(result.content));
  }
}

export async function nodeWrite(
  cwd: string,
  id: string | null,
  stdin: Stdin,
  allowEmpty: boolean,
): Promise<Outcome> {
  if (id !== null && !isId(id)) return refused(`not an id: ${id} — expected a uuid`);

  const content = contentFrom(stdin, allowEmpty);
  if (content.kind === "refused") return content.outcome;

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await write(resolved.space, id, content.text);
  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
      return refused(`cannot read ${id}: no frontmatter block`);
    case "written": {
      const wrote = `wrote ${new TextEncoder().encode(content.text).length} bytes`;
      const note = result.replaced === null
        ? wrote
        : `${wrote}, replacing ${result.replaced}`;
      return lines([result.id], note);
    }
  }
}

/** What `node write` was handed. `terminal` means nothing was piped in. */
export type Stdin =
  | { readonly kind: "terminal" }
  | { readonly kind: "piped"; readonly text: string };

type Content =
  | { readonly kind: "content"; readonly text: string }
  | { readonly kind: "refused"; readonly outcome: Outcome };

/**
 * Decide what content a write is being given.
 *
 * `cmd | kg node write` where cmd failed and `kg node write </dev/null` are
 * byte-identical requests meaning opposite things, and the shell has already
 * erased the difference. So an empty stdin refuses and asks which was meant.
 *
 * Refusing matters most when replacing: accepting there turns a silent upstream
 * failure into a node's content destroyed and reported as success. Creating an
 * empty node by accident is only litter.
 *
 * `--allow-empty` resolves the ambiguity without the tool acquiring an opinion
 * about content — it refuses an ambiguous *call*, never a value.
 */
function contentFrom(stdin: Stdin, allowEmpty: boolean): Content {
  const text = stdin.kind === "terminal" ? "" : stdin.text;
  if (text === "" && !allowEmpty) {
    return {
      kind: "refused",
      outcome: refused(
        "no content on stdin — pipe content in, or pass --allow-empty for an empty node",
      ),
    };
  }
  return { kind: "content", text };
}
