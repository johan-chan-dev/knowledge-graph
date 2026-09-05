import { parseArgs } from "@std/cli/parse-args";
import { exitCode, type Outcome, usage } from "./outcome.ts";
import { init, list, newNode, show } from "./commands.ts";

/**
 * One table. Dispatch reads it, and so does help — so the two cannot drift.
 */
const COMMANDS = {
  init: {
    summary: "create a space here",
    args: "",
    flags: [] as const,
  },
  new: {
    summary: "create a node and print its path",
    args: "",
    flags: ["--meta"] as const,
  },
  show: {
    summary: "print a node, or its path",
    args: "<id>",
    flags: ["--path"] as const,
  },
  list: {
    summary: "enumerate nodes",
    args: "",
    flags: ["--meta", "--path"] as const,
  },
} as const;

type Command = keyof typeof COMMANDS;

const isCommand = (s: string): s is Command => s in COMMANDS;

function help(): string {
  const width = Math.max(...Object.keys(COMMANDS).map((c) => c.length));
  const lines = ["kg — knowledge graph files", "", "Commands:"];
  for (const [name, spec] of Object.entries(COMMANDS)) {
    lines.push(`  ${name.padEnd(width)}  ${spec.args.padEnd(6)}  ${spec.summary}`);
    if (spec.flags.length > 0) {
      lines.push(`  ${" ".repeat(width)}          ${spec.flags.join("  ")}`);
    }
  }
  lines.push("", "Global:", "  --json    structured output", "  --help");
  return lines.join("\n");
}

async function run(argv: string[]): Promise<Outcome> {
  const [name, ...rest] = argv;
  if (name === undefined || name === "--help" || name === "-h") {
    return usage(help());
  }
  if (!isCommand(name)) {
    return usage(`unknown command: ${name}\n\n${help()}`);
  }

  let unknownFlag: string | null = null;
  const flags = parseArgs(rest, {
    boolean: ["meta", "path", "json", "help"],
    unknown: (arg) => {
      if (arg.startsWith("-")) unknownFlag = arg;
      return true;
    },
  });
  if (unknownFlag !== null) {
    return usage(`unknown flag: ${unknownFlag}\n\n${help()}`);
  }
  if (flags.help) return usage(help());

  switch (name) {
    case "init":
      return await init();
    case "new":
      return await newNode({ meta: flags.meta });
    case "show": {
      const id = flags._[0];
      if (id === undefined) return usage("show needs an id");
      return await show(String(id), { path: flags.path, json: flags.json });
    }
    case "list":
      return await list({ meta: flags.meta, path: flags.path, json: flags.json });
  }
}

if (import.meta.main) {
  const outcome = await run(Deno.args);
  switch (outcome.kind) {
    case "ok":
      for (const line of outcome.lines) console.log(line);
      break;
    case "refused":
    case "absent":
    case "usage":
      console.error(outcome.message);
      break;
  }
  Deno.exit(exitCode(outcome));
}

export { run };
