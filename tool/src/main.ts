import { parseArgs } from "@std/cli/parse-args";
import { exitCode, lines, type Outcome, refused, usage } from "./outcome.ts";
import { isDir } from "./space.ts";
import type { Uuid } from "./node.ts";
import { check, help, match } from "./surface.ts";

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

/** Parse, match, check, run. Each step's rules live in `surface.ts`, so what is
 * left here is the two things a table cannot hold: the process, and the shell. */
export async function run(argv: string[]): Promise<Outcome> {
  let unknownFlag: string | undefined;
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
  if (unknownFlag !== undefined) {
    return usage(`unknown flag: ${unknownFlag}\n\n${help()}`);
  }
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

  const matched = match(flags._.map(String));
  // Every usage message ends in the full help: the caller got the form wrong,
  // and the forms are the answer.
  if (matched.kind === "usage") {
    return usage(matched.message === "" ? help() : `${matched.message}\n\n${help()}`);
  }

  const { command, args } = matched;
  const checked = check(command, matched.id, args, {
    stdin: flags.stdin,
    properties: flags.properties,
  });
  if (checked.kind === "refused") return refused(checked.message);
  if (checked.kind === "usage") return usage(checked.message);

  return await command.run({
    cwd,
    // `check` returns an id only for a command that declares one, and the three
    // that do not never read it. This stands in for those, next to the check
    // that would have refused anything else.
    id: checked.id ?? ("" as Uuid),
    args: checked.args,
    properties: flags.properties,
    stdin: () => flags.stdin ? readStdin() : Promise.resolve(""),
  });
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
