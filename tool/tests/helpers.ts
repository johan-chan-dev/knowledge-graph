import { run } from "../src/main.ts";
import type { Outcome } from "../src/outcome.ts";

/** A throwaway space, and the argv prefix that points the tool at it. */
export async function space(): Promise<{ dir: string; kg: typeof at }> {
  const dir = await Deno.makeTempDir({ prefix: "kg-test-" });
  const at = (...argv: string[]) => run(["-C", dir, ...argv]);
  return { dir, kg: at };
}

/** A space with one node in it, so a test can check the content survived
 * whatever it did to the properties. */
export async function seeded(text = "worth keeping\n") {
  const made = await space();
  await made.kg("space", "init");
  const id = (await pipe(made.dir, ["node", "new"], text)).out.trim();
  return { ...made, id };
}

/** A write taking content has to cross a process boundary — `run` cannot be
 * handed a stdin. Everything else goes through `run` directly; the compiled
 * binary is exercised separately, under `batches/`.
 *
 * `--stdin` is appended because content is declared rather than detected. */
export async function pipe(dir: string, argv: string[], input: string) {
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--quiet",
      "--allow-read",
      "--allow-write",
      "--allow-run",
      new URL("../src/main.ts", import.meta.url).pathname,
      "-C",
      dir,
      ...argv,
      "--stdin",
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();
  const { code, stdout, stderr } = await child.output();
  const decode = new TextDecoder();
  return { code, out: decode.decode(stdout), err: decode.decode(stderr) };
}

export const stdout = (outcome: Outcome) => outcome.kind === "ok" ? outcome.stdout : "";
export const message = (outcome: Outcome) => outcome.kind === "ok" ? "" : outcome.message;
export const rows = (outcome: Outcome) => stdout(outcome).split("\n").filter(Boolean);

/** Three nodes: two decisions, one of them dated; one note. The smallest
 * population a filter can be wrong about. */
export async function seeded3() {
  const made = await space();
  await made.kg("space", "init");
  const ids: string[] = [];
  for (
    const [kind, dated] of [["decision", true], ["decision", false], [
      "note",
      false,
    ]] as const
  ) {
    const id = (await pipe(made.dir, ["node", "new"], `${kind}\n`)).out.trim();
    await made.kg("node", id, "set", "kind", kind);
    if (dated) await made.kg("node", id, "set", "valid-until", "2027-01-01");
    ids.push(id);
  }
  return { ...made, ids: ids as [string, string, string] };
}
