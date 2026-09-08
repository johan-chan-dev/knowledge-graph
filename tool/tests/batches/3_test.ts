import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// The loop that batch closes, against the compiled binary. Its transcript
// is in `docs/batches/3-lists.md` — change one and this fails first.

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
