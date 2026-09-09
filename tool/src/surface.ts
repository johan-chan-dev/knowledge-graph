import { z } from "@zod/zod";
import { isName, isValue, reservedReason } from "./frontmatter.ts";
import { isId } from "./node.ts";
import type { Outcome } from "./outcome.ts";
import {
  node,
  nodeAdd,
  nodeNew,
  nodeRemove,
  nodes,
  nodeSet,
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
const Uuid = z.string().refine(isId, {
  error: (issue) => `not an id: ${issue.input} — expected a uuid`,
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

export type Flag = "stdin" | "properties";

/** What a checked call hands its command. `stdin` is a thunk so a command that
 * does not read it cannot block on a pipe that never closes. */
export type Call = {
  readonly cwd: string;
  readonly id: string;
  readonly args: string[];
  readonly properties: boolean;
  readonly stdin: () => Promise<string>;
};

export type Command = {
  /** The form as `--help` prints it, and as a reader recognises it. */
  readonly form: string;
  readonly summary: string;
  readonly scope: "space" | "nodes" | "node";
  /** A second positional that is an id rather than a literal. */
  readonly id: boolean;
  /** The literal that names the action, if any. Absent means a bare read. */
  readonly action?: string;
  /** Arguments after the action. Absent means none are accepted. */
  readonly args?: z.ZodType<string[]>;
  /** Said when the count is wrong. Two messages because the two failures teach
   * different things: too few is the form, too many is usually shell quoting.
   * `many` is absent where the schema accepts any number. */
  readonly arity?: { readonly few: string; readonly many?: string };
  /** Flags this command accepts. Anywhere else the flag is refused. */
  readonly flags: readonly Flag[];
  /** `--stdin` is not optional here. */
  readonly needsStdin?: boolean;
  /** The same command under a flag. A separate help line because that is how a
   * reader looks it up, not a separate command. */
  readonly variant?: { readonly form: string; readonly summary: string };
  /** What it does. Held here so dispatch cannot reach a command the table does
   * not declare, nor declare one dispatch cannot reach. */
  readonly run: (call: Call) => Promise<Outcome>;
};

export const COMMANDS: readonly Command[] = [
  {
    form: "space",
    run: ({ cwd }) => space(cwd),
    summary: "what and where this space is",
    scope: "space",
    id: false,
    flags: [],
  },
  {
    form: "space init",
    run: ({ cwd }) => spaceInit(cwd),
    summary: "create one",
    scope: "space",
    id: false,
    action: "init",
    flags: [],
  },
  {
    form: "nodes list",
    run: ({ cwd }) => nodes(cwd),
    summary: "every id, in creation order",
    scope: "nodes",
    id: false,
    action: "list",
    flags: [],
  },
  {
    form: "node new",
    run: async ({ cwd, stdin }) => nodeNew(cwd, await stdin()),
    summary: "create an empty one",
    scope: "node",
    id: false,
    action: "new",
    flags: ["stdin"],
    variant: { form: "node new --stdin", summary: "…with content read from stdin" },
  },
  {
    form: "node <id>",
    run: ({ cwd, id, properties }) => node(cwd, id, properties),
    summary: "the content, properties on stderr",
    scope: "node",
    id: true,
    flags: ["properties"],
    variant: { form: "node <id> --properties", summary: "the properties instead" },
  },
  {
    form: "node <id> write --stdin",
    run: async ({ cwd, id, stdin }) => nodeWrite(cwd, id, await stdin()),
    summary: "stdin replaces the content",
    scope: "node",
    id: true,
    action: "write",
    flags: ["stdin"],
    needsStdin: true,
  },
  {
    form: "node <id> set <name> <value>",
    run: ({ cwd, id, args }) => nodeSet(cwd, id, args[0], args[1]),
    summary: "write one property",
    scope: "node",
    id: true,
    action: "set",
    args: z.tuple([Name, Value]),
    arity: {
      few: "node <id> set needs a name and a value",
      many: "node <id> set takes one value — quote it if it contains spaces",
    },
    flags: [],
  },
  {
    form: "node <id> unset <name>",
    run: ({ cwd, id, args }) => nodeSet(cwd, id, args[0], null),
    summary: "remove one",
    scope: "node",
    id: true,
    action: "unset",
    args: z.tuple([Name]),
    arity: {
      few: "node <id> unset needs a name",
      many: "node <id> unset takes one name",
    },
    flags: [],
  },
  {
    form: "node <id> add <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) => nodeAdd(cwd, id, name, values),
    summary: "values into a property's list",
    scope: "node",
    id: true,
    action: "add",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "node <id> add needs a name and at least one value" },
    flags: [],
  },
  {
    form: "node <id> remove <name> <value>...",
    run: ({ cwd, id, args: [name, ...values] }) => nodeRemove(cwd, id, name, values),
    summary: "values out of it",
    scope: "node",
    id: true,
    action: "remove",
    args: z.tuple([Name]).rest(Value),
    arity: { few: "node <id> remove needs a name and at least one value" },
    flags: [],
  },
];

const of = (scope: string) => COMMANDS.filter((command) => command.scope === scope);
const named = (commands: readonly Command[]) =>
  commands.flatMap((command) => command.action === undefined ? [] : [command.action]);

export const scopes =
  (): string[] => [...new Set(COMMANDS.map((command) => command.scope))];

/** Every line `--help` prints, derived so a new command cannot be missing from
 * it — which is the failure the old hand-kept table existed to have. */
export function help(): string {
  const forms = COMMANDS.flatMap((command) => [
    [command.form, command.summary],
    ...(command.variant ? [[command.variant.form, command.variant.summary]] : []),
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
  | { readonly kind: "ok"; readonly args: string[] }
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
  args: string[],
  given: Readonly<Record<Flag, boolean>>,
): Checked {
  for (const flag of ["stdin", "properties"] as const) {
    if (given[flag] && !command.flags.includes(flag)) {
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
    const parsed = Uuid.safeParse(id);
    if (!parsed.success) {
      return { kind: "refused", message: parsed.error.issues[0].message };
    }
  }

  if (command.args === undefined) {
    if (args.length > 0) {
      return { kind: "usage", message: `${command.form} takes no arguments` };
    }
    return { kind: "ok", args: [] };
  }

  const parsed = command.args.safeParse(args);
  if (parsed.success) return { kind: "ok", args: parsed.data };

  // A wrong count is a usage error and a wrong argument is a refusal: one means
  // the caller does not know the form, the other that it broke a rule.
  const issue = parsed.error.issues[0];
  const missing = issue.code === "too_small" ||
    (issue.code === "invalid_type" && args[Number(issue.path[0])] === undefined);
  if (missing || issue.code === "too_big") {
    const said = missing ? command.arity?.few : command.arity?.many;
    return { kind: "usage", message: said ?? `kg ${command.form}` };
  }
  return { kind: "refused", message: issue.message };
}
