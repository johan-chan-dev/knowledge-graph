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
  for (const argv of [["space"], ["nodes", "list"]]) {
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
  const outcome = await kg("space");
  // The space stores no name of its own — it is read off the directory.
  assertMatch(stdout(outcome), new RegExp(`^${dir.split("/").pop()}\n`));
});

// ── ids ──────────────────────────────────────────────────────────────────────

Deno.test("a string that is not a uuid is refused, never looked up", async () => {
  const { kg } = await space();
  // No space here at all: refusing before lookup is what makes this exit 1.
  const outcome = await kg("node", "abc");
  assertEquals(exitCode(outcome), 1);
  assertEquals(message(outcome), "not an id: abc — expected a uuid");
});

Deno.test("a well-formed id that is not here is absent, and names the space", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const outcome = await kg("node", "00000000-0000-7000-8000-000000000000");
  assertEquals(exitCode(outcome), 2);
  assertStringIncludes(message(outcome), `in ${dir.split("/").pop()}`);
});

Deno.test("any uuid is well formed, not only the v7 the tool mints", async () => {
  const { kg } = await space();
  await kg("space", "init");
  // A v4 is a plausible id this tool never issued — honestly absent, not refused.
  const outcome = await kg("node", crypto.randomUUID());
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
  assertEquals(written.err, "", "the id is on stdout; nothing else needed saying");

  const read = await kg("node", id);
  assertEquals(stdout(read), text, "content must round-trip exactly");

  const listed = await kg("nodes", "list");
  assertEquals(stdout(listed), `${id}\n`);
});

Deno.test("a targeted write says only what it displaced", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const id = (await pipe(dir, ["node", "new"], "first draft\n")).out.trim();

  const again = await pipe(dir, ["node", id, "write"], "second\n");
  assertEquals(again.out, "", "the caller supplied the id; echoing it is noise");
  assertStringIncludes(again.err, "replaced 12 bytes");
  assertEquals(stdout(await kg("node", id)), "second\n");
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
    stdout(await kg("node", id)),
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
  assertEquals(stdout(await kg("node", id)), "");
});

// ── usage ────────────────────────────────────────────────────────────────────

Deno.test("asking for help succeeds; being wrong does not", async () => {
  const help = await run(["--help"]);
  assertEquals(exitCode(help), 0, "help answers on stdout and succeeds");
  assertStringIncludes(stdout(help), "Reading a single resource is implicit");

  for (const argv of [["--nope"], ["nope"], ["node"], ["nodes"], ["nodes", "extra"]]) {
    assertEquals(exitCode(await run(argv)), 4, argv.join(" "));
  }
});

Deno.test("a single resource reads bare; a collection names its action", async () => {
  // `space` and `node <id>` are the two that read without a verb.
  const { kg } = await space();
  assertEquals(exitCode(await kg("space")), 2, "reads and reports, never usage");
  assertStringIncludes(
    message(await run(["-C", "/nonexistent", "space"])),
    "not a directory",
  );
  assertStringIncludes(message(await run(["node", "a", "b"])), "takes one action");
  assertStringIncludes(message(await run(["node"])), "needs an id, or new");
  assertStringIncludes(message(await run(["nodes"])), "takes one action");
});

// ── properties ───────────────────────────────────────────────────────────────

/** Every property test needs a node with content, so it can check the content
 * survived — which is the batch-1 path that had no way to be tested. */
async function seeded(text = "worth keeping\n") {
  const made = await space();
  await made.kg("space", "init");
  const id = (await pipe(made.dir, ["node", "new"], text)).out.trim();
  return { ...made, id };
}

Deno.test("set writes a property and leaves the content alone", async () => {
  const { kg, id } = await seeded();
  const set = await kg("node", id, "set", "kind", "decision");
  assertEquals(exitCode(set), 0);
  assertEquals(stdout(set), "", "a targeted write prints nothing");
  assert(set.kind === "ok" && set.notes.join().includes("set kind"));

  assertEquals(stdout(await kg("node", id, "--properties")), "kind: decision\n");
  assertEquals(stdout(await kg("node", id)), "worth keeping\n");
});

Deno.test("write replaces the content and leaves the properties alone", async () => {
  const { dir, kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");

  await pipe(dir, ["node", id, "write"], "rewritten\n");
  assertEquals(stdout(await kg("node", id)), "rewritten\n");
  // The batch-1 preserve step, observable for the first time.
  assertEquals(stdout(await kg("node", id, "--properties")), "kind: decision\n");
});

Deno.test("properties are stored as given and never retyped", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "valid-until", "2027-01-01");
  await kg("node", id, "set", "count", "42");
  // Under the default YAML schema the first would come back a Date and the
  // second a number, which would be the tool deciding what a field it has
  // never heard of means.
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "count: 42\nvalid-until: 2027-01-01\n",
  );
});

Deno.test("properties come back in a stable order, whatever order they went in", async () => {
  const { kg, id } = await seeded();
  for (const name of ["zulu", "alpha", "mike"]) await kg("node", id, "set", name, "x");
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "alpha: x\nmike: x\nzulu: x\n",
  );
});

Deno.test("unset removes one, is idempotent, and says which it was", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "other", "keep");

  const first = await kg("node", id, "unset", "kind");
  assert(first.kind === "ok" && first.notes.join().includes("unset kind"));

  const again = await kg("node", id, "unset", "kind");
  assertEquals(exitCode(again), 0, "removing what is absent is the end state asked for");
  assert(again.kind === "ok" && again.notes.join().includes("was not set"));

  assertEquals(stdout(await kg("node", id, "--properties")), "other: keep\n");
});

Deno.test("a node with no properties prints nothing", async () => {
  const { kg, id } = await seeded();
  const outcome = await kg("node", id, "--properties");
  assertEquals(exitCode(outcome), 0);
  assertEquals(stdout(outcome), "");
});

Deno.test("a property name must be a lowercase hyphenated token", async () => {
  const { kg, id } = await seeded();
  for (const name of ["Valid_Until", "valid until", "trailing-", "with.dot"]) {
    const outcome = await kg("node", id, "set", name, "x");
    assertEquals(exitCode(outcome), 1, name);
    assertStringIncludes(message(outcome), "expected a lowercase hyphenated token");
  }
  // A leading dash never reaches validation — the parser reads it as a flag,
  // which is why a name shaped like one is unusable rather than merely refused.
  assertEquals(exitCode(await kg("node", id, "set", "-leading", "x")), 4);
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "",
    "nothing written",
  );
});

// ── filtering ────────────────────────────────────────────────────────────────

/** Three nodes: two decisions, one of them dated; one note. */
async function seeded3() {
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
  return { ...made, ids };
}

const rows = (outcome: Outcome) => stdout(outcome).split("\n").filter(Boolean);

Deno.test("three predicates: equals, present, absent", async () => {
  const { kg, ids } = await seeded3();
  assertEquals(rows(await kg("nodes", "list")).length, 3);
  assertEquals(rows(await kg("nodes", "list", "--where", "kind=decision")), [
    ids[0],
    ids[1],
  ]);
  assertEquals(rows(await kg("nodes", "list", "--where", "valid-until")), [ids[0]]);
  assertEquals(rows(await kg("nodes", "list", "--without", "valid-until")), [
    ids[1],
    ids[2],
  ]);
});

Deno.test("filters are ANDed, and match nothing rather than erroring", async () => {
  const { kg, ids } = await seeded3();
  assertEquals(
    rows(
      await kg("nodes", "list", "--where", "kind=decision", "--without", "valid-until"),
    ),
    [ids[1]],
  );
  // A read command reports what it found rather than judging what it was asked.
  const none = await kg("nodes", "list", "--where", "kind=nope");
  assertEquals(exitCode(none), 0);
  assertEquals(stdout(none), "");
});

Deno.test("a filter name is validated before any file is opened", async () => {
  const { kg } = await seeded3();
  const outcome = await kg("nodes", "list", "--where", "Bad_Name=x");
  assertEquals(exitCode(outcome), 1);
  assertStringIncludes(message(outcome), "expected a lowercase hyphenated token");
});

Deno.test("one damaged node does not make a space unfindable", async () => {
  const { dir, kg, ids } = await seeded3();
  await Deno.writeTextFile(`${dir}/.kg/nodes/${ids[2]}.md`, "no fence here at all\n");

  const outcome = await kg("nodes", "list", "--where", "kind=decision");
  assertEquals(exitCode(outcome), 0, "reporting is not the same as failing");
  assertEquals(rows(outcome), [ids[0], ids[1]]);
  assert(outcome.kind === "ok" && outcome.notes.join().includes(`skipped ${ids[2]}`));

  // Asked about that node specifically, the tool cannot honour it.
  assertEquals(exitCode(await kg("node", ids[2])), 1);
});

Deno.test("a bare listing still parses nothing, damaged or not", async () => {
  const { dir, kg, ids } = await seeded3();
  await Deno.writeTextFile(`${dir}/.kg/nodes/${ids[2]}.md`, "no fence here at all\n");
  assertEquals(rows(await kg("nodes", "list")).length, 3, "the id is the filename");
});

// ── done when ────────────────────────────────────────────────────────────────
//
// One test per batch, walking the loop that batch exists to close. These back
// the illustrations in `docs/batches/`: if the surface moves, these fail first,
// and whoever fixes them is pointed at the document to correct.

Deno.test("batch 1 — a space, and nodes in it", async () => {
  const { dir, kg } = await space();

  const made = await kg("space", "init");
  assertEquals(exitCode(made), 0);
  assertStringIncludes(stdout(made), "nodes    0");

  const text = "Modules own their schema. A shared one couples every module\n" +
    "to every other module's release.\n";
  const created = await pipe(dir, ["node", "new"], text);
  const id = created.out.trim();
  assertEquals(created.err, "", "the id is the only thing the caller did not know");

  assertEquals(stdout(await kg("node", id)), text, "byte for byte");
  assertEquals(stdout(await kg("nodes", "list")), `${id}\n`);

  const rewritten = await pipe(dir, ["node", id, "write"], "Modules own their schema.\n");
  assertEquals(rewritten.out, "", "a targeted write prints nothing");
  assertStringIncludes(rewritten.err, "replaced");

  assertStringIncludes(stdout(await kg("space")), "nodes    1");
});

Deno.test("batch 2 — nodes carry properties", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");

  const decision = (await pipe(dir, ["node", "new"], "Modules own their schema.\n")).out
    .trim();
  const authority =
    (await pipe(dir, ["node", "new"], "OWASP is authoritative until 2027.\n")).out.trim();
  const second = (await pipe(dir, ["node", "new"], "One full-stack app.\n")).out.trim();

  await kg("node", decision, "set", "kind", "decision");
  await kg("node", authority, "set", "kind", "authority");
  await kg("node", authority, "set", "valid-until", "2027-01-01");
  await kg("node", second, "set", "kind", "decision");

  assertEquals(
    stdout(await kg("node", authority, "--properties")),
    "kind: authority\nvalid-until: 2027-01-01\n",
  );
  // The other half of the node is untouched by any of it.
  assertEquals(
    stdout(await kg("node", authority)),
    "OWASP is authoritative until 2027.\n",
  );

  assertEquals(rows(await kg("nodes", "list", "--where", "kind=decision")), [
    decision,
    second,
  ]);
  assertEquals(rows(await kg("nodes", "list", "--where", "valid-until")), [authority]);
  assertEquals(
    rows(
      await kg("nodes", "list", "--where", "kind=decision", "--without", "valid-until"),
    ),
    [decision, second],
  );
});

// ── the batch 2 corrections ──────────────────────────────────────────────────

Deno.test("the same argument gets the same verdict, whichever half was asked for", async () => {
  const { kg } = await seeded();
  for (const argv of [["node", "zzz"], ["node", "zzz", "--properties"]]) {
    const outcome = await kg(...argv);
    assertEquals(exitCode(outcome), 1, argv.join(" "));
    assertEquals(message(outcome), "not an id: zzz — expected a uuid");
  }
});

Deno.test("reading the content puts the properties on stderr, rendered the same", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "valid-until", "2027-01-01");

  const onStdout = stdout(await kg("node", id, "--properties"));
  const read = await kg("node", id);
  assert(read.kind === "ok");
  assertEquals(
    read.notes.join("\n") + "\n",
    onStdout,
    "byte for byte, only the channel differs",
  );
  assertEquals(read.stdout, "worth keeping\n", "and stdout is still only the content");
});

Deno.test("a node with no properties says nothing on either channel", async () => {
  const { kg, id } = await seeded();
  const read = await kg("node", id);
  assert(read.kind === "ok" && read.notes.length === 0);
  assertEquals(stdout(await kg("node", id, "--properties")), "");
});

Deno.test("set says whether it created or replaced", async () => {
  const { kg, id } = await seeded();
  const first = await kg("node", id, "set", "kind", "decision");
  assert(first.kind === "ok" && first.notes.join() === "set kind");

  const again = await kg("node", id, "set", "kind", "authority");
  assert(again.kind === "ok" && again.notes.join() === "replaced kind");
});

Deno.test("set takes exactly one value", async () => {
  const { kg, id } = await seeded();
  const outcome = await kg("node", id, "set", "title", "one", "two", "three");
  assertEquals(exitCode(outcome), 4);
  assertStringIncludes(message(outcome), "quote it if it contains spaces");
  assertEquals(stdout(await kg("node", id, "--properties")), "", "nothing written");

  // Quoted, it is one value and lands whole.
  await kg("node", id, "set", "title", "one two three");
  assertEquals(stdout(await kg("node", id, "--properties")), "title: one two three\n");
});
