import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// Batch 14 removed `find` and the grammar under it. What this batch asked —
// *which nodes match a condition over their properties* — survives in the half
// a pattern can say: a label test and an equality. The comparisons, presence,
// negation and the partition they gave return with the `where` clause, parked
// in `design/parked/condition.md`.

Deno.test("batch 9 — find, in the shape batch 14 left it", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const decided = (await kg(dir, ["node", "new", "--with-labels", "Decision"])).out
    .trim();
  await kg(dir, ["node", decided, "set", "score", "0.9"]);
  const retired = (await kg(dir, ["node", "new", "--with-labels", "Decision"])).out
    .trim();
  await kg(dir, ["node", retired, "set", "retired", "yes"]);
  const other = (await kg(dir, ["node", "new", "--with-labels", "Opinion"])).out.trim();

  const ids = async (pattern: string) =>
    JSON.parse((await kg(dir, ["nodes", "match", pattern])).out)
      .map((node: { id: string }) => node.id);

  // 1. The label test was `"Decision" in labels`; it is the pattern's own
  //    position now, which is what batch 14 meant by `find` folding two
  //    questions that Cypher keeps apart.
  assertEquals(await ids("(:Decision)"), [decided, retired]);
  assertEquals(await ids("(:Opinion)"), [other]);

  // 2. Equality was `title = "x"`; it is the map, and needs no label.
  assertEquals(await ids('({retired: "yes"})'), [retired]);
  assertEquals(await ids('(:Decision {score: "0.9"})'), [decided]);

  // 3. In creation order, as `nodes list` returns — a v7 id sorts to the
  //    millisecond.
  assertEquals(
    (await kg(dir, ["nodes", "list"])).out.split("\n").filter(Boolean).length,
    3,
  );

  // 4. An empty answer is a correct answer: `[]` on stdout, and `0`.
  const none = await kg(dir, ["nodes", "match", '({title: "nothing here"})']);
  assertEquals(none.out, "[]\n");
  assertEquals(none.code, 0);

  // 5. Each refusal names which side to fix, and exits `1` — the argument
  //    broke a rule, so nothing was looked at.
  for (
    const [pattern, message] of [
      ["(:acted-in)", "not a label: acted-in"],
      ["(:Movie {released: 2000})", "a property is text on disk"],
      ["(:Decision)-[:CITES]->", "an arrow needs a node after it"],
    ] as const
  ) {
    const ran = await kg(dir, ["nodes", "match", pattern]);
    assertEquals(ran.code, 1, pattern);
    assertStringIncludes(ran.err, message);
    assertEquals(ran.out, "");
  }

  // 6. Validation precedes lookup: the same refusal, with no space at all.
  const nowhere = await Deno.makeTempDir({ prefix: "kg-nospace-" });
  const refused = await kg(nowhere, ["nodes", "match", "(:acted-in)"]);
  assertEquals(refused.code, 1);
  assertStringIncludes(refused.err, "not a label: acted-in");
  // Well formed, so it gets as far as the space and reports the space.
  const absent = await kg(nowhere, ["nodes", "match", "(:Decision)"]);
  assertEquals(absent.code, 2);
  assertStringIncludes(absent.err, "no space here");
});
