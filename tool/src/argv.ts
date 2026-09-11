/**
 * Splitting a command line, against **one command's** flags.
 *
 * A flag belongs to a command. There is no global list, so a flag is parseable
 * exactly where it is declared and nowhere else — which removes the three
 * separate pieces of machinery that used to walk a global parse back, and the
 * defects that leaked through them. `docs/design/parked/arguments.md` has the
 * argument.
 */

export type Shape =
  | { readonly kind: "boolean" }
  | { readonly kind: "value"; readonly required?: true }
  | { readonly kind: "variadic"; readonly required?: true };

export type Flags = Readonly<Record<string, Shape>>;

export type Split =
  | {
    readonly kind: "split";
    readonly flags: Readonly<Record<string, true | string | string[]>>;
    readonly positionals: readonly string[];
  }
  | { readonly kind: "unknown"; readonly flag: string }
  | { readonly kind: "missing"; readonly flag: string };

/** A variadic flag takes every following token until the next one beginning
 * `-`. Safe because every value this tool accepts there — a label, a uuid, a
 * `name=value` pair — begins `[a-z0-9]`, so nothing it should swallow can look
 * like a flag. */
export function split(argv: readonly string[], spec: Flags): Split {
  const flags: Record<string, true | string | string[]> = {};
  const positionals: string[] = [];
  let i = 0;

  while (i < argv.length) {
    const token = argv[i]!;
    if (token === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (!token.startsWith("--")) {
      positionals.push(token);
      i++;
      continue;
    }

    const at = token.indexOf("=");
    const name = at === -1 ? token.slice(2) : token.slice(2, at);
    const inline = at === -1 ? undefined : token.slice(at + 1);
    const shape = spec[name];
    if (shape === undefined) return { kind: "unknown", flag: `--${name}` };
    i++;

    if (shape.kind === "boolean") {
      flags[name] = true;
      continue;
    }
    if (inline !== undefined) {
      flags[name] = shape.kind === "variadic" ? [inline] : inline;
      continue;
    }
    if (shape.kind === "variadic") {
      const values: string[] = [];
      while (i < argv.length && !argv[i]!.startsWith("-")) values.push(argv[i++]!);
      if (values.length === 0) return { kind: "missing", flag: `--${name}` };
      flags[name] = [...(flags[name] as string[] ?? []), ...values];
      continue;
    }
    if (i >= argv.length || argv[i]!.startsWith("-")) {
      return { kind: "missing", flag: `--${name}` };
    }
    flags[name] = argv[i++]!;
  }

  return { kind: "split", flags, positionals };
}

/** What identifies a command comes first and carries no dashes, so the command
 * can be matched before its flags are known — which is the only way a flag can
 * be parsed against the command that owns it. */
export function head(argv: readonly string[]): {
  readonly path: readonly string[];
  readonly rest: readonly string[];
} {
  let i = 0;
  while (i < argv.length && !argv[i]!.startsWith("-")) i++;
  return { path: argv.slice(0, i), rest: argv.slice(i) };
}

export type Globals = {
  readonly help: boolean;
  readonly cwd?: string;
  readonly rest: readonly string[];
  readonly bad?: string;
};

/** `-C <dir>` and `--help` belong to the tool rather than to any command, so
 * they are taken first — git's arrangement, and the reason `git -C path commit`
 * works while `git -m msg commit` does not. */
export function globals(argv: readonly string[]): Globals {
  const rest: string[] = [];
  let help = false;
  let cwd: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (token === "--help") {
      help = true;
      continue;
    }
    if (token === "-C") {
      const value = argv[++i];
      if (value === undefined) return { help, cwd, rest, bad: "-C needs a directory" };
      cwd = value;
      continue;
    }
    if (token.startsWith("-C") && token.length > 2) {
      cwd = token.slice(2);
      continue;
    }
    rest.push(token);
  }
  return { help, cwd, rest };
}
