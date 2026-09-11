import { exitCode, lines, type Outcome, refused, usage } from "./outcome.ts";
import { isDir } from "./space.ts";
import { check, declares, help, match } from "./surface.ts";
import { globals, head, split } from "./argv.ts";

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

/**
 * Globals, then the command, then that command's own flags.
 *
 * The order is git's — `git -C path commit -m msg`, where `-C` is git's and
 * `-m` is `commit`'s. It is also what lets a flag be parsed against the command
 * that owns it, which is the whole of why a flag accepted where it means
 * nothing is no longer possible.
 */
export async function run(argv: string[]): Promise<Outcome> {
  const outer = globals(argv);
  if (outer.bad !== undefined) return usage(`${outer.bad}\n\n${help()}`);
  // Asking for help is not a usage error: it answers on stdout and succeeds,
  // so `kg --help | less` works. Help shown *because* a call was wrong is the
  // other thing, and goes to stderr with the rest of the refusal.
  if (outer.help) return lines([help()]);

  // `-C` is git's: run this as if from there, resolved before anything else.
  const cwd = outer.cwd ?? Deno.cwd();
  // Without this the throw from a missing cwd is caught downstream as a missing
  // git binary, and the tool reports the wrong thing entirely.
  if (outer.cwd !== undefined && !await isDir(outer.cwd)) {
    return refused(`not a directory: ${outer.cwd}`);
  }

  // What identifies a command carries no dashes and comes first, so the command
  // is known before any of its flags are read.
  const { path, rest } = head(outer.rest);
  const matched = match([...path]);
  // Every usage message ends in the full help: the caller got the form wrong,
  // and the forms are the answer.
  if (matched.kind === "usage") {
    return usage(matched.message === "" ? help() : `${matched.message}\n\n${help()}`);
  }

  const { command } = matched;
  const parsed = split(rest, command.flags);
  if (parsed.kind === "unknown") {
    const elsewhere = declares(parsed.flag.slice(2));
    return usage(
      elsewhere.length > 0
        ? `${parsed.flag} belongs to ${elsewhere.join(" and ")}`
        : `unknown flag: ${parsed.flag}\n\n${help()}`,
    );
  }
  if (parsed.kind === "missing") {
    return usage(`${parsed.flag} needs a value`);
  }

  const checked = check(
    command,
    matched.id,
    [...matched.args, ...parsed.positionals],
    parsed.flags,
  );
  if (checked.kind === "refused") return refused(checked.message);
  if (checked.kind === "usage") return usage(checked.message);

  return await command.run({
    cwd,
    // `check` returns an id only for a command that declares one, and the three
    // that do not never read it. This stands in for those, next to the check
    // that would have refused anything else.
    id: checked.id ?? "",
    labels: checked.labels,
    args: checked.args,
    flags: parsed.flags,
    stdin: () => parsed.flags.stdin === true ? readStdin() : Promise.resolve(""),
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
