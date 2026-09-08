import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, refused, usage } from "./outcome.ts";
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
  type Stdin,
} from "./commands.ts";

/** One table. Dispatch reads it, and so does help — so the two cannot drift.
 *
 * A scope names what the operation can touch and never overstates it, which is
 * why enumerating is `nodes list` and not `node list`. An id narrows the scope
 * rather than arguing a verb, so it sits beside the noun it identifies. */
const FORMS = [
  ["space", "what and where this space is"],
  ["space init", "create one"],
  ["nodes list", "every id, in creation order"],
  ["nodes list --where <name>=<value>", "…whose property equals that"],
  ["node new", "create one — stdin is its content"],
  ["node <id>", "the content, with its properties on stderr"],
  ["node <id> --properties", "the properties instead"],
  ["node <id> write", "stdin replaces the content"],
  ["node <id> set <name> <value>", "write one property"],
  ["node <id> unset <name>", "remove one"],
  ["node <id> add <name> <value>...", "values into a property's list"],
  ["node <id> remove <name> <value>...", "values out of it"],
] as const;

function help(): string {
  const width = Math.max(...FORMS.map(([form]) => form.length));
  return [
    "kg — knowledge graph files",
    "",
    "Commands:",
    ...FORMS.map(([form, summary]) => `  kg ${form.padEnd(width)}   ${summary}`),
    "",
    "Reading a single resource is implicit. Everything else names its action.",
    "",
    "Global:",
    "  -C <dir>        run as if from there",
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
    boolean: ["help", "properties"],
    string: ["C", "where"],
    collect: ["where"],
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
  // Without this the throw from a missing cwd is caught downstream as a missing
  // git binary, and the tool reports the wrong thing entirely.
  if (flags.C !== undefined && !isDirectory(flags.C)) {
    return refused(`not a directory: ${flags.C}`);
  }

  /** `collect` yields undefined for a flag that was never passed, one value for
   * a flag passed once, and an array beyond that. */
  const many = (value: unknown): string[] =>
    value === undefined ? [] : Array.isArray(value) ? value.map(String) : [String(value)];

  /** `--where` always carries a comparison. The bare form was a presence test
   * wearing a comparison word; presence is parked. */
  const clause = (text: string) => {
    const at = text.indexOf("=");
    return at === -1 ? null : { name: text.slice(0, at), value: text.slice(at + 1) };
  };
  const [scope, ...rest] = flags._.map(String);
  if (scope === undefined) return usage(help());

  switch (scope) {
    case "space": {
      const [action, ...extra] = rest;
      if (extra.length > 0) return usage(`space ${action} takes no arguments`);
      // A single resource reads bare: there is nothing else `kg space` means.
      if (action === undefined) return await space(cwd);
      if (action === "init") return await spaceInit(cwd);
      return usage(`space takes one action: init\n\n${help()}`);
    }

    case "nodes": {
      const [action, ...extra] = rest;
      if (action !== "list" || extra.length > 0) {
        return usage(`nodes takes one action: list\n\n${help()}`);
      }
      const clauses = many(flags.where).map(clause);
      if (clauses.includes(null)) {
        return usage("--where needs a comparison — use --where <name>=<value>");
      }
      return await nodes(cwd, clauses as { name: string; value: string }[]);
    }

    // `node` is the one scope with two shapes: you cannot address what does not
    // exist yet, so `new` stands where an id otherwise would.
    case "node": {
      const [first, ...rest2] = rest;
      if (first === undefined) return usage(`node needs an id, or new\n\n${help()}`);
      if (first === "new") {
        if (rest2.length > 0) return usage("node new takes no arguments");
        return await nodeNew(cwd, await stdin());
      }
      const [action, ...extra] = rest2;
      const takesArguments = ["set", "unset", "add", "remove"].includes(action ?? "");
      if (extra.length > 0 && !takesArguments) {
        return usage(`node <id> ${action} takes no arguments`);
      }
      if (action === undefined) return await node(cwd, first, flags.properties);
      if (action === "write") {
        return await nodeWrite(cwd, first, await stdin());
      }
      if (action === "set") {
        const [name, ...value] = extra;
        if (name === undefined || value.length === 0) {
          return usage("node <id> set needs a name and a value");
        }
        // Exactly one value. Joining several would collide with a list
        // operation, where several values mean several elements.
        if (value.length > 1) {
          return usage("node <id> set takes one value — quote it if it contains spaces");
        }
        return await nodeSet(cwd, first, name, value[0]);
      }
      if (action === "unset") {
        const [name, ...rest3] = extra;
        if (name === undefined) return usage("node <id> unset needs a name");
        if (rest3.length > 0) return usage("node <id> unset takes one name");
        return await nodeSet(cwd, first, name, null);
      }
      if (action === "add" || action === "remove") {
        const [name, ...values] = extra;
        if (name === undefined || values.length === 0) {
          return usage(`node <id> ${action} needs a name and at least one value`);
        }
        return action === "add"
          ? await nodeAdd(cwd, first, name, values)
          : await nodeRemove(cwd, first, name, values);
      }
      return usage(
        `node <id> takes one action: write, set, unset, add, remove\n\n${help()}`,
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

function isDirectory(path: string): boolean {
  try {
    return Deno.statSync(path).isDirectory;
  } catch {
    return false;
  }
}
