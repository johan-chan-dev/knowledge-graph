import { z } from "@zod/zod";
import { isLabel, isName, isValue, notAValue, reservedReason } from "./frontmatter.ts";
import type { Label, Text, Uuid } from "./frontmatter.ts";
import { isId } from "./node.ts";
import type { Flags } from "./argv.ts";
import type { Outcome } from "./outcome.ts";
import {
  linkChange,
  linkForget,
  linkRead,
  node,
  nodeAdd,
  nodeLabel,
  nodeLink,
  nodeNew,
  nodeRemove,
  nodes,
  nodeSet,
  nodesFind,
  nodesProperties,
  nodeUnlabel,
  nodeUnset,
  nodeWrite,
  space,
  spaceInit,
  wordForget,
  wordRead,
  wordsList,
  wordWrite,
} from "./commands.ts";

/**
 * What each command takes, declared once.
 *
 * The shape used to live in three places — a table drove help, a chain of
 * branches drove dispatch, and arity was conditionals inside those branches.
 * Every argument defect the tool has had was a disagreement between them: a
 * flag accepted where it meant nothing, an unknown action reported as an
 * argumentless property, several values silently joined. One declaration
 * removes those structurally rather than by being careful again.
 */

/** Argument shapes. The messages are the spec's, not the library's — a schema
 * says *which* argument failed, and these say why in the tool's own words. */
const Id = z.string().refine(isId, {
  error: (issue) => `not an id: ${issue.input} — expected a uuid`,
});

const Word = z.string().refine(isLabel, {
  error: (issue) =>
    `not a label: ${issue.input} — a letter or underscore, then letters, digits and underscores — never a hyphen, which a pattern would have to quote`,
});

const Name = z.string()
  .refine(isName, {
    error: (issue) =>
      `not a property name: ${issue.input} — a letter or underscore, then letters, digits and underscores — never a hyphen, which a pattern would have to quote`,
  })
  .refine((name) => reservedReason(name) === undefined, {
    error: (issue) =>
      `${issue.input} is reserved — ${reservedReason(String(issue.input))}`,
  });

// The value is not echoed back: what makes it invalid is a character that does
// not print, and emitting one is how a refusal corrupts the terminal it is
// explaining to. The cause is named instead.
const Value = z.string().refine(isValue, {
  error: (issue) =>
    `not a property value: ${
      notAValue(String(issue.input)) ?? "not printable text"
    } — a value is a single line`,
});

/** What a checked call hands its command. `stdin` is a thunk so a command that
 * does not read it cannot block on a pipe that never closes.
 *
 * `args` is the command's own tuple — `set` receives `[Name, Text]`, not two
 * strings — so a handler cannot index past the arity the table declared, and
 * cannot be handed a value that never passed a guard. */
export type Call<A extends readonly unknown[] = readonly string[], I = string> = {
  readonly cwd: string;
  readonly id: I;
  readonly args: A;
  /** What this command's own flags produced. */
  readonly flags: Readonly<Record<string, true | string | string[]>>;
  readonly labels: Label[];
  readonly stdin: () => Promise<string>;
};

export type Command<A extends readonly unknown[] = readonly string[], I = string> = {
  /** The form as `--help` prints it, and as a reader recognises it. */
  readonly form: string;
  readonly summary: string;
  readonly scope:
    | "space"
    | "nodes"
    | "node"
    | "label"
    | "labels"
    | "type"
    | "types"
    | "link";
  /** A second positional that identifies rather than naming an action — a uuid
   * for a node, a word for a label. Absent means the scope takes none. */
  readonly id?: z.ZodType<I>;
  /** The literal that names the action, if any. Absent means a bare read. */
  readonly action?: string;
  /** Arguments after the action. Absent means none are accepted. */
  readonly args?: z.ZodType<A>;
  /** Said when the count is wrong. Two messages because the two failures teach
   * different things: too few is the form, too many is usually shell quoting.
   * `many` is absent where the schema accepts any number. */
  readonly arity?: { readonly few: string; readonly many?: string };
  /** This command's flags, with their shapes. A flag is parseable here and
   * nowhere else — there is no global list. */
  readonly flags: Flags;
  /** `--stdin` is not optional here. */
  readonly needsStdin?: boolean;
  /** The same command under a flag. Separate help lines because that is how a
   * reader looks them up, not separate commands. */
  readonly variants?: readonly { readonly form: string; readonly summary: string }[];
  /** What it does. Held here so dispatch cannot reach a command the table does
   * not declare, nor declare one dispatch cannot reach. */
  readonly run: (call: Call<A, I>) => Promise<Outcome>;
};

/**
 * The one place a command's declared arity and its handler are matched.
 *
 * `A` is inferred from the entry's own schema, so `run` is checked against it
 * — `set` cannot be given a handler that reads a third argument. The table then
 * erases to a common type, because help, matching and the structural tests all
 * iterate it. That erasure is the single unsound step in this file, and it is
 * sound in fact: `check` parses against the same schema before `run` is
 * reached, so the tuple it validated is the tuple the handler receives.
 */
const command = <A extends readonly unknown[], I>(entry: Command<A, I>): Command =>
  entry as unknown as Command;

export const COMMANDS: readonly Command[] = [
  command({
    form: "space",
    run: ({ cwd }) => space(cwd),
    summary: "what and where this space is",
    scope: "space",
    flags: {},
  }),
  command({
    form: "space init",
    run: ({ cwd }) => spaceInit(cwd),
    summary: "create one",
    scope: "space",
    action: "init",
    flags: {},
  }),
  command({
    form: "nodes list",
    run: ({ cwd, flags }) => nodes(cwd, flags.json === true),
    summary: "every id, in creation order",
    scope: "nodes",
    action: "list",
    flags: { json: { kind: "boolean" } },
  }),
  command({
    form: "nodes --properties <id>...",
    run: ({ cwd, args, flags, stdin }) =>
      nodesProperties(
        cwd,
        args as Uuid[],
        flags.stdin === true,
        stdin,
        flags.json === true,
      ),
    summary: "the properties of each, as an array",
    scope: "nodes",
    args: z.array(Id),
    flags: {
      properties: { kind: "boolean", required: true },
      stdin: { kind: "boolean" },
      json: { kind: "boolean" },
    },
    variants: [{
      form: "nodes --stdin --properties",
      summary: "…with the ids read from stdin",
    }],
  }),
  command({
    form: "nodes find <expression>",
    run: ({ cwd, args, flags }) => nodesFind(cwd, args[0], flags.json === true),
    summary: "the ids of nodes matching a condition",
    scope: "nodes",
    action: "find",
    args: z.tuple([z.string()]),
    arity: {
      few: "nodes find needs an expression — quote it",
      many: "nodes find takes one expression — quote the whole of it",
    },
    flags: { json: { kind: "boolean" } },
  }),
  command({
    form: "node new",
    run: async ({ cwd, stdin, labels }) => nodeNew(cwd, await stdin(), labels),
    summary: "create an empty one",
    scope: "node",
    action: "new",
    flags: {
      stdin: { kind: "boolean" },
      "with-labels": { kind: "variadic" },
    },
    variants: [
      { form: "node new --stdin", summary: "…with content read from stdin" },
      { form: "node new --with-labels <word>...", summary: "…carrying those words" },
    ],
  }),
  command({
    form: "node <id>",
    run: ({ cwd, id, flags }) =>
      node(cwd, id, flags.properties === true, flags.json === true),
    summary: "the content, properties on stderr",
    scope: "node",
    id: Id,
    flags: { properties: { kind: "boolean" }, json: { kind: "boolean" } },
    variants: [
      { form: "node <id> --properties", summary: "the properties instead" },
      { form: "node <id> --properties --json", summary: "…as one object" },
    ],
  }),
  command({
    form: "node <id> write --stdin",
    run: async ({ cwd, id, stdin }) => nodeWrite(cwd, id, await stdin()),
    summary: "stdin replaces the content",
    scope: "node",
    id: Id,
    action: "write",
    flags: { stdin: { kind: "boolean" } },
    needsStdin: true,
  }),
  command({
    form: "node <id> set <name> <value>",
    run: ({ cwd, id, args }) => nodeSet(cwd, id, args[0], args[1]),
    summary: "write one property",
    scope: "node",
    id: Id,
    action: "set",
    args: z.tuple([Name, Value]),
    arity: {
      few: "node <id> set needs a name and a value",
      many: "node <id> set takes one value — quote it if it contains spaces",
    },
    flags: {},
  }),
  command({
    form: "node <id> unset <name>",
    run: ({ cwd, id, args }) => nodeUnset(cwd, id, args[0]),
    summary: "remove one",
    scope: "node",
    id: Id,
    action: "unset",
    args: z.tuple([Name]),
    arity: {
      few: "node <id> unset needs a name",
      many: "node <id> unset takes one name",
    },
    flags: {},
  }),
  command({
    form: "node <id> add <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) => nodeAdd(cwd, id, name, values),
    summary: "values into a property's list",
    scope: "node",
    id: Id,
    action: "add",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "node <id> add needs a name and at least one value" },
    flags: {},
  }),
  command({
    form: "node <id> remove <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) => nodeRemove(cwd, id, name, values),
    summary: "values out of it",
    scope: "node",
    id: Id,
    action: "remove",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "node <id> remove needs a name and at least one value" },
    flags: {},
  }),
  command({
    form: "node <id> label <word>...",
    summary: "carry these words",
    scope: "node",
    id: Id,
    action: "label",
    args: z.tuple([Word]).rest(Word),
    arity: { few: "node <id> label needs at least one word" },
    flags: {},
    run: ({ cwd, id, args }) => nodeLabel(cwd, id, args as Label[]),
  }),
  command({
    form: "node <id> unlabel <word>...",
    summary: "stop carrying them",
    scope: "node",
    id: Id,
    action: "unlabel",
    args: z.tuple([Word]).rest(Word),
    arity: { few: "node <id> unlabel needs at least one word" },
    flags: {},
    run: ({ cwd, id, args }) => nodeUnlabel(cwd, id, args as Label[]),
  }),
  command({
    form: "labels list",
    summary: "every word the space knows",
    scope: "labels",
    action: "list",
    flags: { json: { kind: "boolean" } },
    run: ({ cwd, flags }) => wordsList(cwd, "label", flags.json === true),
  }),
  command({
    form: "types list",
    summary: "every relation type the space knows",
    scope: "types",
    action: "list",
    flags: { json: { kind: "boolean" } },
    run: ({ cwd, flags }) => wordsList(cwd, "type", flags.json === true),
  }),
  command({
    form: "label <word>",
    summary: "what the word means here",
    scope: "label",
    id: Word,
    flags: {},
    run: ({ cwd, id }) => wordRead(cwd, "label", id),
  }),
  command({
    form: "type <word>",
    summary: "what the relation type means here",
    scope: "type",
    id: Word,
    flags: {},
    run: ({ cwd, id }) => wordRead(cwd, "type", id),
  }),
  command({
    form: "label <word> write --stdin",
    summary: "stdin becomes the description",
    scope: "label",
    id: Word,
    action: "write",
    flags: { stdin: { kind: "boolean" } },
    needsStdin: true,
    run: async ({ cwd, id, stdin }) => wordWrite(cwd, "label", id, await stdin()),
  }),
  command({
    form: "type <word> write --stdin",
    summary: "stdin becomes the description",
    scope: "type",
    id: Word,
    action: "write",
    flags: { stdin: { kind: "boolean" } },
    needsStdin: true,
    run: async ({ cwd, id, stdin }) => wordWrite(cwd, "type", id, await stdin()),
  }),
  command({
    form: "node <id> link --as <type> --with-nodes <id>...",
    run: ({ cwd, id, flags }) =>
      nodeLink(
        cwd,
        id,
        flags.as as Label,
        (flags["with-nodes"] as string[]).map((t) => t as Uuid),
        Object.fromEntries(
          ((flags["with-properties"] as string[]) ?? []).map((pair) => {
            const at = pair.indexOf("=");
            return [pair.slice(0, at), pair.slice(at + 1) as Text];
          }),
        ),
      ),
    summary: "relate it to those nodes",
    scope: "node",
    id: Id,
    action: "link",
    flags: {
      as: { kind: "value", required: true },
      "with-nodes": { kind: "variadic", required: true },
      "with-properties": { kind: "variadic" },
    },
  }),
  command({
    form: "link <id>",
    run: ({ cwd, id, flags }) => linkRead(cwd, id, flags.json === true),
    summary: "its fields and properties",
    scope: "link",
    id: Id,
    flags: { json: { kind: "boolean" } },
  }),
  command({
    form: "link <id> forget",
    run: ({ cwd, id }) => linkForget(cwd, id),
    summary: "end the relation",
    scope: "link",
    id: Id,
    action: "forget",
    flags: {},
  }),
  command({
    form: "link <id> set <name> <value>",
    run: ({ cwd, id, args }) =>
      linkChange(cwd, id, args[0], (properties) => {
        const had = args[0] in properties;
        properties[args[0]] = args[1] as Text;
        return had ? `replaced ${args[0]}` : `set ${args[0]}`;
      }),
    summary: "write one property",
    scope: "link",
    id: Id,
    action: "set",
    args: z.tuple([Name, Value]),
    arity: {
      few: "link <id> set needs a name and a value",
      many: "link <id> set takes one value — quote it if it contains spaces",
    },
    flags: {},
  }),
  command({
    form: "link <id> unset <name>",
    run: ({ cwd, id, args }) =>
      linkChange(cwd, id, args[0], (properties) => {
        const had = args[0] in properties;
        delete properties[args[0]];
        return had ? `unset ${args[0]}` : `${args[0]} was not set`;
      }),
    summary: "remove one",
    scope: "link",
    id: Id,
    action: "unset",
    args: z.tuple([Name]),
    arity: {
      few: "link <id> unset needs a name",
      many: "link <id> unset takes one name",
    },
    flags: {},
  }),
  command({
    form: "link <id> add <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) =>
      linkChange(cwd, id, name, (properties) => {
        const held = properties[name];
        if (held !== undefined && !Array.isArray(held)) {
          return { refuse: `cannot add to ${name}: not a list` };
        }
        const list = (held ?? []) as string[];
        const fresh = values.filter((value) => !list.includes(value));
        if (fresh.length === 0) return undefined;
        properties[name] = [...list, ...fresh] as Text[];
        return `added ${fresh.length} to ${name}`;
      }),
    summary: "values into a property's list",
    scope: "link",
    id: Id,
    action: "add",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "link <id> add needs a name and at least one value" },
    flags: {},
  }),
  command({
    form: "link <id> remove <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) =>
      linkChange(cwd, id, name, (properties) => {
        const held = properties[name];
        if (held === undefined) return undefined;
        if (!Array.isArray(held)) {
          return { refuse: `cannot remove from ${name}: not a list` };
        }
        const kept = (held as string[]).filter((value) =>
          !values.includes(value as Text)
        );
        if (kept.length === held.length) return undefined;
        const gone = held.length - kept.length;
        if (kept.length === 0) delete properties[name];
        else properties[name] = kept as Text[];
        return kept.length === 0
          ? `removed ${gone} from ${name}, ${name} is now unset`
          : `removed ${gone} from ${name}`;
      }),
    summary: "values out of it",
    scope: "link",
    id: Id,
    action: "remove",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "link <id> remove needs a name and at least one value" },
    flags: {},
  }),
  command({
    form: "label <word> forget",
    summary: "drop it from the vocabulary",
    scope: "label",
    id: Word,
    action: "forget",
    flags: {},
    run: ({ cwd, id }) => wordForget(cwd, "label", id),
  }),
  command({
    form: "type <word> forget",
    summary: "drop it from the vocabulary",
    scope: "type",
    id: Word,
    action: "forget",
    flags: {},
    run: ({ cwd, id }) => wordForget(cwd, "type", id),
  }),
];

const of = (scope: string) => COMMANDS.filter((command) => command.scope === scope);
const named = (commands: readonly Command[]) =>
  commands.flatMap((command) => command.action === undefined ? [] : [command.action]);

export const scopes =
  (): string[] => [...new Set(COMMANDS.map((command) => command.scope))];

/** Every line `--help` prints, derived so a new command cannot be missing from
 * it — which is the failure the old hand-kept table existed to have. */
export function help(): string {
  const forms: [string, string][] = COMMANDS.flatMap((command) => [
    [command.form, command.summary],
    ...(command.variants ?? []).map((v) => [v.form, v.summary] as [string, string]),
  ]);
  const width = Math.max(...forms.map(([form]) => form.length));
  return [
    "kg — knowledge graph files",
    "",
    "Commands:",
    ...forms.map(([form, summary]) => `  kg ${form.padEnd(width)}   ${summary}`),
    "",
    "Reading a single resource is implicit. Everything else names its action.",
    "",
    "Global:",
    "  -C <dir>        run as if from there",
    "  --help",
  ].join("\n");
}

export type Matched =
  | {
    readonly kind: "matched";
    readonly command: Command;
    readonly id?: string;
    readonly args: string[];
  }
  | { readonly kind: "usage"; readonly message: string };

/**
 * Which command a set of positionals names.
 *
 * `node` is the one scope with two shapes, because you cannot address what does
 * not exist yet — so `new` stands where an id otherwise would. That is read off
 * `id` rather than special-cased: a literal wins, and anything else in a scope
 * that takes ids is an id.
 */
export function match(positionals: string[]): Matched {
  const [scope, second, ...rest] = positionals;
  if (scope === undefined) return { kind: "usage", message: "" };
  if (!scopes().includes(scope)) {
    return { kind: "usage", message: `unknown scope: ${scope}` };
  }

  const here = of(scope);
  const literals = here.filter((command) => !command.id);
  const identified = here.filter((command) => command.id);

  if (second === undefined) {
    const bare = literals.find((command) => command.action === undefined);
    if (bare !== undefined) return { kind: "matched", command: bare, args: [] };
    return {
      kind: "usage",
      message: identified.length > 0
        ? `${scope} needs an id, or ${named(literals).join(", ")}`
        : `${scope} takes one action: ${named(literals).join(", ")}`,
    };
  }

  const literal = literals.find((command) => command.action === second);
  if (literal !== undefined) return { kind: "matched", command: literal, args: rest };
  if (identified.length === 0) {
    // A scope whose bare command takes arguments — `nodes <id>...` — reads them
    // the way `node <id>` reads an id: not an action, so it is an argument, and
    // its own schema says whether it is a legal one.
    const bare = literals.find((command) => command.action === undefined);
    if (bare?.args !== undefined) {
      return { kind: "matched", command: bare, args: [second, ...rest] };
    }
    return {
      kind: "usage",
      message: `${scope} takes one action: ${named(literals).join(", ")}`,
    };
  }

  // The second positional is an id, so the third names the action.
  const [action, ...args] = rest;
  const found = identified.find((command) => command.action === action);
  if (found === undefined) {
    return {
      kind: "usage",
      message: `${scope} <id> takes one action: ${named(identified).join(", ")}`,
    };
  }
  return { kind: "matched", command: found, id: second, args };
}

/** What a flag's values must be, checked at the door beside everything else. */
const Pair = z.string().refine(
  (p) => {
    const at = p.indexOf("=");
    return at > 0 && isName(p.slice(0, at)) && isValue(p.slice(at + 1));
  },
  { error: (issue) => `not a property: ${issue.input} — expected name=value` },
);

const FLAG_VALUES: Readonly<Record<string, z.ZodType<string>>> = {
  "with-labels": Word,
  as: Word,
  "with-nodes": Id,
  "with-properties": Pair,
};

export type Checked =
  | {
    readonly kind: "ok";
    readonly id?: string;
    readonly args: readonly string[];
    readonly labels: Label[];
  }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "usage"; readonly message: string };

/**
 * The id, the flag values, then the arguments — all read off the entry.
 *
 * There is no placement check any more. A flag belongs to a command, so one
 * that does not belong was never parseable; `argv.ts` reports it unknown and
 * `declares` says where it would have been legal.
 */
export function check(
  command: Command,
  id: string | undefined,
  args: readonly string[],
  flags: Readonly<Record<string, true | string | string[]>>,
): Checked {
  // A flag the command cannot do without. Declared beside the flag rather than
  // discovered by a handler, which is how `--as` once reached the serialiser as
  // `undefined` and threw a stack trace out of the tool.
  for (const [name, shape] of Object.entries(command.flags)) {
    if (shape.required === true && flags[name] === undefined) {
      // A command with no action is the scope's bare read, so a caller who
      // reached it without its flag most likely meant one of the actions —
      // naming only the flag would answer a question they did not ask.
      const siblings = command.action === undefined
        ? of(command.scope).filter((each) => each.action !== undefined)
        : [];
      return {
        kind: "usage",
        message: siblings.length === 0
          ? `${command.action ?? command.scope} needs --${name}`
          : `${command.scope} takes one action: ${
            named(siblings).join(", ")
          } — or --${name}, with ${command.args === undefined ? "" : "ids or "}--stdin`,
      };
    }
  }

  if (command.needsStdin === true && flags.stdin !== true) {
    return {
      kind: "usage",
      message: `${
        command.form.replace(" --stdin", "")
      } needs --stdin — that is where the content comes from`,
    };
  }

  let checkedId: string | undefined;
  if (id !== undefined) {
    if (command.id === undefined) {
      return { kind: "usage", message: `${command.scope} takes no identifier` };
    }
    const parsed = command.id.safeParse(id);
    if (!parsed.success) {
      return {
        kind: "refused",
        message: parsed.error.issues[0]?.message ?? `not an id: ${id}`,
      };
    }
    checkedId = parsed.data;
  }

  // A flag's values are checked here for the same reason an argument's are: the
  // door is where a string becomes a checked thing. The writing door must refuse
  // what the reading door would — otherwise a link record is written that its
  // own reader will not load.
  const labels: Label[] = [];
  for (const [name, value] of Object.entries(flags)) {
    if (value === true) continue;
    const schema = FLAG_VALUES[name];
    if (schema === undefined) continue;
    for (const each of Array.isArray(value) ? value : [value]) {
      const parsed = schema.safeParse(each);
      if (!parsed.success) {
        return {
          kind: "refused",
          message: parsed.error.issues[0]?.message ?? `not valid: ${each}`,
        };
      }
      if (name === "with-labels") labels.push(parsed.data as Label);
    }
  }

  if (command.args === undefined) {
    if (args.length > 0) {
      return { kind: "usage", message: `${command.form} takes no arguments` };
    }
    return { kind: "ok", id: checkedId, args: [], labels };
  }

  const parsed = command.args.safeParse(args);
  if (parsed.success) return { kind: "ok", id: checkedId, args: parsed.data, labels };

  // A wrong count is a usage error and a wrong argument is a refusal: one means
  // the caller does not know the form, the other that it broke a rule.
  const issue = parsed.error.issues[0];
  const missing = issue?.code === "too_small" ||
    (issue?.code === "invalid_type" && args[Number(issue.path[0])] === undefined);
  if (missing || issue?.code === "too_big") {
    const said = missing ? command.arity?.few : command.arity?.many;
    return { kind: "usage", message: said ?? `kg ${command.form}` };
  }
  return { kind: "refused", message: issue?.message ?? `kg ${command.form}` };
}

/** Which commands declare a flag — so an unknown one is still answered with
 * where it does belong, not only that it does not belong here. */
export function declares(flag: string): string[] {
  return COMMANDS.filter((command) => flag in command.flags)
    .map((command) => `\`kg ${command.form.replace(` --${flag}`, "")}\``);
}
