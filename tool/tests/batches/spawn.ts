/**
 * One test per batch, walking the loop that batch exists to close — against
 * the **compiled binary**, not the source.
 *
 * `kg.test.ts` calls `run()` in process, which is fast and precise but cannot
 * see anything `deno compile` changes: embedded permissions, `import.meta.main`,
 * the entry path. The transcripts in `docs/batches/` were generated from the
 * binary, so without this the documented behaviour and the tested behaviour are
 * two different programs.
 *
 * These are history-shaped rather than subject-shaped, which is why they can be
 * organised by batch where the rest cannot: a batch's loop either still closes
 * or the batch was undone, and either way the transcript needs revisiting.
 */
export const BINARY = new URL("../../build/kg", import.meta.url).pathname;

export type Ran = { code: number; out: string; err: string };

export async function kg(dir: string, argv: string[], input?: string): Promise<Ran> {
  const child = new Deno.Command(BINARY, {
    args: ["-C", dir, ...argv],
    stdin: input === undefined ? "null" : "piped",
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  if (input !== undefined) {
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(input));
    await writer.close();
  }
  const { code, stdout, stderr } = await child.output();
  const decode = new TextDecoder();
  return { code, out: decode.decode(stdout), err: decode.decode(stderr) };
}

export async function space(): Promise<string> {
  try {
    await Deno.stat(BINARY);
  } catch {
    throw new Error(`no binary at ${BINARY} — run \`deno task compile\` first`);
  }
  return await Deno.makeTempDir({ prefix: "kg-batch-" });
}
