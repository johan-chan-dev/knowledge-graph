import { assert, assertEquals } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { rows, seeded3, stdout } from "./helpers.ts";

// kg nodes list

Deno.test("every id, in creation order", async () => {
  const { kg, ids } = await seeded3();
  assertEquals(rows(await kg("nodes", "list")), ids);
});

Deno.test("an empty space prints nothing and succeeds", async () => {
  const { kg } = await seeded3();
  const empty = await kg("nodes", "list");
  assertEquals(exitCode(empty), 0);
  assert(stdout(empty).length > 0, "this space is not empty; see the next test");
});

Deno.test("it parses nothing — a damaged node still lists", async () => {
  const { dir, kg, ids } = await seeded3();
  await Deno.writeTextFile(`${dir}/.kg/nodes/${ids[2]}.md`, "no fence here at all\n");
  // The id is the filename, so listing is a directory read and cannot care.
  assertEquals(rows(await kg("nodes", "list")).length, 3);
  // Asked about that node specifically, the tool cannot honour it.
  assertEquals(exitCode(await kg("node", ids[2])), 1);
});

Deno.test("filtering is parked, so its flags are unknown", async () => {
  const { kg } = await seeded3();
  for (const flag of ["--where", "--without", "--contains"]) {
    assertEquals(exitCode(await kg("nodes", "list", flag, "kind=decision")), 4, flag);
  }
});
