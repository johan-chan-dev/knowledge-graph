import { assert, assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, space, stdout } from "./helpers.ts";

// kg space · kg space init

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
