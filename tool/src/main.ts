import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, usage } from "./outcome.ts";
import {
  node,
  nodeNew,
  nodes,
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
  ["node new", "create one — stdin is its content"],
  ["node <id> read", "the content"],
  ["node <id> write", "stdin replaces the content"],
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
    boolean: ["help", "allow-empty"],
    string: ["C"],
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
      return await nodes(cwd);
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
      if (extra.length > 0) return usage(`node <id> ${action} takes no arguments`);
      if (action === "read") return await node(cwd, first);
      if (action === "write") {
        return await nodeWrite(cwd, first, await stdin(), flags["allow-empty"]);
      }
      return usage(`node <id> needs an action: read, write\n\n${help()}`);
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
