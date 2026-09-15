import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 13 — one output format", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new"])).out.trim();
  await kg(dir, ["node", id, "set", "title", "Cloud Atlas"]);
  await kg(dir, ["node", id, "set", "released", "2012"]);

  // 1. Structured output is JSON, indented — the only reader the default has
  //    to please is a person, and a program parses either.
  const properties = (await kg(dir, ["node", id, "--properties"])).out;
  assertEquals(
    properties,
    '{\n  "released": "2012",\n  "title": "Cloud Atlas"\n}\n',
    "indented, and the keys sorted as the store sorts them",
  );

  // 2. No flag chooses it. The refusal is the one argv gives any undeclared
  //    flag — nothing special was added for a flag that used to exist.
  for (
    const argv of [
      ["node", id, "--properties", "--json"],
      ["nodes", "list", "--json"],
      ["labels", "list", "--json"],
      ["types", "list", "--json"],
    ]
  ) {
    const refused = await kg(dir, argv);
    assertEquals(refused.code, 4, argv.join(" "));
    assertStringIncludes(refused.err, "unknown flag: --json");
  }

  // 3. A list of identities is still one per line — lines are not YAML, so
  //    nothing about them changed except the flag that offered an array.
  assertEquals((await kg(dir, ["nodes", "list"])).out, `${id}\n`);
  await kg(dir, ["node", id, "label", "Movie"]);
  assertEquals((await kg(dir, ["labels", "list"])).out, "Movie\n");

  // 4. A readout for a person stays prose. Four fixed fields laid out for
  //    someone orienting themselves is a confirmation, not an answer.
  assertStringIncludes((await kg(dir, ["space"])).out, "nodes    1");

  // 5. An empty node prints `{}`, because an output that is JSON except when
  //    it has nothing to say is not JSON. The advisory beside content says
  //    nothing instead, because its reader is a person.
  const bare = (await kg(dir, ["node", "new"])).out.trim();
  assertEquals((await kg(dir, ["node", bare, "--properties"])).out, "{}\n");
  assertEquals((await kg(dir, ["node", bare])).err, "");

  // 6. Content is not structured output: `node <id>` still hands the body
  //    over byte for byte, with the properties rendered the same way on the
  //    other channel.
  const withBody = (await kg(dir, ["node", "new", "--stdin"], "prose\n")).out.trim();
  await kg(dir, ["node", withBody, "set", "kind", "note"]);
  const read = await kg(dir, ["node", withBody]);
  assertEquals(read.out, "prose\n");
  assertEquals(read.err, (await kg(dir, ["node", withBody, "--properties"])).out);

  // 7. A record is structured too, so it prints the same way.
  const other = (await kg(dir, ["node", "new"])).out.trim();
  const link = (await kg(dir, [
    "node",
    id,
    "link",
    "--as",
    "CITES",
    "--with-nodes",
    other,
  ])).out.trim();
  assertEquals(JSON.parse((await kg(dir, ["link", link])).out).type, "CITES");
});
