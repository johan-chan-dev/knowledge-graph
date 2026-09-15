import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 6 — the labels system", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  // 1. A node can be born carrying words.
  const a = (await kg(
    dir,
    ["node", "new", "--with-labels", "auth", "decision", "--stdin"],
    "prose",
  ))
    .out.trim();
  assertEquals(
    JSON.parse((await kg(dir, ["node", a, "--properties"])).out),
    { labels: ["auth", "decision"] },
  );

  // 2. Carrying a word is what creates it, so the vocabulary exists already.
  assertEquals((await kg(dir, ["labels", "list"])).out, "auth\ndecision\n");

  const labelled = await kg(dir, ["node", a, "label", "pattern"]);
  assertEquals(labelled.err.trim(), "labelled 1");
  // Idempotent: a word already carried changes nothing and says nothing.
  assertEquals((await kg(dir, ["node", a, "label", "pattern"])).err, "");

  // 3. The word outlives its last use — the vocabulary records what was said.
  assertEquals(
    (await kg(dir, ["node", a, "unlabel", "decision"])).err.trim(),
    "unlabelled 1",
  );
  assertEquals(
    JSON.parse((await kg(dir, ["node", a, "--properties"])).out),
    { labels: ["auth", "pattern"] },
  );
  // A word outlives its last use, so it is still listed with nothing carrying it.
  assertStringIncludes((await kg(dir, ["labels", "list"])).out, "decision");

  // 4. A description is the label file's body, written from stdin.
  const wrote = await kg(
    dir,
    ["label", "auth", "write", "--stdin"],
    "how a request proves who it is",
  );
  assertStringIncludes(wrote.err, "wrote 30 bytes");
  assertEquals((await kg(dir, ["label", "auth"])).out, "how a request proves who it is");

  // 5. Word, count, first line — alphabetical, so `auth` sits beside `authn`.
  assertEquals((await kg(dir, ["labels", "list"])).out, "auth\ndecision\npattern\n");
  // The description is served by the word you named, not by the listing.
  assertEquals(
    (await kg(dir, ["label", "auth"])).out.trim(),
    "how a request proves who it is",
  );

  // 6. `forget` drops the word from the vocabulary; nodes keep carrying it.
  assertEquals(
    (await kg(dir, ["label", "pattern", "forget"])).err.trim(),
    "forgot pattern",
  );
  assertEquals(
    JSON.parse((await kg(dir, ["node", a, "--properties"])).out),
    { labels: ["auth", "pattern"] },
  );

  // 7. The slot is the tool's now, so the generic verbs refuse it.
  const reserved = await kg(dir, ["node", a, "add", "labels", "x"]);
  assertEquals(reserved.code, 1);
  assertStringIncludes(reserved.err, "labels is reserved");

  // 8. A word two people must reach independently cannot need quoting.
  const bad = await kg(dir, ["node", a, "label", "Auth Pattern"]);
  assertEquals(bad.code, 1);
  assertStringIncludes(bad.err, "not a label: Auth Pattern");
});
