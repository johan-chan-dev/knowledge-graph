import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// The loop that batch closes, against the compiled binary. Its transcript
// is in `docs/batches/3-lists.md` — change one and this fails first.

Deno.test("batch 3 — a property can hold a list", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new", "--stdin"], "Modules own their schema.\n"))
    .out.trim();
  await kg(dir, ["node", id, "set", "title", "a decision"]);

  const added = await kg(dir, [
    "node",
    id,
    "add",
    "sources",
    "github-issue-412",
    "rfc-7396",
  ]);
  assertEquals(added.out, "", "a targeted write prints nothing");
  assertEquals(added.err.trim(), "added 2 to sources");

  // Idempotent, and nothing changed is worth no words.
  assertEquals((await kg(dir, ["node", id, "add", "sources", "rfc-7396"])).err, "");

  // A list and a scalar that merely looks like one stay distinguishable: one
  // is an array, the other a string, and no quoting rule is needed to say so.
  await kg(dir, ["node", id, "set", "looks", "[auth, pattern]"]);
  assertEquals(JSON.parse((await kg(dir, ["node", id, "--properties"])).out), {
    looks: "[auth, pattern]",
    sources: ["github-issue-412", "rfc-7396"],
    title: "a decision",
  });

  // The content is untouched by all of it, and carries the same rendering on
  // stderr.
  const read = await kg(dir, ["node", id]);
  assertEquals(read.out, "Modules own their schema.\n");
  assertEquals(read.err, (await kg(dir, ["node", id, "--properties"])).out);

  assertEquals(
    (await kg(dir, ["node", id, "remove", "sources", "rfc-7396"])).err.trim(),
    "removed 1 from sources",
  );
  assertEquals(
    (await kg(dir, ["node", id, "remove", "sources", "github-issue-412"])).err.trim(),
    "removed 1 from sources, sources is now unset",
  );
  // A property emptied is indistinguishable from one never set.
  assertEquals(JSON.parse((await kg(dir, ["node", id, "--properties"])).out), {
    looks: "[auth, pattern]",
    title: "a decision",
  });

  // The refusals, which are half of what this batch decides.
  const scalar = await kg(dir, ["node", id, "add", "title", "authority"]);
  assertEquals(scalar.code, 1);
  assertStringIncludes(scalar.err, "cannot add to title: not a list");

  const control = await kg(dir, ["node", id, "set", "note", "one\ntwo"]);
  assertEquals(control.code, 1);
  assertStringIncludes(control.err, "a value is a single line");

  const filtered = await kg(dir, ["nodes", "list", "--where", "kind=decision"]);
  assertEquals(filtered.code, 4, "filtering is parked, so the flag is unknown");
});
