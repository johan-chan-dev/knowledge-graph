import { absent, asJson, lines, ok, type Outcome, refused, usage } from "./outcome.ts";
import { NO_GIT } from "./git.ts";
import { find, ids, init as initSpace, readout, type Space } from "./space.ts";
import * as frontmatter from "./frontmatter.ts";
import type { Label, Name, Properties, Text, Value } from "./frontmatter.ts";
import * as vocabulary from "./vocabulary.ts";
import * as pattern from "./pattern.ts";
import * as path from "./path.ts";
import { matched } from "./match.ts";
import * as link from "./link.ts";
import type { Entry } from "./frontmatter.ts";
import { amend, create, isId, read, replace, type Uuid } from "./node.ts";

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

/**
 * The properties of several nodes, as an array — the singular with its ids
 * handed over rather than named one at a time.
 *
 * Ids arrive on stdin or in argv, never both. Two channels rather than two
 * paths: they feed this same function and cannot diverge, and what separates
 * them is a ceiling — `ARG_MAX` is a megabyte, so a hundred thousand ids need a
 * pipe and three do not.
 *
 * Each object carries its `id`, which the singular form does not need: with one
 * node the caller knows which, with many they do not.
 */
export async function nodesProperties(
  cwd: string,
  ids: readonly Uuid[],
  fromStdin: boolean,
  stdin: () => Promise<string>,
): Promise<Outcome> {
  if (ids.length > 0 && fromStdin) {
    return usage("nodes --properties takes ids, or --stdin, and not both");
  }
  if (ids.length === 0 && !fromStdin) {
    return usage("nodes --properties needs ids, or --stdin");
  }

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  let wanted: string[] = [...ids];
  if (fromStdin) {
    wanted = (await stdin()).split("\n").map((line) => line.trim()).filter(Boolean);
    const bad = wanted.find((each) => !isId(each));
    if (bad !== undefined) return refused(`not an id: ${bad} — expected a uuid`);
  }

  const out: Properties[] = [];
  let missing = 0;
  for (const id of wanted as Uuid[]) {
    const found = await read(space, id);
    if (found.kind !== "read") {
      missing++;
      continue;
    }
    out.push({
      id,
      ...await resolveLinks(space, found.properties),
    } as unknown as Properties);
  }

  // A node the caller named and that is not here shortens the answer, so the
  // count goes to stderr — what they could not have worked out, where stdout
  // stays the answer.
  const body = JSON.stringify(out, null, 2) + "\n";
  return missing === 0
    ? ok(body)
    : ok(body, `${missing} id${missing === 1 ? "" : "s"} did not read`);
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

/**
 * Properties as lines of JSON — for the advisory that accompanies content on
 * stderr, which has to be **the same rendering** as `--properties` puts on
 * stdout, or the same data would read two ways depending on which half was
 * asked for. A test pins that.
 *
 * A node carrying nothing says nothing **here**, and prints `{}` on stdout.
 * The two differ because their readers do: stdout is JSON and an output that is
 * JSON except when empty is not JSON, while this is an advisory for a person,
 * and an advisory with nothing to advise is noise.
 */
const render = (properties: Properties): string[] =>
  Object.keys(properties).length === 0
    ? []
    : JSON.stringify(properties, null, 2).split("\n");

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
  const properties = await resolveLinks(resolved.space, found.properties);
  if (asProperties) return asJson(properties);
  return ok(found.content, ...render(properties));
}

/**
 * Each `links` entry, with the node at the other end and the relation's own
 * properties read in.
 *
 * The file keeps `{type, link, direction}`: `link` is the **record's** uuid, so
 * a node's own file cannot answer *who am I connected to*. Duplicating the far
 * end into the entry would have to be kept true; resolving it has nothing to
 * keep, and nothing stored moves.
 *
 * `neighbour` rather than `target` or `to` — with `direction: in` the node at
 * the other end is the source, so either would be wrong half the time.
 */
async function resolveLinks(space: Space, properties: Properties): Promise<Properties> {
  const carried = properties[LINKS];
  if (!frontmatter.isLinks(carried)) return properties;

  const resolved: Value[] = [];
  for (const entry of carried) {
    const found = await link.read(space, entry.link);
    if (found.kind !== "read") {
      resolved.push(entry as unknown as Value);
      continue;
    }
    const other = entry.direction === "out" ? found.record.to : found.record.from;
    resolved.push({
      ...entry,
      neighbour: other,
      ...found.record.properties,
    } as unknown as Value);
  }
  return { ...properties, [LINKS]: resolved as Value };
}

/** An empty node is legal — one carrying `kind: decision` with no prose yet is
 * a real thing. So the absence of `--stdin` is how you ask for one, and there
 * is nothing here to refuse: `node new --stdin` with nothing produces exactly
 * what `node new` produces. */
export async function nodeNew(
  cwd: string,
  content: string,
  words: Label[] = [],
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  for (const word of words) {
    const made = await vocabulary.ensure(resolved.space.labels, word);
    if (made.kind !== "written") return refused(notStored("label", word, made));
  }
  const born: Properties = words.length === 0 ? {} : { [LABELS]: words.map(asText) };
  const result = await create(resolved.space, content, born);
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
/**
 * A place and a thing. `set title "x"` is a path of length one and a scalar;
 * `set config --stdin` is a path and an object; `set --stdin` is the root and an
 * object. The verb is the same and so is its meaning — write here, leave the
 * rest — which is why the third form is the root case rather than a form of its
 * own. `docs/batches/15-one-write.md`.
 */
/**
 * What `set` was handed: where to write, and what. Shared by a node and a
 * record, because a record is a document of properties too.
 */
type Asked =
  | {
    readonly kind: "held";
    readonly first: string | undefined;
    readonly targets: readonly { at: path.Path; value: Value }[];
  }
  | { readonly kind: "stop"; readonly outcome: Outcome };

async function asked(
  where: string | undefined,
  value: Text | undefined,
  fromStdin: boolean,
  stdin: () => Promise<string>,
): Promise<Asked> {
  // Three forms and a refusal. The refusal is the one `nodes --properties`
  // gives for ids against `--stdin`: two sources for one thing is a question
  // the command cannot answer for the caller.
  if (fromStdin && value !== undefined) {
    return {
      kind: "stop",
      outcome: usage("set takes a value, or --stdin, and not both"),
    };
  }
  if (!fromStdin && value === undefined) {
    return { kind: "stop", outcome: usage("set needs a path and a value, or --stdin") };
  }

  let held: Value;
  if (value === undefined) {
    const read = frontmatter.fromJson(await stdin());
    if (read.kind === "refused") return { kind: "stop", outcome: refused(read.message) };
    held = read.properties as unknown as Value;
  } else {
    // The argument schema cannot check this any more: `set` takes one
    // positional or two, so what a value must be is the command's to enforce.
    const why = frontmatter.notAValue(value);
    if (why !== undefined) {
      return {
        kind: "stop",
        outcome: refused(`not a property value: ${why} — a value is a single line`),
      };
    }
    held = value;
  }

  if (where === undefined) {
    // The root case: an object with no path merges key by key, which is the
    // same act one level up rather than a different one.
    const targets = Object.keys(held as Record<string, Value>).map((name) => ({
      at: [name] as unknown as path.Path,
      value: (held as Record<string, Value>)[name]!,
    }));
    return { kind: "held", first: targets[0] && path.render(targets[0].at), targets };
  }
  const parsed = path.parse(where);
  if (parsed.kind === "refused") {
    return { kind: "stop", outcome: refused(parsed.message) };
  }
  return {
    kind: "held",
    first: parsed.path[0],
    targets: [{ at: parsed.path, value: held }],
  };
}

/** The edit itself, over whichever document. */
function write(
  properties: Properties,
  targets: readonly { at: path.Path; value: Value }[],
): string | undefined | { refuse: string } {
  const counted = { set: [] as string[], replaced: [] as string[] };
  for (const target of targets) {
    const reserved = frontmatter.reservedReason(target.at[0]!);
    if (reserved !== undefined) {
      return { refuse: `${target.at[0]} is reserved — ${reserved}` };
    }
    const wrote = path.merge(properties, target.at, target.value);
    if (wrote.kind === "refused") return { refuse: wrote.message };
    counted.set.push(...wrote.set);
    counted.replaced.push(...wrote.replaced);
  }
  const touched = counted.set.length + counted.replaced.length;
  if (touched === 0) return undefined;
  // One leaf is named — and named by **its own** path, since writing
  // `{port: "9090"}` at `config` replaces `config.port`, not `config`.
  // Several give way to counts, the same split at a size a person reads.
  if (touched === 1) {
    return counted.replaced.length === 1
      ? `replaced ${counted.replaced[0]}`
      : `set ${counted.set[0]}`;
  }
  return `set ${counted.set.length}, replaced ${counted.replaced.length}`;
}

type Paths =
  | { readonly kind: "paths"; readonly paths: readonly path.Path[] }
  | { readonly kind: "stop"; readonly outcome: Outcome };

function asPaths(wheres: readonly string[]): Paths {
  const paths: path.Path[] = [];
  for (const where of wheres) {
    const parsed = path.parse(where);
    if (parsed.kind === "refused") {
      return { kind: "stop", outcome: refused(parsed.message) };
    }
    const reserved = frontmatter.reservedReason(parsed.path[0]!);
    if (reserved !== undefined) {
      return {
        kind: "stop",
        outcome: refused(`${parsed.path[0]} is reserved — ${reserved}`),
      };
    }
    paths.push(parsed.path);
  }
  return { kind: "paths", paths };
}

function erase(
  properties: Properties,
  paths: readonly path.Path[],
): string | undefined | { refuse: string } {
  // `delete`, never an assignment: a key holding `undefined` would be a
  // second way to be absent, and `in` would stop agreeing with a lookup.
  const out = path.remove(properties, paths);
  if (out.kind === "refused") return { refuse: out.message };
  if (out.gone.length === 0) return `${out.absent.join(", ")} was not set`;
  const said = `deleted ${out.gone.join(", ")}`;
  return out.absent.length === 0 ? said : `${said}; ${out.absent.join(", ")} was not set`;
}

/**
 * A place and a thing. `set title "x"` is a path of length one and a scalar;
 * `set config --stdin` is a path and an object; `set --stdin` is the root and an
 * object. The verb is the same and so is its meaning — write here, leave the
 * rest — which is why the third form is the root case rather than a form of its
 * own. `docs/batches/15-one-write.md`.
 */
export async function nodeSet(
  cwd: string,
  id: Uuid,
  where: string | undefined,
  value: Text | undefined,
  fromStdin: boolean,
  stdin: () => Promise<string>,
): Promise<Outcome> {
  const held = await asked(where, value, fromStdin, stdin);
  if (held.kind !== "held") return held.outcome;
  return await change(cwd, id, (properties) => write(properties, held.targets));
}

/** One way to remove a thing, at any depth, several at a time. */
export async function nodeDelete(
  cwd: string,
  id: Uuid,
  wheres: readonly string[],
): Promise<Outcome> {
  const paths = asPaths(wheres);
  if (paths.kind !== "paths") return paths.outcome;
  return await change(cwd, id, (properties) => erase(properties, paths.paths));
}

/**
 * `set` and `delete`, over a link's properties.
 *
 * A record **is** a document of properties — [batch 11](../../docs/batches/11-resolution.md)
 * settled that when it stopped being JSON — so the generalisation batch 15
 * gives a node's properties has to reach these too. Leaving `link <id> unset`
 * alive beside `node <id> delete` would be two names for one act, told apart
 * only by which scope you are in.
 */
export async function linkSet(
  cwd: string,
  id: Uuid,
  where: string | undefined,
  value: Text | undefined,
  fromStdin: boolean,
  stdin: () => Promise<string>,
): Promise<Outcome> {
  const held = await asked(where, value, fromStdin, stdin);
  if (held.kind !== "held") return held.outcome;
  return await linkChange(
    cwd,
    id,
    held.first ?? "",
    (properties) => write(properties as Properties, held.targets),
  );
}

export async function linkDelete(
  cwd: string,
  id: Uuid,
  wheres: readonly string[],
): Promise<Outcome> {
  const paths = asPaths(wheres);
  if (paths.kind !== "paths") return paths.outcome;
  return await linkChange(
    cwd,
    id,
    paths.paths[0]![0]!,
    (properties) => erase(properties as Properties, paths.paths),
  );
}

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

/** The reserved slot classification lives in. Grammatically a name like any
 * other — `labels` is reserved from *authoring*, not from the tool. */
const LABELS = "labels" as Name;

/** A label's shape is a subset of a value's, so a checked word is a checked
 * value; the brands differ because the things do. */
const asText = (word: Label): Text => word as unknown as Text;

/** Why a word could not be brought into a vocabulary. The slug is lossy on
 * purpose, so the collision it reports is the thing to explain: two words that
 * fold to one file, and which one is already there. */
function notStored(kind: Store, word: Label, made: vocabulary.Written): string {
  if (made.kind === "unwritable") {
    return `cannot create the ${kind} ${word}: ${made.reason}`;
  }
  if (made.kind === "taken" && made.by !== undefined) {
    return `cannot create the ${kind} ${word}: it folds to ${made.slug}.md, which holds ${made.by}`;
  }
  const slug = made.kind === "taken" ? made.slug : "";
  return `cannot create the ${kind} ${word}: it folds to ${slug}.md, which cannot be read`;
}

/** Carrying a word is what brings it into the vocabulary, so each one is
 * ensured before the node records it. Idempotent, and the count reported is
 * the effective one. */
export async function nodeLabel(cwd: string, id: Uuid, words: Label[]): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  for (const word of words) {
    const made = await vocabulary.ensure(resolved.space.labels, word);
    if (made.kind !== "written") return refused(notStored("label", word, made));
  }
  return await change(cwd, id, (properties) => {
    const existing = properties[LABELS];
    if (existing !== undefined && !frontmatter.isList(existing)) {
      return { refuse: `cannot label ${id}: labels is not a list` };
    }
    const carried = existing ?? [];
    const fresh = words.filter((word) => !carried.includes(asText(word)));
    if (fresh.length === 0) return undefined;
    properties[LABELS] = [...carried, ...fresh.map(asText)];
    return `labelled ${fresh.length}`;
  });
}

/** The word survives being dropped — the vocabulary records what has been said
 * here, not only what is said now. */
export async function nodeUnlabel(
  cwd: string,
  id: Uuid,
  words: Label[],
): Promise<Outcome> {
  return await change(cwd, id, (properties) => {
    const existing = properties[LABELS];
    if (existing === undefined) return undefined;
    if (!frontmatter.isList(existing)) {
      return { refuse: `cannot unlabel ${id}: labels is not a list` };
    }
    const kept = existing.filter((word) => !words.includes(word as unknown as Label));
    if (kept.length === existing.length) return undefined;
    const gone = existing.length - kept.length;
    if (kept.length === 0) delete properties[LABELS];
    else properties[LABELS] = kept;
    return `unlabelled ${gone}`;
  });
}

/**
 * Which vocabulary a command is about. The stores are identical in mechanism
 * and separate in namespace, so one set of commands takes the store rather than
 * two sets differing only in a path — and a word may be a label and a relation
 * type at once without either shadowing the other.
 */
export type Store = "label" | "type";

const storeOf = (space: Space, store: Store): string =>
  store === "label" ? space.labels : space.types;

export async function wordRead(cwd: string, store: Store, word: Label): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const found = await vocabulary.read(storeOf(resolved.space, store), word);
  switch (found.kind) {
    case "absent":
      return absent(`no such ${store}: ${word} in ${resolved.space.name}`);
    case "malformed":
      return refused(`cannot read ${store} ${word}: no frontmatter block`);
    case "read":
      return ok(found.description);
  }
}

export async function wordWrite(
  cwd: string,
  store: Store,
  word: Label,
  description: string,
): Promise<Outcome> {
  if (description === "") {
    return refused("no content on stdin — did the command before the pipe fail?");
  }
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const wrote = await vocabulary.write(storeOf(resolved.space, store), word, description);
  if (wrote.kind !== "written") return refused(notStored(store, word, wrote));
  return ok("", `wrote ${new TextEncoder().encode(description).length} bytes`);
}

export async function wordForget(
  cwd: string,
  store: Store,
  word: Label,
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const gone = await vocabulary.forget(storeOf(resolved.space, store), word);
  switch (gone.kind) {
    case "absent":
      return absent(`no such ${store}: ${word} in ${resolved.space.name}`);
    case "unwritable":
      return refused(`cannot forget ${word}: ${gone.reason}`);
    case "forgotten":
      return ok("", `forgot ${word}`);
  }
}

/**
 * Word, count, and the description's first line — the first line is the summary
 * by convention, and the tool takes it without reading it.
 *
 * Listing the words is a directory read. The **count** is what costs a parse per
 * node, and it is what an index would later remove.
 */
/**
 * Every word the space knows, one per line — a directory read of `labels/`,
 * which is what the name says.
 *
 * It carried a count and a description's first line until batch 11, and both
 * were wrong there. The count forced a parse of every node — 440 ms for two
 * lines of output on the movies graph — which is the rule
 * `docs/batches/9-find.md` wrote down being broken: *a flag would hide a
 * thousandfold cost behind an option*, and a column hides it just as well. The
 * summary was the only place unchecked prose reached a tabulated output, and a
 * tab in it made the row four columns.
 *
 * A description is served where it belongs: `kg label <word>` reads that one
 * file, for the word you named.
 */
export async function wordsList(
  cwd: string,
  store: Store,
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  return lines(await vocabulary.words(storeOf(resolved.space, store)));
}

/**
 * Every node with its entries resolved, in one pass over each store.
 *
 * `resolveLinks` reads a record **once per endpoint**, which is right when a
 * caller asked about one node and wasteful when the answer is the whole graph:
 * 253 records become 506 reads. Here the records are read once into a table and
 * every entry resolves from it, so a match costs one file per node and one per
 * record and nothing twice.
 */
async function snapshot(space: Space): Promise<Map<string, Properties>> {
  const records = new Map<string, link.Record_>();
  try {
    for await (const entry of Deno.readDir(space.links)) {
      if (!entry.isFile || !entry.name.endsWith(".yaml")) continue;
      const id = entry.name.slice(0, -5);
      if (!isId(id)) continue;
      const found = await link.read(space, id);
      if (found.kind === "read") records.set(id, found.record);
    }
  } catch {
    // No links directory is an empty one, not a failure.
  }

  const graph = new Map<string, Properties>();
  for (const id of await ids(space)) {
    if (!isId(id)) continue;
    const found = await read(space, id);
    if (found.kind !== "read") continue;
    const carried = found.properties[LINKS];
    const properties = frontmatter.isLinks(carried)
      ? {
        ...found.properties,
        [LINKS]: carried.map((entry) => {
          const record = records.get(entry.link);
          if (record === undefined) return entry as unknown as Value;
          const other = entry.direction === "out" ? record.to : record.from;
          return { ...entry, neighbour: other, ...record.properties } as unknown as Value;
        }) as Value,
      }
      : found.properties;
    graph.set(id, { ...properties, id } as unknown as Properties);
  }
  return graph;
}

/**
 * **The floor.** A word the space does not know returns nothing, and nothing is
 * indistinguishable from *there are none* — so a misspelling is refused with
 * its near neighbour named instead.
 *
 * The neighbour is the slug: `person` folds to `person.md`, which holds
 * `Person`. One file read, no distance metric, and a word whose fold names
 * nothing simply has no neighbour to offer.
 *
 * It works because [batch 12](../../docs/batches/12-vocabulary.md) gave a
 * relation type the same store a label has. Without it this would scan every
 * link record to learn the vocabulary, and only the label half would be free.
 */
async function unknownWord(
  space: Space,
  pattern_: pattern.Pattern,
): Promise<string | undefined> {
  const asked: { kind: "label" | "relation type"; dir: string; word: Label }[] = [];
  for (const part of pattern_) {
    for (const word of part.first.labels) {
      asked.push({ kind: "label", dir: space.labels, word });
    }
    for (const step of part.steps) {
      for (const word of step.via.types) {
        asked.push({ kind: "relation type", dir: space.types, word });
      }
      for (const word of step.to.labels) {
        asked.push({ kind: "label", dir: space.labels, word });
      }
    }
  }
  for (const { kind, dir, word } of asked) {
    const held = await vocabulary.holder(dir, word);
    if (held === word) continue;
    return held === undefined
      ? `no such ${kind}: ${word} in ${space.name}`
      : `no such ${kind}: ${word} — did you mean ${held}?`;
  }
  return undefined;
}

/**
 * A pattern selects a subgraph: every node that takes part in any solution,
 * resolved, as JSON. `docs/batches/14-match.md` is the argument — the anchor is
 * a join order rather than a cost, because building an adjacency list means
 * reading the store either way.
 */
export async function nodesMatch(cwd: string, source: string): Promise<Outcome> {
  const parsed = pattern.parse(source);
  if (parsed.kind === "refused") return refused(parsed.message);

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  const unknown = await unknownWord(resolved.space, parsed.pattern);
  if (unknown !== undefined) return absent(unknown);
  const graph = await snapshot(resolved.space);

  const found = matched(parsed.pattern, graph);
  // Creation order, which is `nodes list`'s: a v7 id sorts to the millisecond.
  const out = [...found].sort().map((id) => graph.get(id)!);
  return asJson(out);
}

/** The reserved slot relations live in. */
const LINKS = "links" as Name;

const entriesOf = (properties: Properties): Entry[] => {
  const held = properties[LINKS];
  return frontmatter.isLinks(held) ? [...held] : [];
};

/**
 * Three files: the record, then both endpoints. The record goes first because
 * it is authoritative — a torn write then leaves an orphan record, which is a
 * repairable index, rather than an endpoint pointing at nothing.
 */
export async function nodeLink(
  cwd: string,
  from: Uuid,
  type: Label,
  targets: Uuid[],
  properties: Record<string, Text>,
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  // Both ends must exist before anything is written: a link to a node that is
  // not here is a dangling edge, and `write` already refuses an unknown id.
  for (const id of [from, ...targets]) {
    const found = await read(space, id);
    if (found.kind === "absent") return absent(`no such node: ${id} in ${space.name}`);
    if (found.kind !== "read") return unreadable(id, found);
  }

  const known = await vocabulary.ensure(space.types, type);
  if (known.kind !== "written") return refused(notStored("type", type, known));

  const made: string[] = [];
  for (const to of targets) {
    const record = await link.create(space, type, from, to, properties);
    if (record.kind === "unwritable") {
      return refused(`cannot create a link: ${record.reason}`);
    }
    const out = await carry(space, from, { type, link: record.id, direction: "out" });
    if (out !== undefined) return out;
    const back = await carry(space, to, { type, link: record.id, direction: "in" });
    if (back !== undefined) return back;
    made.push(record.id);
  }
  return lines(made);
}

/** Add one entry to a node's `links`. */
async function carry(space: Space, id: Uuid, entry: Entry): Promise<Outcome | undefined> {
  const result = await amend(space, id, (properties) => {
    properties[LINKS] = [...entriesOf(properties), entry];
  });
  if (result.kind === "amended") return undefined;
  if (result.kind === "absent") return absent(`no such node: ${id} in ${space.name}`);
  if (result.kind === "unwritable") {
    return refused(`cannot write ${id}: ${result.reason}`);
  }
  return unreadable(
    id,
    result as { kind: "malformed" } | { kind: "unparseable"; reason: string },
  );
}

export async function linkRead(cwd: string, id: Uuid): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const found = await link.read(resolved.space, id);
  if (found.kind === "absent") {
    return absent(`no such link: ${id} in ${resolved.space.name}`);
  }
  if (found.kind === "unreadable") {
    return refused(`cannot read link ${id}: ${found.reason}`);
  }

  // A record is a document of properties, so it prints as one — the three
  // fields are keys among the rest, and being unwritable is a rule about
  // writing that the output shape has no reason to show.
  const r = found.record;
  const all = { ...r.properties, type: r.type, from: r.from, to: r.to } as Properties;
  return asJson(all);
}

/** Ending a link ends the record. A label outlives its last use because
 * vocabulary records what has been said; a link is the relationship itself. */
export async function linkForget(cwd: string, id: Uuid): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  const found = await link.read(space, id);
  if (found.kind === "absent") return absent(`no such link: ${id} in ${space.name}`);
  if (found.kind === "unreadable") {
    return refused(`cannot read link ${id}: ${found.reason}`);
  }

  for (const end of [found.record.from, found.record.to]) {
    const dropped = await amend(space, end, (properties) => {
      const kept = entriesOf(properties).filter((entry) => entry.link !== id);
      if (kept.length === 0) delete properties[LINKS];
      else properties[LINKS] = kept;
    });
    if (dropped.kind === "unwritable") {
      return refused(`cannot write ${end}: ${dropped.reason}`);
    }
  }
  const gone = await link.forget(space, id);
  if (gone.kind === "unwritable") return refused(`cannot forget ${id}: ${gone.reason}`);
  return ok("", `forgot ${id}`);
}

/** A link's properties obey a node's rules — on the properties, never on the
 * three fields, which are the link's own data. */
export async function linkChange(
  cwd: string,
  id: Uuid,
  name: string,
  edit: (properties: link.Properties) => string | undefined | { refuse: string },
): Promise<Outcome> {
  // A link's identity *is* its type and its two ends, so altering one would
  // make it a different link. They are fields, not properties.
  if ((link.FIELDS as readonly string[]).includes(name)) {
    return refused(`${name} is the link's own data, not a property`);
  }
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  const found = await link.read(space, id);
  if (found.kind === "absent") return absent(`no such link: ${id} in ${space.name}`);
  if (found.kind === "unreadable") {
    return refused(`cannot read link ${id}: ${found.reason}`);
  }

  const properties = { ...found.record.properties };
  const said = edit(properties);
  if (said !== undefined && typeof said === "object") return refused(said.refuse);

  const wrote = await link.write(space, id, { ...found.record, properties });
  if (wrote.kind === "unwritable") {
    return refused(`cannot write link ${id}: ${wrote.reason}`);
  }
  return said === undefined ? ok("") : ok("", said);
}
