import { z } from "@zod/zod";
import { isLabel, isName, isValue, reservedReason } from "./frontmatter.ts";
import type { Label } from "./frontmatter.ts";
import { isId } from "./node.ts";
import type { Outcome } from "./outcome.ts";
import {
  labelForget,
  labelRead,
  labelsList,
  labelWrite,
  node,
  nodeAdd,
  nodeLabel,
  nodeNew,
  nodeRemove,
  nodes,
  nodeSet,
  nodeUnlabel,
  nodeUnset,
  nodeWrite,
  space,
  spaceInit,
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
  error: (issue) => `not a label: ${issue.input} — expected a lowercase hyphenated token`,
});

const Name = z.string()
  .refine(isName, {
    error: (issue) =>
      `not a property name: ${issue.input} — expected a lowercase hyphenated token`,
  })
  .refine((name) => reservedReason(name) === undefined, {
    error: (issue) =>
      `${issue.input} is reserved — ${reservedReason(String(issue.input))}`,
  });

// The value is not echoed back: what makes it invalid is a control character,
// and printing one is how a refusal corrupts the terminal it is explaining to.
const Value = z.string().refine(isValue, {
  error: "not a property value: contains a control character — a value is a single line",
});

export type Flag = "stdin" | "properties" | "with-labels";

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
  readonly properties: boolean;
  readonly labels: Label[];
  readonly stdin: () => Promise<string>;
};

export type Command<A extends readonly unknown[] = readonly string[], I = string> = {
  /** The form as `--help` prints it, and as a reader recognises it. */
  readonly form: string;
  readonly summary: string;
  readonly scope: "space" | "nodes" | "node" | "label" | "labels";
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
  /** Flags this command accepts. Anywhere else the flag is refused. */
  readonly flags: readonly Flag[];
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
    flags: [],
  }),
  command({
    form: "space init",
    run: ({ cwd }) => spaceInit(cwd),
    summary: "create one",
    scope: "space",
    action: "init",
    flags: [],
  }),
  command({
    form: "nodes list",
    run: ({ cwd }) => nodes(cwd),
    summary: "every id, in creation order",
    scope: "nodes",
    action: "list",
    flags: [],
  }),
  command({
    form: "node new",
    run: async ({ cwd, stdin, labels }) => nodeNew(cwd, await stdin(), labels),
    summary: "create an empty one",
    scope: "node",
    action: "new",
    flags: ["stdin", "with-labels"],
    variants: [
      { form: "node new --stdin", summary: "…with content read from stdin" },
      { form: "node new --with-labels <word>...", summary: "…carrying those words" },
    ],
  }),
  command({
    form: "node <id>",
    run: ({ cwd, id, properties }) => node(cwd, id, properties),
    summary: "the content, properties on stderr",
    scope: "node",
    id: Id,
    flags: ["properties"],
    variants: [{ form: "node <id> --properties", summary: "the properties instead" }],
  }),
  command({
    form: "node <id> write --stdin",
    run: async ({ cwd, id, stdin }) => nodeWrite(cwd, id, await stdin()),
    summary: "stdin replaces the content",
    scope: "node",
    id: Id,
    action: "write",
    flags: ["stdin"],
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
    flags: [],
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
    flags: [],
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
    flags: [],
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
    flags: [],
  }),
  command({
    form: "node <id> label <word>...",
    summary: "carry these words",
    scope: "node",
    id: Id,
    action: "label",
    args: z.tuple([Word]).rest(Word),
    arity: { few: "node <id> label needs at least one word" },
    flags: [],
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
    flags: [],
    run: ({ cwd, id, args }) => nodeUnlabel(cwd, id, args as Label[]),
  }),
  command({
    form: "labels list",
    summary: "every word, its count, its first line",
    scope: "labels",
    action: "list",
    flags: [],
    run: ({ cwd }) => labelsList(cwd),
  }),
  command({
    form: "label <word>",
    summary: "what the word means here",
    scope: "label",
    id: Word,
    flags: [],
    run: ({ cwd, id }) => labelRead(cwd, id),
  }),
  command({
    form: "label <word> write --stdin",
    summary: "stdin becomes the description",
    scope: "label",
    id: Word,
    action: "write",
    flags: ["stdin"],
    needsStdin: true,
    run: async ({ cwd, id, stdin }) => labelWrite(cwd, id, await stdin()),
  }),
  command({
    form: "label <word> forget",
    summary: "drop it from the vocabulary",
    scope: "label",
    id: Word,
    action: "forget",
    flags: [],
    run: ({ cwd, id }) => labelForget(cwd, id),
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
 * Flag placement, then the id, then the arguments — all read off the entry.
 *
 * A flag accepted where it means nothing returned a plausible answer, which is
 * worse than refusing. Placement is checked here rather than at the flag's
 * declaration, because a flag is global to the parser and local to a command.
 */
export function check(
  command: Command,
  id: string | undefined,
  args: readonly string[],
  given: {
    readonly stdin: boolean;
    readonly properties: boolean;
    readonly "with-labels": readonly string[];
  },
): Checked {
  let checkedId: string | undefined;
  for (const flag of ["stdin", "properties", "with-labels"] as const) {
    const used = flag === "with-labels" ? given[flag].length > 0 : given[flag];
    if (used && !command.flags.includes(flag)) {
      const where = COMMANDS.filter((other) => other.flags.includes(flag))
        .map((other) => `\`kg ${other.form.replace(` --${flag}`, "")}\``);
      return { kind: "usage", message: `--${flag} belongs to ${where.join(" and ")}` };
    }
  }
  if (command.needsStdin === true && !given.stdin) {
    return {
      kind: "usage",
      message: `${
        command.form.replace(" --stdin", "")
      } needs --stdin — that is where the content comes from`,
    };
  }

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

  const wanted = command.flags.includes("with-labels");
  const words = wanted ? [...given["with-labels"], ...args] : [];
  const labels: Label[] = [];
  if (wanted) {
    if (given["with-labels"].length > 0 && words.length === 0) {
      return { kind: "usage", message: "--with-labels needs at least one word" };
    }
    for (const word of words) {
      const parsed = Word.safeParse(word);
      if (!parsed.success) {
        return {
          kind: "refused",
          message: parsed.error.issues[0]?.message ?? `not a label: ${word}`,
        };
      }
      labels.push(parsed.data as Label);
    }
    return { kind: "ok", id: checkedId, args: [], labels };
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
  // A failed parse always carries an issue, but the type does not say so, and
  // inventing a dead branch to prove it is worse than defaulting the message.
  const issue = parsed.error.issues[0];
  const missing = issue?.code === "too_small" ||
    (issue?.code === "invalid_type" && args[Number(issue.path[0])] === undefined);
  if (missing || issue?.code === "too_big") {
    const said = missing ? command.arity?.few : command.arity?.many;
    return { kind: "usage", message: said ?? `kg ${command.form}` };
  }
  return { kind: "refused", message: issue?.message ?? `kg ${command.form}` };
}
