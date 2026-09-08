import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

// Not about any batch: that `deno compile` produces the same program.

Deno.test("the binary refuses exactly as the source does", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const cases: [string[], number, string][] = [
    [["node", "zzz"], 1, "not an id: zzz"],
    [["node", "zzz", "--properties"], 1, "not an id: zzz"],
    [["node", "00000000-0000-7000-8000-000000000000"], 2, "no such node"],
    [["nodes"], 4, "takes one action"],
  ];
  for (const [argv, code, message] of cases) {
    const ran = await kg(dir, argv);
    assertEquals(ran.code, code, argv.join(" "));
    assertStringIncludes(ran.err, message);
  }

  // Permissions are baked in at compile time — this is the one thing only the
  // binary can prove.
  const empty = await kg(dir, ["node", "new"], "");
  assertEquals(empty.code, 1);
  assertStringIncludes(empty.err, "did the command before the pipe fail?");
  assert(
    !empty.err.includes("PermissionDenied"),
    "compiled with the permissions it needs",
  );
});
