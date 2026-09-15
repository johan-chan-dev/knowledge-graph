import { assertEquals, assertStringIncludes } from "@std/assert";
import { BINARY, kg, space } from "./spawn.ts";

// This batch added nothing, so there is no loop to close. Its test is the list
// of behaviours that had to stop happening — see `docs/batches/4-stops-guessing.md`.

Deno.test("batch 4 — the tool stops guessing", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new"])).out.trim();

  // 1. A positional value is stored as given, not as a number.
  await kg(dir, ["node", id, "set", "version", "1.10"]);
  await kg(dir, ["node", id, "set", "ticket", "12345678901234567890"]);
  await kg(dir, ["node", id, "set", "octal", "007"]);
  assertEquals(
    JSON.parse((await kg(dir, ["node", id, "--properties"])).out),
    { octal: "007", ticket: "12345678901234567890", version: "1.10" },
  );

  // 2. --properties is refused where it means nothing, not accepted and ignored.
  const misplaced = await kg(dir, ["nodes", "list", "--properties"]);
  assertEquals(misplaced.code, 4);
  // `--properties` now belongs to two commands, and the refusal names both.
  assertStringIncludes(misplaced.err, "belongs to `kg nodes <id>...`");
  assertStringIncludes(misplaced.err, "`kg node <id>`");

  // 3. --where is parked, so it does not exist.
  assertEquals((await kg(dir, ["nodes", "list", "--where", "a=b"])).code, 4);

  // 4. Content is declared. Without --stdin nothing is read, so nothing blocks.
  assertEquals((await kg(dir, ["node", "new"])).code, 0, "an empty node is legal");
  const noSource = await kg(dir, ["node", id, "write"]);
  assertEquals(noSource.code, 4);
  assertStringIncludes(noSource.err, "needs --stdin");

  // 5. A write that cannot land refuses, naming the kind and no path.
  await Deno.chmod(`${dir}/.kg/nodes`, 0o500);
  const denied = await kg(dir, ["node", id, "set", "a", "b"]);
  await Deno.chmod(`${dir}/.kg/nodes`, 0o700);
  assertEquals(denied.code, 1);
  assertStringIncludes(denied.err, "permission denied");
  assertEquals(denied.err.includes("/"), false, "an error names a kind, never a path");
});

Deno.test("a consumer closing the pipe early is not an error", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new", "--stdin"], "x".repeat(200_000))).out.trim();

  // `kg node <id> | head` left an uncaught trace naming a path inside the
  // compiled binary — on stderr, in the shape most likely to be piped.
  const child = new Deno.Command("sh", {
    args: ["-c", `"$0" -C "$1" node "$2" | head -c 3`, BINARY, dir, id],
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const { code, stdout, stderr } = await child.output();
  const decode = new TextDecoder();
  assertEquals(decode.decode(stdout), "xxx");
  assertEquals(decode.decode(stderr), "", "no trace, no path");
  assertEquals(code, 0);
});
