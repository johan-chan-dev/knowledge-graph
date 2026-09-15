import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, parsed, pipe, seeded, stdout } from "./helpers.ts";

// kg node <id> set · unset · --properties

Deno.test("set writes a property and leaves the content alone", async () => {
  const { kg, id } = await seeded();
  const set = await kg("node", id, "set", "kind", "decision");
  assertEquals(exitCode(set), 0);
  assertEquals(stdout(set), "", "a targeted write prints nothing");
  assert(set.kind === "ok" && set.notes.join().includes("set kind"));

  assertEquals(parsed(await kg("node", id, "--properties")), { kind: "decision" });
  assertEquals(stdout(await kg("node", id)), "worth keeping\n");
});

Deno.test("write replaces the content and leaves the properties alone", async () => {
  const { dir, kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");

  await pipe(dir, ["node", id, "write"], "rewritten\n");
  assertEquals(stdout(await kg("node", id)), "rewritten\n");
  // The batch-1 preserve step, observable for the first time.
  assertEquals(parsed(await kg("node", id, "--properties")), { kind: "decision" });
});

Deno.test("properties are stored as given and never retyped", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "validUntil", "2027-01-01");
  await kg("node", id, "set", "count", "42");
  // Strings on the way out, both of them. Under the store's YAML schema the
  // first would come back a Date and the second a number, which would be the
  // tool deciding what a field it has never heard of means — so what this pins
  // is that neither was retyped, and JSON says it without needing a quote rule.
  assertEquals(
    parsed(await kg("node", id, "--properties")),
    { count: "42", validUntil: "2027-01-01" },
  );
});

Deno.test("properties come back in a stable order, whatever order they went in", async () => {
  const { kg, id } = await seeded();
  for (const name of ["zulu", "alpha", "mike"]) await kg("node", id, "set", name, "x");
  assertEquals(
    parsed(await kg("node", id, "--properties")),
    { alpha: "x", mike: "x", zulu: "x" },
  );
});

Deno.test("delete removes them, is idempotent, and says which it was", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "other", "keep");

  const first = await kg("node", id, "delete", "kind");
  assert(first.kind === "ok" && first.notes.join().includes("deleted kind"));

  const again = await kg("node", id, "delete", "kind");
  assertEquals(exitCode(again), 0, "removing what is absent is the end state asked for");
  assert(again.kind === "ok" && again.notes.join().includes("was not set"));

  assertEquals(parsed(await kg("node", id, "--properties")), { other: "keep" });
});

Deno.test("a node with no properties prints an empty object", async () => {
  const { kg, id } = await seeded();
  const outcome = await kg("node", id, "--properties");
  assertEquals(exitCode(outcome), 0);
  // `{}` rather than nothing: an output that is JSON except when it has
  // nothing to say is not JSON, and a caller would have to special-case the
  // one shape that cannot be parsed.
  assertEquals(stdout(outcome), "{}\n");
});

Deno.test("a property name is a word, and a hyphen is what it may not be", async () => {
  const { kg, id } = await seeded();
  for (const name of ["valid until", "valid-until", "2fa"]) {
    const outcome = await kg("node", id, "set", name, "x");
    assertEquals(exitCode(outcome), 1, name);
    assertStringIncludes(
      message(outcome),
      "never a hyphen, which a pattern would have to quote",
    );
  }
  // A dot is not a name here and never was — it is a path now, which is the
  // one position batch 15 gave it. So `with.dot` writes a leaf rather than
  // refusing, and the key it writes carries no dot at all.
  assertEquals(exitCode(await kg("node", id, "set", "with.dot", "x")), 0);
  assertEquals(parsed(await kg("node", id, "--properties")).with, { dot: "x" });
  assertEquals(exitCode(await kg("node", id, "delete", "with.dot")), 0);
  // A capital and an underscore are the author's to choose: one rule for keys,
  // labels and relation types, and it is openCypher's.
  for (const name of ["Valid_Until", "release_date", "Title"]) {
    assertEquals(exitCode(await kg("node", id, "set", name, "x")), 0, name);
    assertEquals(exitCode(await kg("node", id, "delete", name)), 0, name);
  }
  // A single dash is not a flag here: the tool's only one is `-C`, which is
  // global and taken before a command is matched. So `-leading` reaches
  // validation and is told what is wrong with it, and a negative value works.
  const dashed = await kg("node", id, "set", "-leading", "x");
  assertEquals(exitCode(dashed), 1);
  assertStringIncludes(message(dashed), "not a property name: -leading");
  assertEquals(exitCode(await kg("node", id, "set", "score", "-1.5")), 0);
  assertEquals(exitCode(await kg("node", id, "delete", "score")), 0);
  assertEquals(parsed(await kg("node", id, "--properties")), {}, "nothing written");
});

Deno.test("reading the content puts the properties on stderr, rendered the same", async () => {
  const { kg, id } = await seeded();
  await kg("node", id, "set", "kind", "decision");
  await kg("node", id, "set", "validUntil", "2027-01-01");

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

Deno.test("a node with no properties says nothing on the advisory channel", async () => {
  const { kg, id } = await seeded();
  // stdout and the advisory part company here, because their readers do: the
  // answer is JSON and must parse; the advisory is for a person, and one with
  // nothing to advise is noise.
  const read = await kg("node", id);
  assert(read.kind === "ok" && read.notes.length === 0);
  assertEquals(stdout(await kg("node", id, "--properties")), "{}\n");
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
  assertEquals(parsed(await kg("node", id, "--properties")), {}, "nothing written");

  // Quoted, it is one value and lands whole.
  await kg("node", id, "set", "title", "one two three");
  assertEquals(parsed(await kg("node", id, "--properties")), { title: "one two three" });
});
