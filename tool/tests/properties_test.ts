import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, pipe, seeded, stdout } from "./helpers.ts";

// kg node <id> set · unset · --properties

Deno.test("set writes a property and leaves the content alone", async () => {
  const { kg, id } = await seeded();
  const set = await kg("node", id, "set", "kind", "decision");
  assertEquals(exitCode(set), 0);
  assertEquals(stdout(set), "", "a targeted write prints nothing");
  assert(set.kind === "ok" && set.notes.join().includes("set kind"));

  assertEquals(stdout(await kg("node", id, "--properties")), "kind: decision\n");
  assertEquals(stdout(await kg("node", id)), "worth keeping\n");
});

Deno.test("write replaces the content and leaves the properties alone", async () => {
  const { dir, kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");

  await pipe(dir, ["node", id, "write"], "rewritten\n");
  assertEquals(stdout(await kg("node", id)), "rewritten\n");
  // The batch-1 preserve step, observable for the first time.
  assertEquals(stdout(await kg("node", id, "--properties")), "kind: decision\n");
});

Deno.test("properties are stored as given and never retyped", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "valid-until", "2027-01-01");
  await kg("node", id, "set", "count", "42");
  // Under the default YAML schema the first would come back a Date and the
  // second a number, which would be the tool deciding what a field it has
  // never heard of means.
  // Quoted, because bare `42` and `2027-01-01` would come back a number and a
  // date. The quotes are the tool preserving that it was handed text.
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "count: '42'\nvalid-until: '2027-01-01'\n",
  );
});

Deno.test("properties come back in a stable order, whatever order they went in", async () => {
  const { kg, id } = await seeded();
  for (const name of ["zulu", "alpha", "mike"]) await kg("node", id, "set", name, "x");
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "alpha: x\nmike: x\nzulu: x\n",
  );
});

Deno.test("unset removes one, is idempotent, and says which it was", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "other", "keep");

  const first = await kg("node", id, "unset", "kind");
  assert(first.kind === "ok" && first.notes.join().includes("unset kind"));

  const again = await kg("node", id, "unset", "kind");
  assertEquals(exitCode(again), 0, "removing what is absent is the end state asked for");
  assert(again.kind === "ok" && again.notes.join().includes("was not set"));

  assertEquals(stdout(await kg("node", id, "--properties")), "other: keep\n");
});

Deno.test("a node with no properties prints nothing", async () => {
  const { kg, id } = await seeded();
  const outcome = await kg("node", id, "--properties");
  assertEquals(exitCode(outcome), 0);
  assertEquals(stdout(outcome), "");
});

Deno.test("a property name must be a lowercase hyphenated token", async () => {
  const { kg, id } = await seeded();
  for (const name of ["Valid_Until", "valid until", "trailing-", "with.dot"]) {
    const outcome = await kg("node", id, "set", name, "x");
    assertEquals(exitCode(outcome), 1, name);
    assertStringIncludes(message(outcome), "expected a lowercase hyphenated token");
  }
  // A leading dash never reaches validation — the parser reads it as a flag,
  // which is why a name shaped like one is unusable rather than merely refused.
  assertEquals(exitCode(await kg("node", id, "set", "-leading", "x")), 4);
  assertEquals(
    stdout(await kg("node", id, "--properties")),
    "",
    "nothing written",
  );
});

Deno.test("reading the content puts the properties on stderr, rendered the same", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "valid-until", "2027-01-01");

  const onStdout = stdout(await kg("node", id, "--properties"));
  const read = await kg("node", id);
  assert(read.kind === "ok");
  assertEquals(
    read.notes.join("\n") + "\n",
    onStdout,
    "byte for byte, only the channel differs",
  );
  assertEquals(read.stdout, "worth keeping\n", "and stdout is still only the content");
});

Deno.test("a node with no properties says nothing on either channel", async () => {
  const { kg, id } = await seeded();
  const read = await kg("node", id);
  assert(read.kind === "ok" && read.notes.length === 0);
  assertEquals(stdout(await kg("node", id, "--properties")), "");
});

Deno.test("set says whether it created or replaced", async () => {
  const { kg, id } = await seeded();
  const first = await kg("node", id, "set", "kind", "decision");
  assert(first.kind === "ok" && first.notes.join() === "set kind");

  const again = await kg("node", id, "set", "kind", "authority");
  assert(again.kind === "ok" && again.notes.join() === "replaced kind");
});

Deno.test("set takes exactly one value", async () => {
  const { kg, id } = await seeded();
  const outcome = await kg("node", id, "set", "title", "one", "two", "three");
  assertEquals(exitCode(outcome), 4);
  assertStringIncludes(message(outcome), "quote it if it contains spaces");
  assertEquals(stdout(await kg("node", id, "--properties")), "", "nothing written");

  // Quoted, it is one value and lands whole.
  await kg("node", id, "set", "title", "one two three");
  assertEquals(stdout(await kg("node", id, "--properties")), "title: one two three\n");
});
