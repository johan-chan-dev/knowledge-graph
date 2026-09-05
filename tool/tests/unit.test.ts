import { assert, assertEquals } from "@std/assert";
import { isV7 } from "../src/tokens.ts";
import { canonicalise, serialise } from "../src/node.ts";
import { exitCode, ok, refused } from "../src/outcome.ts";
import { generate as uuidv7 } from "@std/uuid/v7";

Deno.test("canonical order is alphabetical", () => {
  assertEquals(Object.keys(canonicalise({ zeta: 1, alpha: 2 })), ["alpha", "zeta"]);
});

Deno.test("a new node is frontmatter and nothing else", () => {
  assertEquals(serialise({}, ""), "---\n---\n\n");
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
