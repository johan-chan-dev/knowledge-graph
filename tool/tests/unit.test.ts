import { assert, assertEquals } from "@std/assert";
import { isV7 } from "../src/tokens.ts";
import { canonicalise, serialise, split } from "../src/node.ts";
import { exitCode, ok, refused } from "../src/outcome.ts";
import { generate as uuidv7 } from "@std/uuid/v7";

Deno.test("canonical order is alphabetical", () => {
  assertEquals(Object.keys(canonicalise({ zeta: 1, alpha: 2 })), ["alpha", "zeta"]);
});

Deno.test("a node with no attributes still has frontmatter", () => {
  const text = serialise({}, "");
  assertEquals(text, "---\n---\n\n");
  const r = split(text);
  assert(r.kind === "split");
  assertEquals(r.attrs, {});
  assertEquals(r.body, "");
});

Deno.test("split round-trips through serialise", () => {
  const r = split(serialise({ alpha: "one" }, "prose here\n"));
  assert(r.kind === "split");
  assertEquals(r.attrs, { alpha: "one" });
  assertEquals(r.body, "prose here\n");
});

Deno.test("a date-shaped value stays a string", () => {
  const r = split("---\nuntil: 2027-01-01\n---\n\n");
  assert(r.kind === "split");
  assertEquals(r.attrs.until, "2027-01-01");
});

Deno.test("a file without frontmatter is malformed, not empty", () => {
  assertEquals(split("just prose\n").kind, "malformed");
});

Deno.test("exit codes are a projection of the outcome", () => {
  assertEquals(exitCode(ok()), 0);
  assertEquals(exitCode(refused("x")), 1);
});

Deno.test("minted ids are v7 and sort by creation time", async () => {
  const a = uuidv7();
  await new Promise((r) => setTimeout(r, 2));
  const b = uuidv7();
  assert(isV7(a));
  assert(a < b, "v7 orders by its 48-bit timestamp — to the millisecond, not within one");
});
