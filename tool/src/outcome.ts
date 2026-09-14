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

/** JSON, one line, as a command's `--json` prints it. The tool is the only
 * writer of this too, so compactness costs nothing a reader needs — `jq`
 * pretty-prints when a person is looking. */
export const asJson = (value: unknown): Outcome => ok(JSON.stringify(value) + "\n");

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
