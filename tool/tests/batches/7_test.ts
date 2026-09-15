import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 7 — relations", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const a = (await kg(dir, ["node", "new", "--stdin"], "the decision")).out.trim();
  const b = (await kg(dir, ["node", "new", "--stdin"], "the earlier one")).out.trim();
  const c = (await kg(dir, ["node", "new", "--stdin"], "a source")).out.trim();

  // 1. One command, several targets, one link each.
  const one =
    (await kg(dir, ["node", a, "link", "--as", "supersedes", "--with-nodes", b])).out
      .trim();
  const two = (await kg(dir, [
    "node",
    a,
    "link",
    "--as",
    "cites",
    "--with-nodes",
    b,
    c,
    "--with-properties",
    "since=2026-09-10",
    "why=drift",
  ])).out.trim().split("\n");
  assertEquals(two.length, 2);

  // 2. Both ends carry an entry, so both directions are one node read. Batch 11
  //    removed the two commands that filtered it and resolves the far end in
  //    `--properties` instead, which is what `neighbour` is.
  const entriesOf = async (id: string) =>
    JSON.parse((await kg(dir, ["node", id, "--properties"])).out).links ?? [];
  const aEntries = await entriesOf(a);
  assertEquals(aEntries.length, 3);
  assertEquals(
    aEntries.some((e: { neighbour: string; type: string }) =>
      e.neighbour === b && e.type === "supersedes"
    ),
    true,
  );
  assertEquals(
    (await entriesOf(b)).some((e: { direction: string }) => e.direction === "in"),
    true,
  );
  // c is only ever a target, so every entry it carries points inward.
  assertEquals(
    (await entriesOf(c)).every((e: { direction: string }) => e.direction === "in"),
    true,
  );

  // 3. The record holds type, endpoints and properties; `--with-properties`
  //    applied to every link the command made.
  const record = JSON.parse((await kg(dir, ["link", two[0]!])).out);
  assertEquals(record.type, "cites");
  assertEquals(record.from, a);
  assertEquals(record.since, "2026-09-10");
  assertEquals(JSON.parse((await kg(dir, ["link", two[1]!])).out).why, "drift");

  // 4. A link's properties obey a node's rules, so a list is built with a verb.
  assertStringIncludes(
    (await kg(dir, ["link", one, "add", "roles", "Neo", "Trinity"])).err,
    "added 2 to roles",
  );
  assertEquals(JSON.parse((await kg(dir, ["link", one])).out).roles, ["Neo", "Trinity"]);
  assertStringIncludes(
    (await kg(dir, ["link", one, "remove", "roles", "Neo"])).err,
    "removed 1",
  );

  // 5. The three fields are the link's own data, not properties.
  for (const field of ["type", "from", "to"]) {
    const refused = await kg(dir, ["link", one, "set", field, "x"]);
    assertEquals(refused.code, 1);
    assertStringIncludes(refused.err, `${field} is the link's own data`);
  }

  // 6. The writing door refuses what the reading door would.
  assertStringIncludes(
    (await kg(dir, ["node", a, "link", "--as", "Bad Type", "--with-nodes", b])).err,
    "not a label: Bad Type",
  );
  assertStringIncludes(
    (await kg(dir, ["node", a, "link", "--as", "cites", "--with-nodes", "zzz"])).err,
    "not an id: zzz",
  );
  assertStringIncludes(
    (await kg(dir, [
      "node",
      a,
      "link",
      "--as",
      "cites",
      "--with-nodes",
      b,
      "--with-properties",
      "drift",
    ])).err,
    "expected name=value",
  );
  assertStringIncludes(
    (await kg(dir, ["node", a, "link", "--with-nodes", b])).err,
    "link needs --as",
  );

  // 7. Both ends must exist. A dangling edge is never written.
  const nowhere = "01a08000-0000-7000-8000-000000000000";
  const missing = await kg(dir, [
    "node",
    a,
    "link",
    "--as",
    "cites",
    "--with-nodes",
    nowhere,
  ]);
  assertEquals(missing.code, 2);
  assertStringIncludes(missing.err, `no such node: ${nowhere}`);

  // 8. The slot is the tool's, so the generic verbs refuse it.
  assertStringIncludes(
    (await kg(dir, ["node", a, "add", "links", "x"])).err,
    "links is reserved",
  );

  // 9. Forgetting ends the relation: the record goes and both ends drop it.
  assertStringIncludes((await kg(dir, ["link", one, "forget"])).err, `forgot ${one}`);
  assertEquals((await kg(dir, ["link", one])).code, 2);
  assertEquals((await entriesOf(a)).length, 2);
  assertEquals((await entriesOf(b)).length, 1);
});
