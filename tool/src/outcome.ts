/**
 * Every command returns one of these. The exit code is a projection of it, so a
 * new outcome cannot be added without the compiler demanding a code for it.
 *
 * `refused` and `absent` are different on purpose: refusal means the tool
 * declined, absence means it looked and there was nothing there.
 */
export type Outcome =
  | { readonly kind: "ok"; readonly lines: string[]; readonly warnings: string[] }
  | { readonly kind: "refused"; readonly message: string }
  | { readonly kind: "absent"; readonly message: string }
  | { readonly kind: "usage"; readonly message: string };

export const ok = (lines: string[] = [], warnings: string[] = []): Outcome => ({
  kind: "ok",
  lines,
  warnings,
});
export const refused = (message: string): Outcome => ({ kind: "refused", message });
export const absent = (message: string): Outcome => ({ kind: "absent", message });
export const usage = (message: string): Outcome => ({ kind: "usage", message });

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
