import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, refused, usage } from "./outcome.ts";
import { isDir } from "./space.ts";
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

/** One table. Dispatch reads it, and so does help — so the two cannot drift.
 *
 * A scope names what the operation can touch and never overstates it, which is
 * why enumerating is `nodes list` and not `node list`. An id narrows the scope
 * rather than arguing a verb, so it sits beside the noun it identifies. */
const FORMS = [
  ["space", "what and where this space is"],
  ["space init", "create one"],
  ["nodes list", "every id, in creation order"],
  ["node new", "create an empty one"],
  ["node new --stdin", "…with content read from stdin"],
  ["node <id>", "the content, properties on stderr"],
  ["node <id> --properties", "the properties instead"],
  ["node <id> write --stdin", "stdin replaces the content"],
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
    "  --help",
  ].join("\n");
}

/** Read only when told to. `isTerminal()` answers *is something attached*,
 * not *is content coming* — so an open pipe with nothing in it blocked forever,
 * which was the only hang in the tool. */
async function readStdin(): Promise<string> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of Deno.stdin.readable) chunks.push(chunk);
  const size = chunks.reduce((n, c) => n + c.length, 0);
  const joined = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    joined.set(chunk, at);
    at += chunk.length;
  }
  return new TextDecoder().decode(joined);
}

export async function run(argv: string[]): Promise<Outcome> {
  let unknownFlag: string | null = null;
  const flags = parseArgs(argv, {
    boolean: ["help", "stdin", "properties"],
    // `_` keeps positionals as text. Without it parseArgs runs
    // `isNumber(arg) ? Number(arg) : arg` over every one, so `set version 1.10`
    // stores 1.1 and a ticket past 2^53 gains invented digits. The value is
    // stored as given, and that starts here rather than in the serialiser.
    string: ["C", "_"],
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
  if (flags.C !== undefined && !await isDir(flags.C)) {
    return refused(`not a directory: ${flags.C}`);
  }

  const [scope, ...rest] = flags._.map(String);
  if (scope === undefined) return usage(help());

  // `--properties` is parsed globally because parseArgs must know it is a
  // boolean, but it means something on exactly one command. Accepted and
  // ignored elsewhere it returned a plausible answer, which is worse than
  // refusing — so placement is checked rather than existence.
  if (flags.properties && !(scope === "node" && rest.length === 1)) {
    return usage("--properties belongs to `kg node <id>`");
  }
  if (flags.stdin && scope !== "node") {
    return usage("--stdin belongs to `kg node new` and `kg node <id> write`");
  }

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
      return await nodes(cwd);
    }

    // `node` is the one scope with two shapes: you cannot address what does not
    // exist yet, so `new` stands where an id otherwise would.
    case "node": {
      const [first, ...rest2] = rest;
      if (first === undefined) return usage(`node needs an id, or new\n\n${help()}`);
      if (first === "new") {
        if (rest2.length > 0) return usage("node new takes no arguments");
        return await nodeNew(cwd, flags.stdin ? await readStdin() : "");
      }
      const [action, ...extra] = rest2;
      const takesArguments = ["set", "unset", "add", "remove"].includes(action ?? "");
      if (extra.length > 0 && !takesArguments) {
        return usage(`node <id> ${action} takes no arguments`);
      }
      if (action === undefined) return await node(cwd, first, flags.properties);
      if (action === "write") {
        if (!flags.stdin) {
          return usage(
            "node <id> write needs --stdin — that is where the content comes from",
          );
        }
        return await nodeWrite(cwd, first, await readStdin());
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
    // A consumer closing early — `| head`, a failing filter — is not an error
    // here. Left uncaught it printed a trace naming a path inside the compiled
    // binary, which is the one thing this tool never emits.
    try {
      if (outcome.stdout !== "") {
        await Deno.stdout.write(new TextEncoder().encode(outcome.stdout));
      }
      for (const note of outcome.notes) console.error(note);
    } catch (error) {
      if (!(error instanceof Deno.errors.BrokenPipe)) throw error;
      Deno.exit(0);
    }
  } else {
    console.error(outcome.message);
  }
  Deno.exit(exitCode(outcome));
}
