import { absent, lines, ok, type Outcome, refused } from "./outcome.ts";
import { NO_GIT } from "./git.ts";
import { find, ids, init as initSpace, readout, type Space } from "./space.ts";
import * as frontmatter from "./frontmatter.ts";
import type { Name, Properties, Text } from "./frontmatter.ts";
import { amend, create, read, replace, type Uuid } from "./node.ts";

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
    case "unwritable":
      return refused(`cannot create a space: ${result.reason}`);
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
  // The id is the filename, so this parses nothing. Filtering belonged to a
  // family whose vocabulary has not settled; see design/parked/search.md.
  return lines(await ids(resolved.space));
}

/** A refusal shared by every command that names a node whose file will not
 * read — the caller asked about that node, so the tool cannot honour it. */
function unreadable(
  id: string,
  found: { kind: "malformed" } | { kind: "unparseable"; reason: string },
): Outcome {
  return refused(
    found.kind === "malformed"
      ? `cannot read ${id}: no frontmatter block`
      : `cannot read ${id}: ${found.reason}`,
  );
}

/** Properties are rendered as YAML, which is what distinguishes a list from a
 * scalar that merely looks like one: the serialiser quotes exactly what would
 * otherwise change meaning coming back. */
const render = (properties: Properties): string[] => {
  const text = frontmatter.write(properties);
  return text === "" ? [] : text.trimEnd().split("\n");
};

export async function node(
  cwd: string,
  id: Uuid,
  asProperties: boolean,
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const found = await read(resolved.space, id);
  switch (found.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
    case "unparseable":
      return unreadable(id, found);
  }

  // stdout is one half of a node or the other, never both.
  const rendered = render(found.properties);
  return asProperties ? lines(rendered) : ok(found.content, ...rendered);
}

/** An empty node is legal — one carrying `kind: decision` with no prose yet is
 * a real thing. So the absence of `--stdin` is how you ask for one, and there
 * is nothing here to refuse: `node new --stdin` with nothing produces exactly
 * what `node new` produces. */
export async function nodeNew(cwd: string, content: string): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await create(resolved.space, content);
  if (result.kind === "unwritable") {
    return refused(`cannot create a node: ${result.reason}`);
  }
  // The id is the one thing the caller could not have worked out.
  return lines([result.id]);
}

export async function nodeWrite(
  cwd: string,
  id: Uuid,
  content: string,
): Promise<Outcome> {
  // `new` can only litter; `write` can destroy. A failed `cmd | kg node <id>
  // write --stdin` would empty a node that held prose and report success.
  if (content === "") {
    return refused("no content on stdin — did the command before the pipe fail?");
  }

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await replace(resolved.space, id, content);
  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
    case "unparseable":
      // Replacing the content preserves the properties, so a block that will
      // not read is a block this cannot safely write back.
      return unreadable(id, result);
    case "unwritable":
      return refused(`cannot write ${id}: ${result.reason}`);
    case "replaced":
      // Nothing on stdout: the caller supplied the id. What it could not know
      // is the size it displaced.
      return ok("", `replaced ${result.replaced} bytes`);
  }
}

/** `set` and `unset` are about the property; `add` and `remove` are about its
 * contents. The shape follows from the verb rather than from how many values
 * arrived, so `set x a` is a scalar and `add x a` is a one-element list. */
export async function nodeSet(
  cwd: string,
  id: Uuid,
  name: Name,
  value: Text,
): Promise<Outcome> {
  return await change(cwd, id, (properties) => {
    const had = name in properties;
    properties[name] = value;
    return had ? `replaced ${name}` : `set ${name}`;
  });
}

export async function nodeUnset(cwd: string, id: Uuid, name: Name): Promise<Outcome> {
  return await change(cwd, id, (properties) => {
    // `delete`, never an assignment: a key holding `undefined` would be a
    // second way to be absent, and `in` would stop agreeing with a lookup.
    const had = name in properties;
    delete properties[name];
    return had ? `unset ${name}` : `${name} was not set`;
  });
}

/** Idempotent: adding one already present, or removing one absent, is the end
 * state that was asked for. The count reported is the effective one — you know
 * how many you passed; what you could not know is how many were already there. */
export async function nodeAdd(
  cwd: string,
  id: Uuid,
  name: Name,
  values: Text[],
): Promise<Outcome> {
  return await change(cwd, id, (properties) => {
    const existing = properties[name];
    if (existing !== undefined && !frontmatter.isList(existing)) {
      // Promoting a scalar silently would be the tool deciding what was meant.
      return { refuse: `cannot add to ${name}: not a list` };
    }
    const list = existing ?? [];
    const fresh = values.filter((value) => !list.includes(value));
    if (fresh.length === 0) return undefined;
    properties[name] = [...list, ...fresh];
    return `added ${fresh.length} to ${name}`;
  });
}

export async function nodeRemove(
  cwd: string,
  id: Uuid,
  name: Name,
  values: Text[],
): Promise<Outcome> {
  return await change(cwd, id, (properties) => {
    const existing = properties[name];
    if (existing === undefined) return undefined;
    if (!frontmatter.isList(existing)) {
      return { refuse: `cannot remove from ${name}: not a list` };
    }
    const kept = existing.filter((value) => !values.includes(value));
    if (kept.length === existing.length) return undefined;
    const gone = existing.length - kept.length;
    // A property emptied must be indistinguishable from one never set.
    if (kept.length === 0) {
      delete properties[name];
      return `removed ${gone} from ${name}, ${name} is now unset`;
    }
    properties[name] = kept;
    return `removed ${gone} from ${name}`;
  });
}

/** The shared half of every property write: resolve, amend, report. Nothing
 * back from the callback means nothing changed, and nothing changed is worth no
 * words. */
async function change(
  cwd: string,
  id: Uuid,
  edit: (properties: Properties) => string | undefined | { refuse: string },
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const said: (string | undefined)[] = [];
  const result = await amend(resolved.space, id, (properties) => {
    const outcome = edit(properties);
    if (outcome !== undefined && typeof outcome === "object") return outcome.refuse;
    said.push(outcome);
  });

  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
    case "unparseable":
      return unreadable(id, result);
    case "refused":
      return refused(result.message);
    case "unwritable":
      return refused(`cannot write ${id}: ${result.reason}`);
    case "amended": {
      const note = said[0];
      // Nothing changed is worth no words.
      return note === undefined ? ok("") : ok("", note);
    }
  }
}
