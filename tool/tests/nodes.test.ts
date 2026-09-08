import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, rows, seeded3, stdout } from "./helpers.ts";

// kg nodes list, and its filters

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
