import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// This batch added nothing either — see `docs/batches/5-the-entry-point.md`.
// Its loop is that the surface has one declaration, and that the names the tool
// holds facts under cannot be shadowed. The declaration itself is tested next
// to it, in `src/surface_test.ts`; this is what a caller sees.

Deno.test("batch 5 — the entry point", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new", "--stdin"], "prose")).out.trim();

  // 1. A reserved name is refused by every verb that would write it, and the
  //    refusal says where the fact actually lives.
  for (
    const argv of [
      ["node", id, "set", "body", "something"],
      ["node", id, "add", "body", "something"],
      ["node", id, "delete", "body"],
      ["node", id, "remove", "body", "something"],
    ]
  ) {
    const refused = await kg(dir, argv);
    assertEquals(refused.code, 1, argv.join(" "));
    assertStringIncludes(refused.err, "body is reserved — it is the node's content");
    assertStringIncludes(refused.err, "written with `write`");
  }
  const created = await kg(dir, ["node", id, "set", "created", "2026-01-01"]);
  assertEquals(created.code, 1);
  assertStringIncludes(created.err, "created is reserved — it is read from the id");

  // A refusal is a refusal, not a repair: nothing was written, and the halves
  // the reserved names stand for are still there.
  assertEquals((await kg(dir, ["node", id])).out, "prose");
  assertEquals((await kg(dir, ["node", id, "--properties"])).out, "{}\n");

  // 2. Reserving a name refuses a write. It does not make a file already
  //    carrying that name unreadable — reading stays as robust as it was.
  await Deno.writeTextFile(
    `${dir}/.kg/nodes/${id}.md`,
    "---\nbody: stale\n---\n\nprose\n",
  );
  const stale = await kg(dir, ["node", id, "--properties"]);
  assertEquals(stale.code, 0, stale.err);
  assertEquals(JSON.parse(stale.out), { body: "stale" });

  // 3. An unknown action is an unknown action, not a property that happens to
  //    take none — which is what it read as before.
  const unknown = await kg(dir, ["node", id, "frobnicate", "x"]);
  assertEquals(unknown.code, 4);
  assertStringIncludes(
    unknown.err,
    "node <id> takes one action: write, set, delete, add, remove",
  );

  // 4. A flag means something on the command that declares it, and nowhere else.
  assertStringIncludes(
    (await kg(dir, ["nodes", "list", "--properties"])).err,
    "--properties belongs to `kg nodes <id>...` and `kg node <id>`",
  );
  assertStringIncludes(
    (await kg(dir, ["node", "new", "--properties"])).err,
    "--properties belongs to `kg nodes <id>...` and `kg node <id>`",
  );

  // 5. Too few arguments is the form; too many is usually the shell.
  const few = await kg(dir, ["node", id, "set", "title"]);
  assertEquals(few.code, 4);
  assertStringIncludes(few.err, "needs a path and a value, or --stdin");
  const many = await kg(dir, ["node", id, "set", "title", "one", "two", "three"]);
  assertEquals(many.code, 4);
  assertStringIncludes(many.err, "quote it if it contains spaces");
});
