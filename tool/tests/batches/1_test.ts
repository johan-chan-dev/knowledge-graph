import { assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// The loop that batch closes, against the compiled binary. Its transcript
// is in `docs/batches/1-a-space-with-nodes.md` — change one and this fails first.

Deno.test("batch 1 — a space, and nodes in it", async () => {
  const dir = await space();

  const made = await kg(dir, ["space", "init"]);
  assertEquals(made.code, 0);
  assertStringIncludes(made.out, "nodes    0");
  assertStringIncludes(made.err, "initialised a git repository at");

  const text = "Modules own their schema. A shared one couples every module to every\n" +
    "other module's release.\n";
  const created = await kg(dir, ["node", "new", "--stdin"], text);
  const id = created.out.trim();
  assertMatch(id, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assertEquals(created.err, "", "the id is the only thing the caller did not know");

  const read = await kg(dir, ["node", id]);
  assertEquals(read.out, text, "byte for byte");
  assertEquals(read.err, "", "no properties yet, so nothing to say");

  assertEquals((await kg(dir, ["nodes", "list"])).out, `${id}\n`);

  const rewritten = await kg(
    dir,
    ["node", id, "write", "--stdin"],
    "Modules own their schema.\n",
  );
  assertEquals(rewritten.out, "", "a targeted write prints nothing");
  assertStringIncludes(rewritten.err, "replaced 93 bytes");

  assertStringIncludes((await kg(dir, ["space"])).out, "nodes    1");
});
