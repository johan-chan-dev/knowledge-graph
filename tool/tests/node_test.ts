import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, pipe, seeded, space, stdout } from "./helpers.ts";

// kg node new · kg node <id> · kg node <id> write

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

Deno.test("an empty stdin refuses, and says how to mean it", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const result = await pipe(dir, ["node", "new"], "");
  assertEquals(result.code, 1);
  assertStringIncludes(result.err, "did the command before the pipe fail?");
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

Deno.test("a node holding a newline is legal, which is why there is no escape hatch", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");

  // Refusing zero bytes takes no capability with it: the adjacent value works.
  const made = await pipe(dir, ["node", "new"], "\n");
  assertEquals(made.code, 0);
  assertEquals(stdout(await kg("node", made.out.trim())), "\n");
});

Deno.test("the same argument gets the same verdict, whichever half was asked for", async () => {
  const { kg } = await seeded();
  for (const argv of [["node", "zzz"], ["node", "zzz", "--properties"]]) {
    const outcome = await kg(...argv);
    assertEquals(exitCode(outcome), 1, argv.join(" "));
    assertEquals(message(outcome), "not an id: zzz — expected a uuid");
  }
});
