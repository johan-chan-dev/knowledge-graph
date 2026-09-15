/**
 * What a command produced. `stdout` is the answer and is written verbatim —
 * `node <id>` returns content byte for byte, so nothing here may add a newline
 * or a separator. `notes` are advisories for a person and go to stderr, which
 * is what keeps stdout safe to pipe.
 */
export type Outcome =
  | { readonly kind: "ok"; readonly stdout: string; readonly notes: readonly string[] }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "absent"; readonly message: string }
  | { readonly kind: "usage"; readonly message: string };

export const ok = (stdout: string, ...notes: string[]): Outcome => ({
  kind: "ok",
  stdout,
  notes,
});

/** Lines on stdout: everything but `node <id>`, which returns raw content. */
export const lines = (lines: readonly string[], ...notes: string[]): Outcome =>
  ok(lines.length === 0 ? "" : lines.join("\n") + "\n", ...notes);

/**
 * **The one format for structured output**, and it takes no flag: the command's
 * subject already says whether it returns identities or data.
 *
 * Indented, because the only reader the default has to please is a person —
 * a program parses either, and `jq -c` is one pipe for a caller who wants it
 * compact. It used to be one line on the reasoning that `jq` pretty-prints when
 * someone is looking, which is true and is an argument for needing `jq` to read
 * an answer. `docs/batches/13-output.md` has the measurements.
 */
export const asJson = (value: unknown): Outcome =>
  ok(JSON.stringify(value, null, 2) + "\n");

export const refused = (message: string): Outcome => ({ kind: "refused", message });
export const absent = (message: string): Outcome => ({ kind: "absent", message });
export const usage = (message: string): Outcome => ({ kind: "usage", message });

/**
 * Refused and absent differ on purpose: refused means the argument breaks a
 * rule and nothing was looked at, absent means it was well formed and is not
 * here. A caller acts differently on each.
 */
export function exitCode(outcome: Outcome): number {
  switch (outcome.kind) {
    case "ok":
      return 0;
    case "refused":
      return 1;
    case "absent":
      return 2;
    case "usage":
      return 4;
  }
}
