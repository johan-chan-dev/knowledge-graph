import { assert, assertEquals, assertMatch, assertStringIncludes } from "@std/assert";

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
const BINARY = new URL("../build/kg", import.meta.url).pathname;

type Ran = { code: number; out: string; err: string };

async function kg(dir: string, argv: string[], input?: string): Promise<Ran> {
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

async function space(): Promise<string> {
  try {
    await Deno.stat(BINARY);
  } catch {
    throw new Error(`no binary at ${BINARY} — run \`deno task compile\` first`);
  }
  return await Deno.makeTempDir({ prefix: "kg-batch-" });
}

Deno.test("batch 1 — a space, and nodes in it", async () => {
  const dir = await space();

  const made = await kg(dir, ["space", "init"]);
  assertEquals(made.code, 0);
  assertStringIncludes(made.out, "nodes    0");
  assertStringIncludes(made.err, "initialised a git repository at");

  const text = "Modules own their schema. A shared one couples every module to every\n" +
    "other module's release.\n";
  const created = await kg(dir, ["node", "new"], text);
  const id = created.out.trim();
  assertMatch(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assertEquals(created.err, "", "the id is the only thing the caller did not know");

  const read = await kg(dir, ["node", id]);
  assertEquals(read.out, text, "byte for byte");
  assertEquals(read.err, "", "no properties yet, so nothing to say");

  assertEquals((await kg(dir, ["nodes", "list"])).out, `${id}\n`);

  const rewritten = await kg(dir, ["node", id, "write"], "Modules own their schema.\n");
  assertEquals(rewritten.out, "", "a targeted write prints nothing");
  assertStringIncludes(rewritten.err, "replaced 93 bytes");

  assertStringIncludes((await kg(dir, ["space"])).out, "nodes    1");
});

Deno.test("batch 2 — nodes carry properties", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const a = (await kg(dir, ["node", "new"], "Modules own their schema.\n")).out.trim();
  const b = (await kg(dir, ["node", "new"], "OWASP is authoritative until 2027.\n")).out
    .trim();
  const c = (await kg(dir, ["node", "new"], "One full-stack app.\n")).out.trim();

  assertEquals(
    (await kg(dir, ["node", a, "set", "kind", "decision"])).err.trim(),
    "set kind",
  );
  await kg(dir, ["node", b, "set", "kind", "authority"]);
  await kg(dir, ["node", b, "set", "valid-until", "2027-01-01"]);
  await kg(dir, ["node", c, "set", "kind", "decision"]);

  // The same command twice: only the second says the property already existed.
  assertEquals(
    (await kg(dir, ["node", b, "set", "kind", "authority"])).err.trim(),
    "replaced kind",
  );

  const asProperties = await kg(dir, ["node", b, "--properties"]);
  assertEquals(asProperties.out, "kind: authority\nvalid-until: '2027-01-01'\n");
  assertEquals(asProperties.err, "", "the lines are right there to count");

  // Reading the content renders the same lines, on the other channel.
  const asContent = await kg(dir, ["node", b]);
  assertEquals(asContent.out, "OWASP is authoritative until 2027.\n");
  assertEquals(
    asContent.err,
    asProperties.out,
    "byte for byte, only the channel differs",
  );

  const rows = (r: Ran) => r.out.split("\n").filter(Boolean);
  assertEquals(rows(await kg(dir, ["nodes", "list", "--where", "kind=decision"])), [
    a,
    c,
  ]);
  assertEquals(
    rows(await kg(dir, ["nodes", "list", "--where", "valid-until=2027-01-01"])),
    [b],
  );
});

Deno.test("the binary refuses exactly as the source does", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const cases: [string[], number, string][] = [
    [["node", "zzz"], 1, "not an id: zzz"],
    [["node", "zzz", "--properties"], 1, "not an id: zzz"],
    [["node", "00000000-0000-7000-8000-000000000000"], 2, "no such node"],
    [["nodes"], 4, "takes one action"],
  ];
  for (const [argv, code, message] of cases) {
    const ran = await kg(dir, argv);
    assertEquals(ran.code, code, argv.join(" "));
    assertStringIncludes(ran.err, message);
  }

  // Permissions are baked in at compile time — this is the one thing only the
  // binary can prove.
  const empty = await kg(dir, ["node", "new"], "");
  assertEquals(empty.code, 1);
  assertStringIncludes(empty.err, "did the command before the pipe fail?");
  assert(
    !empty.err.includes("PermissionDenied"),
    "compiled with the permissions it needs",
  );
});

Deno.test("batch 3 — a property can hold a list", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new"], "Modules own their schema.\n")).out.trim();
  await kg(dir, ["node", id, "set", "kind", "decision"]);

  const added = await kg(dir, ["node", id, "add", "labels", "auth", "pattern"]);
  assertEquals(added.out, "", "a targeted write prints nothing");
  assertEquals(added.err.trim(), "added 2 to labels");

  // Idempotent, and nothing changed is worth no words.
  assertEquals((await kg(dir, ["node", id, "add", "labels", "auth"])).err, "");

  // YAML, so a list and a scalar that looks like one are distinguishable.
  await kg(dir, ["node", id, "set", "looks", "[auth, pattern]"]);
  assertEquals(
    (await kg(dir, ["node", id, "--properties"])).out,
    "kind: decision\nlabels: [auth, pattern]\nlooks: '[auth, pattern]'\n",
  );

  // The content is untouched by all of it, and carries the same YAML on stderr.
  const read = await kg(dir, ["node", id]);
  assertEquals(read.out, "Modules own their schema.\n");
  assertEquals(read.err, (await kg(dir, ["node", id, "--properties"])).out);

  assertEquals(
    (await kg(dir, ["node", id, "remove", "labels", "auth"])).err.trim(),
    "removed 1 from labels",
  );
  assertEquals(
    (await kg(dir, ["node", id, "remove", "labels", "pattern"])).err.trim(),
    "removed 1 from labels, labels is now unset",
  );
  // A property emptied is indistinguishable from one never set.
  assertEquals(
    (await kg(dir, ["node", id, "--properties"])).out,
    "kind: decision\nlooks: '[auth, pattern]'\n",
  );

  // The refusals, which are half of what this batch decides.
  const scalar = await kg(dir, ["node", id, "add", "kind", "authority"]);
  assertEquals(scalar.code, 1);
  assertStringIncludes(scalar.err, "cannot add to kind: not a list");

  const control = await kg(dir, ["node", id, "set", "note", "one\ntwo"]);
  assertEquals(control.code, 1);
  assertStringIncludes(control.err, "a value is a single line");

  const bare = await kg(dir, ["nodes", "list", "--where", "kind"]);
  assertEquals(bare.code, 4);
  assertStringIncludes(bare.err, "needs a comparison");
});
