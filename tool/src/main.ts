import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, usage } from "./outcome.ts";
import {
  node,
  nodeNew,
  nodes,
  nodeSet,
  nodeWrite,
  space,
  spaceInit,
  type Stdin,
} from "./commands.ts";

/** One table. Dispatch reads it, and so does help — so the two cannot drift.
 *
 * A scope names what the operation can touch and never overstates it, which is
 * why enumerating is `nodes list` and not `node list`. An id narrows the scope
 * rather than arguing a verb, so it sits beside the noun it identifies. */
const FORMS = [
  ["space show", "what and where this space is"],
  ["space init", "create one"],
  ["nodes list", "every id, in creation order"],
  ["nodes list --where <name>[=<value>]", "…that carry it"],
  ["nodes list --without <name>", "…that do not"],
  ["node new", "create one — stdin is its content"],
  ["node <id> read", "the content"],
  ["node <id> read --properties", "the properties instead"],
  ["node <id> write", "stdin replaces the content"],
  ["node <id> set <name> <value>", "write one property"],
  ["node <id> unset <name>", "remove one"],
] as const;

function help(): string {
  const width = Math.max(...FORMS.map(([form]) => form.length));
  return [
    "kg — knowledge graph files",
    "",
    "Commands:",
    ...FORMS.map(([form, summary]) => `  kg ${form.padEnd(width)}   ${summary}`),
    "",
    "Every command names its scope, then what it does to it.",
    "",
    "Global:",
    "  -C <dir>        run as if from there",
    "  --allow-empty   let a write store nothing",
    "  --properties    read a node's properties instead of its content",
    "  --help",
  ].join("\n");
}

async function stdin(): Promise<Stdin> {
  if (Deno.stdin.isTerminal()) return { kind: "terminal" };
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const size = chunks.reduce((n, c) => n + c.length, 0);
  const joined = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    joined.set(chunk, at);
    at += chunk.length;
  }
  return { kind: "piped", text: new TextDecoder().decode(joined) };
}

export async function run(argv: string[]): Promise<Outcome> {
  let unknownFlag: string | null = null;
  const flags = parseArgs(argv, {
    boolean: ["help", "allow-empty", "properties"],
    string: ["C", "where", "without"],
    collect: ["where", "without"],
    unknown: (arg) => {
      if (arg.startsWith("-")) unknownFlag = arg;
      return true;
    },
  });
  if (unknownFlag !== null) return usage(`unknown flag: ${unknownFlag}\n\n${help()}`);
  // Asking for help is not a usage error: it answers on stdout and succeeds,
  // so `kg --help | less` works. Help shown *because* a call was wrong is the
  // other thing, and goes to stderr with the rest of the refusal.
  if (flags.help) return lines([help()]);

  // `-C` is git's: run this as if from there, resolved before anything else.
  const cwd = flags.C ?? Deno.cwd();

  /** `collect` yields undefined for a flag that was never passed, one value for
   * a flag passed once, and an array beyond that. */
  const many = (value: unknown): string[] =>
    value === undefined ? [] : Array.isArray(value) ? value.map(String) : [String(value)];

  /** `--where name` is merely present; `--where name=value` is equal to it. */
  const split = (clause: string) => {
    const at = clause.indexOf("=");
    return at === -1
      ? { name: clause, value: null }
      : { name: clause.slice(0, at), value: clause.slice(at + 1) };
  };
  const [scope, ...rest] = flags._.map(String);
  if (scope === undefined) return usage(help());

  switch (scope) {
    case "space": {
      const [action, ...extra] = rest;
      if (extra.length > 0) return usage(`space ${action} takes no arguments`);
      if (action === "show") return await space(cwd);
      if (action === "init") return await spaceInit(cwd);
      return usage(`space needs an action: show, init\n\n${help()}`);
    }

    case "nodes": {
      const [action, ...extra] = rest;
      if (action !== "list" || extra.length > 0) {
        return usage(`nodes takes one action: list\n\n${help()}`);
      }
      return await nodes(cwd, {
        where: many(flags.where).map(split),
        without: many(flags.without),
      });
    }

    // `node` is the one scope with two shapes: you cannot address what does not
    // exist yet, so `new` stands where an id otherwise would.
    case "node": {
      const [first, ...rest2] = rest;
      if (first === undefined) return usage(`node needs an id, or new\n\n${help()}`);
      if (first === "new") {
        if (rest2.length > 0) return usage("node new takes no arguments");
        return await nodeNew(cwd, await stdin(), flags["allow-empty"]);
      }
      const [action, ...extra] = rest2;
      if (extra.length > 0 && action !== "set" && action !== "unset") {
        return usage(`node <id> ${action} takes no arguments`);
      }
      if (action === "read") return await node(cwd, first, flags.properties);
      if (action === "write") {
        return await nodeWrite(cwd, first, await stdin(), flags["allow-empty"]);
      }
      if (action === "set") {
        const [name, ...value] = extra;
        if (name === undefined || value.length === 0) {
          return usage("node <id> set needs a name and a value");
        }
        return await nodeSet(cwd, first, name, value.join(" "));
      }
      if (action === "unset") {
        const [name, ...rest3] = extra;
        if (name === undefined) return usage("node <id> unset needs a name");
        if (rest3.length > 0) return usage("node <id> unset takes one name");
        return await nodeSet(cwd, first, name, null);
      }
      return usage(
        `node <id> needs an action: read, write, set, unset\n\n${help()}`,
      );
    }

    default:
      return usage(`unknown scope: ${scope}\n\n${help()}`);
  }
}

if (import.meta.main) {
  const outcome = await run(Deno.args);
  if (outcome.kind === "ok") {
    if (outcome.stdout !== "") {
      await Deno.stdout.write(new TextEncoder().encode(outcome.stdout));
    }
    for (const note of outcome.notes) console.error(note);
  } else {
    console.error(outcome.message);
  }
  Deno.exit(exitCode(outcome));
}
