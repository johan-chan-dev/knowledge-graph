import { parseArgs } from "@std/cli/parse-args";
import { exitCode, type Outcome, usage } from "./outcome.ts";
import { init, label, list, newNode, show } from "./commands.ts";

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
  label: {
    summary: "add labels to a node, or remove them",
    args: "<id> <name>…",
    flags: ["--remove"] as const,
  },
  list: {
    summary: "enumerate nodes",
    args: "",
    flags: [
      "--with-label <name>",
      "--with-labels <name>…",
      "--meta",
      "--path",
    ] as const,
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

/**
 * `--with-labels a b c` is one flag taking many names, which `parseArgs` does
 * not do: it takes the first as the value and leaves the rest as positionals.
 * Since `list` has no positional argument of its own, everything left over is a
 * name.
 *
 * The two spellings differ in arity, not behaviour. `--with-label` takes
 * exactly one and refuses more, so a flag's name is never wrong about what it
 * accepts.
 */
type Variadic =
  | { readonly kind: "names"; readonly names: string[] }
  | { readonly kind: "usage"; readonly message: string };

function variadic(
  flags: { "with-label"?: string; "with-labels"?: string; _: (string | number)[] },
): Variadic {
  const singular = flags["with-label"];
  const plural = flags["with-labels"];
  if (singular !== undefined && plural !== undefined) {
    return { kind: "usage", message: "use --with-label or --with-labels, not both" };
  }
  const first = singular ?? plural;
  if (first === undefined) return { kind: "names", names: [] };

  const rest = flags._.map(String);
  if (singular !== undefined && rest.length > 0) {
    return {
      kind: "usage",
      message: "--with-label takes one name; use --with-labels for several",
    };
  }
  return { kind: "names", names: [first, ...rest] };
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
    boolean: ["meta", "path", "json", "help", "remove"],
    string: ["with-label", "with-labels"],
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
    case "label": {
      const [id, ...names] = flags._.map(String);
      if (id === undefined) return usage("label needs an id");
      return await label(id, names, { remove: flags.remove });
    }
    case "list": {
      const labels = variadic(flags);
      if (labels.kind === "usage") return usage(labels.message);
      return await list({
        labels: labels.names,
        meta: flags.meta,
        path: flags.path,
        json: flags.json,
      });
    }
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
