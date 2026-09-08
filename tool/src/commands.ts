import { absent, lines, ok, type Outcome, refused } from "./outcome.ts";
import { NO_GIT } from "./git.ts";
import { find, ids, init as initSpace, readout, type Space } from "./space.ts";
import { amend, isId, isName, properties, read, write } from "./node.ts";

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

/** Three predicates and no more. No comparison operators, no `or`, and no
 * negated values — `--without a=1` has two defensible readings, so it would
 * need a rule nobody remembers. */
export type Filter = {
  /** `name` alone means merely present; with a value, equal to it. */
  readonly where: readonly { name: string; value: string | null }[];
  readonly without: readonly string[];
};

export const unfiltered = (filter: Filter): boolean =>
  filter.where.length === 0 && filter.without.length === 0;

export async function nodes(cwd: string, filter: Filter): Promise<Outcome> {
  for (const { name } of filter.where) {
    if (!isName(name)) {
      return refused(
        `not a property name: ${name} — expected a lowercase hyphenated token`,
      );
    }
  }
  for (const name of filter.without) {
    if (!isName(name)) {
      return refused(
        `not a property name: ${name} — expected a lowercase hyphenated token`,
      );
    }
  }

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const found = await ids(resolved.space);
  // Bare, this parses nothing: the id is the filename. Filtered, it opens every
  // file, which is where the tool first runs over a whole space.
  if (unfiltered(filter)) return lines(found);

  const kept: string[] = [];
  const damaged: string[] = [];
  for (const id of found) {
    const props = await properties(resolved.space, id);
    if (props.kind !== "read") {
      // One damaged file must not make a space unfindable, and reporting is not
      // the same as failing.
      damaged.push(
        `skipped ${id}: ${
          props.kind === "malformed"
            ? "no frontmatter block"
            : "properties are not valid yaml"
        }`,
      );
      continue;
    }
    if (matches(props.properties, filter)) kept.push(id);
  }
  return lines(kept, ...damaged);
}

/** The tool compares strings and understands nothing — it does not know what
 * `decided-by` names, only whether the text matches. */
function matches(properties: Record<string, string>, filter: Filter): boolean {
  for (const { name, value } of filter.where) {
    if (!(name in properties)) return false;
    if (value !== null && properties[name] !== value) return false;
  }
  for (const name of filter.without) {
    if (name in properties) return false;
  }
  return true;
}

/** A refusal shared by every command that names a node whose file will not
 * read — the caller asked about that node, so the tool cannot honour it. */
function unreadable(id: string, kind: "malformed" | "unparseable"): Outcome {
  return refused(
    kind === "malformed"
      ? `cannot read ${id}: no frontmatter block`
      : `cannot read ${id}: properties are not valid yaml`,
  );
}

export async function node(
  cwd: string,
  id: string,
  asProperties: boolean,
): Promise<Outcome> {
  // Validation precedes lookup, so a refused call cannot have touched anything
  // — and the same argument gets the same verdict whichever half was asked for.
  if (!isId(id)) return refused(`not an id: ${id} — expected a uuid`);

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const found = await properties(resolved.space, id);
  switch (found.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
    case "unparseable":
      return unreadable(id, found.kind);
  }

  // stdout is one half of a node or the other, never both. `--properties` swaps
  // which; the rendering is the same either way.
  const rendered = render(found.properties);
  if (asProperties) return lines(rendered);

  const content = await read(resolved.space, id);
  if (content.kind !== "read") return unreadable(id, "malformed");
  // Reading the content puts the properties on stderr — an agent wants to know
  // how a node is classified, and a consumer discarding stderr loses nothing it
  // needed.
  return ok(content.content, ...rendered);
}

const render = (properties: Record<string, string>): string[] =>
  Object.keys(properties).sort().map((name) => `${name}: ${properties[name]}`);

export async function nodeNew(
  cwd: string,
  stdin: Stdin,
  allowEmpty: boolean,
): Promise<Outcome> {
  const content = contentFrom(stdin, allowEmpty);
  if (content.kind === "refused") return content.outcome;

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await write(resolved.space, null, content.text);
  if (result.kind !== "written") return refused(`could not create a node`);
  // The id is the one thing the caller could not have worked out.
  return lines([result.id]);
}

export async function nodeWrite(
  cwd: string,
  id: string,
  stdin: Stdin,
  allowEmpty: boolean,
): Promise<Outcome> {
  if (!isId(id)) return refused(`not an id: ${id} — expected a uuid`);

  const content = contentFrom(stdin, allowEmpty);
  if (content.kind === "refused") return content.outcome;

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await write(resolved.space, id, content.text);
  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
      return unreadable(id, "malformed");
    case "written":
      // Nothing on stdout: the caller supplied the id. What it could not know
      // is the size it displaced.
      return ok("", `replaced ${result.replaced} bytes`);
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

/** `set` and `unset` are about the property. The value is stored as given — the
 * tool writes back the text it was handed and never decides what it means. */
export async function nodeSet(
  cwd: string,
  id: string,
  name: string,
  value: string | null,
): Promise<Outcome> {
  if (!isId(id)) return refused(`not an id: ${id} — expected a uuid`);
  if (!isName(name)) {
    return refused(
      `not a property name: ${name} — expected a lowercase hyphenated token`,
    );
  }

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const result = await amend(resolved.space, id, name, value);
  switch (result.kind) {
    case "absent":
      return absent(`no such node: ${id} in ${resolved.space.name}`);
    case "malformed":
    case "unparseable":
      return unreadable(id, result.kind);
    case "amended":
      // Whether it existed is the part the caller could not have known.
      // Removing a property that is absent is the end state that was asked for.
      return ok(
        "",
        value === null
          ? (result.had ? `unset ${name}` : `${name} was not set`)
          : (result.had ? `replaced ${name}` : `set ${name}`),
      );
  }
}
