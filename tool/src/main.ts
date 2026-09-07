import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, usage } from "./outcome.ts";
import { node, nodes, nodeWrite, space, spaceInit, type Stdin } from "./commands.ts";

/** One table. Dispatch reads it, and so does help — so the two cannot drift. */
const SCOPES = {
  space: {
    summary: "what and where this space is",
    actions: { init: "create one" },
  },
  nodes: {
    summary: "every id, in creation order",
    actions: {},
  },
  node: {
    summary: "<id> — the content",
    actions: { write: "[<id>] — stdin is the content" },
  },
} as const;

type Scope = keyof typeof SCOPES;
const isScope = (s: string): s is Scope => s in SCOPES;

function help(): string {
  const forms: [string, string][] = [];
  for (const [scope, spec] of Object.entries(SCOPES)) {
    forms.push([`kg ${scope}`, spec.summary]);
    for (const [action, summary] of Object.entries(spec.actions)) {
      forms.push([`kg ${scope} ${action}`, summary]);
    }
  }
  const width = Math.max(...forms.map(([form]) => form.length));
  const out = ["kg — knowledge graph files", "", "Scopes:"];
  for (const [form, summary] of forms) out.push(`  ${form.padEnd(width)}   ${summary}`);
  out.push(
    "",
    "A bare scope reads. A scope with an action writes.",
    "",
    "Global:",
    "  -C <dir>        run as if from there",
    "  --allow-empty   let node write store nothing",
    "  --help",
  );
  return out.join("\n");
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
  if (!isScope(scope)) return usage(`unknown scope: ${scope}\n\n${help()}`);

  switch (scope) {
    case "space": {
      const [action] = rest;
      if (action === undefined) return await space(cwd);
      if (action === "init") return await spaceInit(cwd);
      return usage(`unknown action: space ${action}\n\n${help()}`);
    }
    case "nodes": {
      if (rest.length > 0) return usage(`nodes takes no arguments\n\n${help()}`);
      return await nodes(cwd);
    }
    case "node": {
      const [first, ...more] = rest;
      if (first === "write") {
        if (more.length > 1) return usage("node write takes at most one id");
        return await nodeWrite(cwd, more[0] ?? null, await stdin(), flags["allow-empty"]);
      }
      if (first === undefined) return usage("node needs an id\n\n" + help());
      if (more.length > 0) return usage("node takes one id — prose does not concatenate");
      return await node(cwd, first);
    }
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
