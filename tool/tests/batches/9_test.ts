import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 9 — find", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const decided = (await kg(dir, ["node", "new", "--with-labels", "decision"])).out
    .trim();
  await kg(dir, ["node", decided, "set", "score", "0.9"]);
  const retired = (await kg(dir, ["node", "new", "--with-labels", "decision"])).out
    .trim();
  await kg(dir, ["node", retired, "set", "retired", "yes"]);
  await kg(dir, ["node", retired, "set", "score", "0.2"]);
  const other = (await kg(dir, ["node", "new", "--with-labels", "opinion"])).out.trim();

  const ids = async (expression: string) =>
    (await kg(dir, ["nodes", "find", expression])).out.split("\n").filter(Boolean);

  // 1. The transcript the document shows.
  assertEquals(await ids('"decision" in labels'), [decided, retired]);
  assertEquals(await ids("has retired"), [retired]);
  // `is` is the same test, spelled for a name that reads as a state.
  assertEquals(await ids("is retired"), [retired]);
  assertEquals(await ids('"decision" in labels and has no retired'), [decided]);
  assertEquals(await ids('"decision" in labels and score > 0.7'), [decided]);

  // 2. One id per line, in creation order, as `nodes list` returns.
  assertEquals(await ids('"opinion" in labels'), [other]);
  const all = (await kg(dir, ["nodes", "list"])).out;
  assertEquals(all.split("\n").filter(Boolean).length, 3);

  // 3. An empty answer is a correct answer: nothing on stdout, and `0`.
  const none = await kg(dir, ["nodes", "find", 'title = "nothing here"']);
  assertEquals(none.out, "");
  assertEquals(none.code, 0);

  // 4. A query and its negation partition the space. `other` carries no
  //    `score` at all and still falls on exactly one side.
  const over = await ids("score > 0.7");
  const under = await ids("not score > 0.7");
  assertEquals(over.length + under.length, 3);
  assertEquals(over, [decided]);
  assertStringIncludes(under.join(" "), other);

  // 5. A bare name is not a test, and the refusal teaches the form.
  const bare = await kg(dir, ["nodes", "find", "retired"]);
  assertEquals(bare.code, 1);
  assertStringIncludes(bare.err, "retired alone is not a test");
  assertStringIncludes(bare.err, "`has retired`");
  assertStringIncludes(bare.err, "`is retired`");

  // And the auxiliary carries its own negative — `not has` reads as nothing.
  const crossed = await kg(dir, ["nodes", "find", "not has retired"]);
  assertEquals(crossed.code, 1);
  assertStringIncludes(crossed.err, "write `has no retired`");

  // 6. Each refusal names which side to fix, and exits `1` — the argument
  //    broke a rule, so nothing was looked at.
  for (
    const [expression, message] of [
      ["title = Matrix", 'not a value: Matrix — `=` compares text, write "Matrix"'],
      ['score > "0.7"', 'not a number: "0.7" — `>` compares numbers, drop the quotes'],
      [
        "has retired and",
        "unexpected end of expression — `and` needs something after it",
      ],
    ] as const
  ) {
    const ran = await kg(dir, ["nodes", "find", expression]);
    assertEquals(ran.code, 1);
    assertEquals(ran.err.trim(), message);
    assertEquals(ran.out, "");
  }

  // 7. Validation precedes lookup: the same refusal, with no space at all.
  const nowhere = await Deno.makeTempDir({ prefix: "kg-nospace-" });
  const refused = await kg(nowhere, ["nodes", "find", "title = Matrix"]);
  assertEquals(refused.code, 1);
  assertStringIncludes(refused.err, "not a value: Matrix");
  // Well formed, so it gets as far as the space and reports the space.
  const absent = await kg(nowhere, ["nodes", "find", 'title = "Matrix"']);
  assertEquals(absent.code, 2);
  assertStringIncludes(absent.err, "no space here");
});
