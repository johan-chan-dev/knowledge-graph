import { absent, lines, ok, type Outcome, refused } from "./outcome.ts";
import { NO_GIT } from "./git.ts";
import { find, ids, init as initSpace, readout, type Space } from "./space.ts";
import * as frontmatter from "./frontmatter.ts";
import type { Label, Name, Properties, Text } from "./frontmatter.ts";
import * as label from "./label.ts";
import * as link from "./link.ts";
import type { Entry } from "./frontmatter.ts";
import { amend, create, isId, read, replace, type Uuid } from "./node.ts";
import { parse } from "./expression.ts";
import { matches } from "./evaluate.ts";

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
 * The expression is parsed before the space is resolved, so a malformed one
 * refuses with no filesystem touched at all. *Validation precedes lookup* is
 * then a property of this function rather than a claim about a transcript.
 */
export async function nodesFind(cwd: string, expression: string): Promise<Outcome> {
  const parsed = parse(expression);
  if (parsed.kind === "refused") return refused(parsed.message);

  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  // One id per line, as `nodes list` returns — the id is the one thing every
  // node has, which is why it is the only thing a set-shaped command can
  // return without inventing a slot. `docs/batches/9-find.md` has the argument.
  const matched: string[] = [];
  let damaged = 0;
  for (const id of await ids(space)) {
    if (!isId(id)) continue;
    const found = await read(space, id);
    if (found.kind !== "read") {
      damaged++;
      continue;
    }
    if (matches(parsed.expr, found.properties)) matched.push(id);
  }

  // A node that will not parse cannot be tested, and dropping it in silence
  // would shorten the answer without saying so. stdout stays the answer; the
  // count goes to stderr, which is where what the caller could not have worked
  // out belongs.
  return damaged === 0
    ? lines(matched)
    : lines(matched, `${damaged} node${damaged === 1 ? "" : "s"} could not be read`);
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
export async function nodeNew(
  cwd: string,
  content: string,
  words: Label[] = [],
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;

  for (const word of words) {
    const made = await label.ensure(resolved.space, word);
    if (made.kind === "unwritable") {
      return refused(`cannot create a label: ${made.reason}`);
    }
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

/** The reserved slot classification lives in. Grammatically a name like any
 * other — `labels` is reserved from *authoring*, not from the tool. */
const LABELS = "labels" as Name;

/** A label's shape is a subset of a value's, so a checked word is a checked
 * value; the brands differ because the things do. */
const asText = (word: Label): Text => word as unknown as Text;

/** Carrying a word is what brings it into the vocabulary, so each one is
 * ensured before the node records it. Idempotent, and the count reported is
 * the effective one. */
export async function nodeLabel(cwd: string, id: Uuid, words: Label[]): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  for (const word of words) {
    const made = await label.ensure(resolved.space, word);
    if (made.kind === "unwritable") {
      return refused(`cannot create a label: ${made.reason}`);
    }
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

export async function labelRead(cwd: string, word: Label): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const found = await label.read(resolved.space, word);
  switch (found.kind) {
    case "absent":
      return absent(`no such label: ${word} in ${resolved.space.name}`);
    case "malformed":
      return refused(`cannot read label ${word}: no frontmatter block`);
    case "read":
      return ok(found.description);
  }
}

export async function labelWrite(
  cwd: string,
  word: Label,
  description: string,
): Promise<Outcome> {
  if (description === "") {
    return refused("no content on stdin — did the command before the pipe fail?");
  }
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const wrote = await label.write(resolved.space, word, description);
  if (wrote.kind === "unwritable") {
    return refused(`cannot write label ${word}: ${wrote.reason}`);
  }
  return ok("", `wrote ${new TextEncoder().encode(description).length} bytes`);
}

export async function labelForget(cwd: string, word: Label): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const gone = await label.forget(resolved.space, word);
  switch (gone.kind) {
    case "absent":
      return absent(`no such label: ${word} in ${resolved.space.name}`);
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
/** The description's first line, as the third column of a tab-separated row.
 *
 * A description is prose and never passes `isValue`, so it is the one place
 * where an unchecked string reaches a tabulated output — a tab inside it made
 * the row four columns where the contract says three. Collapsing whitespace is
 * a rendering decision, local to this column: what anyone may write is not
 * narrowed for the sake of how it is displayed. */
// deno-lint-ignore no-control-regex -- collapsing control characters is the point
const CONTROL_RUN = /[\x00-\x1F\x7F]+/g;
const firstLine = (description: string): string =>
  (description.split("\n")[0] ?? "").replace(CONTROL_RUN, " ").trim();

export async function labelsList(cwd: string): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  const counts = new Map<string, number>();
  for (const id of await ids(space)) {
    if (!isId(id)) continue;
    const found = await read(space, id);
    if (found.kind !== "read") continue;
    const carried = found.properties[LABELS];
    if (!frontmatter.isList(carried)) continue;
    for (const word of carried) counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const rows: string[] = [];
  for (const word of await label.words(space)) {
    const found = await label.read(space, word);
    const summary = found.kind === "read" ? firstLine(found.description) : "";
    rows.push([word, String(counts.get(word) ?? 0), summary].join("\t").trimEnd());
  }
  return lines(rows);
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

/** Type, link id, the other end — tab-separated, as `labels list` is. */
export async function nodeLinks(
  cwd: string,
  id: Uuid,
  direction: "out" | "in",
): Promise<Outcome> {
  const resolved = await resolve(cwd);
  if (resolved.kind === "stop") return resolved.outcome;
  const space = resolved.space;

  const found = await read(space, id);
  if (found.kind === "absent") return absent(`no such node: ${id} in ${space.name}`);
  if (found.kind !== "read") return unreadable(id, found);

  const rows: string[] = [];
  for (const entry of entriesOf(found.properties)) {
    if (entry.direction !== direction) continue;
    const record = await link.read(space, entry.link);
    const other = record.kind === "read"
      ? (direction === "out" ? record.record.to : record.record.from)
      : "";
    rows.push([entry.type, entry.link, other].join("\t").trimEnd());
  }
  return lines(rows.sort());
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

  const r = found.record;
  const rows = [["type", r.type], ["from", r.from], ["to", r.to]];
  for (const name of (Object.keys(r.properties) as Name[]).sort()) {
    const value = r.properties[name];
    rows.push([name, Array.isArray(value) ? value.join(", ") : String(value)]);
  }
  return lines(rows.map((row) => row.join("\t")));
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
