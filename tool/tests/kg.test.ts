import { assert, assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { run } from "../src/main.ts";
import { exitCode, type Outcome } from "../src/outcome.ts";

/** A throwaway directory, and the argv prefix that points the tool at it. */
async function space(): Promise<{ dir: string; kg: typeof at }> {
  const dir = await Deno.makeTempDir({ prefix: "kg-test-" });
  const at = (...argv: string[]) => run(["-C", dir, ...argv]);
  return { dir, kg: at };
}

/** stdin is a terminal under `deno test`, so a piped write is exercised by
 * spawning the real entrypoint. Everything else goes through `run` directly. */
async function pipe(dir: string, argv: string[], input: string) {
  const command = new Deno.Command(Deno.execPath(), {
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
    ],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  const child = command.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();
  const { code, stdout, stderr } = await child.output();
  const decode = new TextDecoder();
  return { code, out: decode.decode(stdout), err: decode.decode(stderr) };
}

const stdout = (outcome: Outcome) => outcome.kind === "ok" ? outcome.stdout : "";
const message = (outcome: Outcome) => outcome.kind === "ok" ? "" : outcome.message;

// ── space ────────────────────────────────────────────────────────────────────

Deno.test("outside a space, every command says so and exits 2", async () => {
  const { kg } = await space();
  for (const argv of [["space", "show"], ["nodes", "list"]]) {
    const outcome = await kg(...argv);
    assertEquals(exitCode(outcome), 2, argv.join(" "));
    assertEquals(message(outcome), "no space here — run: kg space init");
  }
});

Deno.test("init creates the repository it needs, and says so on stderr", async () => {
  const { kg } = await space();
  const outcome = await kg("space", "init");
  assertEquals(exitCode(outcome), 0);
  assert(outcome.kind === "ok");
  assertStringIncludes(outcome.notes.join("\n"), "initialised a git repository at");
  assertStringIncludes(stdout(outcome), "branch   (no commit yet)");
  assertStringIncludes(stdout(outcome), "nodes    0");
});

Deno.test("a repository holds one space or none", async () => {
  const { kg } = await space();
  await kg("space", "init");
  const again = await kg("space", "init");
  assertEquals(exitCode(again), 1);
  assertStringIncludes(message(again), "this repository already has a space at");
});

Deno.test("the readout names the directory the space sits in", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const outcome = await kg("space", "show");
  // The space stores no name of its own — it is read off the directory.
  assertMatch(stdout(outcome), new RegExp(`^${dir.split("/").pop()}\n`));
});

// ── ids ──────────────────────────────────────────────────────────────────────

Deno.test("a string that is not a uuid is refused, never looked up", async () => {
  const { kg } = await space();
  // No space here at all: refusing before lookup is what makes this exit 1.
  const outcome = await kg("node", "abc", "read");
  assertEquals(exitCode(outcome), 1);
  assertEquals(message(outcome), "not an id: abc — expected a uuid");
});

Deno.test("a well-formed id that is not here is absent, and names the space", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const outcome = await kg("node", "00000000-0000-7000-8000-000000000000", "read");
  assertEquals(exitCode(outcome), 2);
  assertStringIncludes(message(outcome), `in ${dir.split("/").pop()}`);
});

Deno.test("any uuid is well formed, not only the v7 the tool mints", async () => {
  const { kg } = await space();
  await kg("space", "init");
  // A v4 is a plausible id this tool never issued — honestly absent, not refused.
  const outcome = await kg("node", crypto.randomUUID(), "read");
  assertEquals(exitCode(outcome), 2);
});

// ── the loop ─────────────────────────────────────────────────────────────────

Deno.test("write, read back byte for byte, and find it in the collection", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");

  const text = "Keeping the id in the filename\nmakes a rename impossible.\n";
  const written = await pipe(dir, ["node", "new"], text);
  assertEquals(written.code, 0);
  const id = written.out.trim();
  assertMatch(id, /^[0-9a-f-]{36}$/);
  assertStringIncludes(written.err, "wrote 58 bytes");

  const read = await kg("node", id, "read");
  assertEquals(stdout(read), text, "content must round-trip exactly");

  const listed = await kg("nodes", "list");
  assertEquals(stdout(listed), `${id}\n`);
});

Deno.test("replacing keeps the id and reports what it displaced", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const id = (await pipe(dir, ["node", "new"], "first draft\n")).out.trim();

  const again = await pipe(dir, ["node", id, "write"], "second\n");
  assertEquals(again.out.trim(), id, "the id it wrote comes back");
  assertStringIncludes(again.err, "wrote 7 bytes, replacing 12");
  assertEquals(stdout(await kg("node", id, "read")), "second\n");
});

Deno.test("write refuses an id that is not here rather than creating it", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const absent = "00000000-0000-7000-8000-000000000000";
  const result = await pipe(dir, ["node", absent, "write"], "content\n");
  assertEquals(result.code, 2);
  assertEquals(stdout(await kg("nodes", "list")), "", "nothing was created");
});

Deno.test("ids sort into creation order, to the millisecond", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const made: string[] = [];
  for (let n = 0; n < 3; n++) {
    made.push((await pipe(dir, ["node", "new"], `node ${n}\n`)).out.trim());
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  assertEquals(stdout(await kg("nodes", "list")), made.join("\n") + "\n");
});

// ── empty stdin ──────────────────────────────────────────────────────────────

Deno.test("an empty stdin refuses, and says how to mean it", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const result = await pipe(dir, ["node", "new"], "");
  assertEquals(result.code, 1);
  assertStringIncludes(result.err, "pass --allow-empty for an empty node");
  assertEquals(stdout(await kg("nodes", "list")), "", "nothing was created");
});

Deno.test("an empty stdin cannot destroy a node's content by accident", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const id = (await pipe(dir, ["node", "new"], "worth keeping\n")).out.trim();

  const result = await pipe(dir, ["node", id, "write"], "");
  assertEquals(result.code, 1);
  assertEquals(
    stdout(await kg("node", id, "read")),
    "worth keeping\n",
    "content survives",
  );
});

Deno.test("--allow-empty is the escape hatch, for both create and replace", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");

  const made = await pipe(dir, ["node", "new", "--allow-empty"], "");
  assertEquals(made.code, 0);
  assertEquals(stdout(await kg("node", made.out.trim())), "");

  const id = (await pipe(dir, ["node", "new"], "something\n")).out.trim();
  const emptied = await pipe(dir, ["node", id, "write", "--allow-empty"], "");
  assertEquals(emptied.code, 0);
  assertEquals(stdout(await kg("node", id, "read")), "");
});

// ── usage ────────────────────────────────────────────────────────────────────

Deno.test("asking for help succeeds; being wrong does not", async () => {
  const help = await run(["--help"]);
  assertEquals(exitCode(help), 0, "help answers on stdout and succeeds");
  assertStringIncludes(stdout(help), "names its scope, then what it does");

  for (
    const argv of [["--nope"], ["nope"], ["node"], ["nodes"], ["nodes", "extra"], [
      "space",
    ]]
  ) {
    assertEquals(exitCode(await run(argv)), 4, argv.join(" "));
  }
});

Deno.test("a scope needs an action, and an id needs one after it", async () => {
  assertStringIncludes(message(await run(["node", "a", "b"])), "needs an action");
  assertStringIncludes(message(await run(["space"])), "needs an action");
  assertStringIncludes(message(await run(["node"])), "needs an id, or new");
  assertStringIncludes(message(await run(["nodes"])), "takes one action");
});
