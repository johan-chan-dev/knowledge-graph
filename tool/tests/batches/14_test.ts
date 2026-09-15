import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 14 — match", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const film = (await kg(dir, ["node", "new", "--with-labels", "Movie"])).out.trim();
  await kg(dir, ["node", film, "set", "title", "Cloud Atlas"]);
  const other = (await kg(dir, ["node", "new", "--with-labels", "Movie"])).out.trim();
  await kg(dir, ["node", other, "set", "title", "The Matrix"]);
  const director = (await kg(dir, ["node", "new", "--with-labels", "Person"])).out.trim();
  await kg(dir, ["node", director, "set", "name", "Tom Tykwer"]);
  const actor = (await kg(dir, ["node", "new", "--with-labels", "Person"])).out.trim();
  await kg(dir, ["node", actor, "set", "name", "Halle Berry"]);

  await kg(dir, ["node", director, "link", "--as", "DIRECTED", "--with-nodes", film]);
  await kg(dir, [
    "node",
    actor,
    "link",
    "--as",
    "ACTED_IN",
    "--with-nodes",
    film,
    "--with-properties",
    "roles=Luisa Rey",
  ]);
  await kg(dir, ["node", actor, "link", "--as", "ACTED_IN", "--with-nodes", other]);

  const ids = async (pattern: string) =>
    JSON.parse((await kg(dir, ["nodes", "match", pattern])).out)
      .map((node: { id: string }) => node.id);

  // 1. A pattern returns **both ends of every relation it names**, which is
  //    what a predicate cannot do: the anchor belongs to the subgraph.
  assertEquals(
    (await ids('(:Person)-[:DIRECTED]->(:Movie {title: "Cloud Atlas"})')).sort(),
    [director, film].sort(),
  );

  // 2. The output is the resolved subgraph, so the edges come back attached
  //    and a projection is the caller's `select` — the `jq` is the `RETURN`.
  const subgraph = JSON.parse(
    (await kg(dir, ["nodes", "match", "(:Person)-[:DIRECTED]->(:Movie)"])).out,
  );
  const person = subgraph.find((node: { id: string }) => node.id === director);
  assertEquals(person.name, "Tom Tykwer");
  assertEquals(person.links[0].neighbour, film);
  assertEquals(person.links[0].type, "DIRECTED");

  // 3. Direction, alternation, and a map on the relationship itself.
  assertEquals(await ids("(:Person)<-[:DIRECTED]-(:Movie)"), []);
  assertEquals((await ids("(:Person)-[:ACTED_IN|DIRECTED]->(:Movie)")).length, 4);
  assertEquals(
    (await ids('(:Person)-[:ACTED_IN {roles: "Luisa Rey"}]->(:Movie)')).sort(),
    [actor, film].sort(),
  );

  // 4. A variable used twice is a join. Halle Berry acted in two films, so
  //    the chain through her closes and the one through the director does not.
  assertEquals(
    (await ids("(a:Movie)<-[:ACTED_IN]-(p)-[:ACTED_IN]->(b:Movie)")).length,
    3,
  );
  assertEquals(await ids("(m:Movie)<-[:DIRECTED]-(p)-[:DIRECTED]->(m)"), []);

  // 5. A relationship binds at most once inside one pattern — openCypher's
  //    default. Without it the second hop would come back along the first
  //    edge and every actor would be their own co-actor.
  assertEquals(await ids("(p:Person)-[:ACTED_IN]->(:Movie)<-[:ACTED_IN]-(:Person)"), []);

  // 6. Several parts, which one chain cannot express once a node has three
  //    edges in the pattern.
  assertEquals(
    (await ids("(p:Person)-[:ACTED_IN]->(:Movie), (p)-[:ACTED_IN]->(:Movie)")).length,
    3,
  );

  // 7. The floor: an unknown word refuses and names its near neighbour rather
  //    than returning nothing, which would be indistinguishable from *none*.
  //    The neighbour is the slug — batch 12 put that mechanism there.
  const wrong = await kg(dir, ["nodes", "match", "(:person)"]);
  assertEquals(wrong.code, 2);
  assertStringIncludes(wrong.err, "no such label: person — did you mean Person?");
  const wrongType = await kg(dir, ["nodes", "match", "(:Person)-[:directed]->(:Movie)"]);
  assertEquals(wrongType.code, 2);
  assertStringIncludes(
    wrongType.err,
    "no such relation type: directed — did you mean DIRECTED?",
  );
  // A word whose fold names nothing simply has no neighbour to offer.
  assertStringIncludes(
    (await kg(dir, ["nodes", "match", "(:Persn)"])).err,
    "no such label: Persn",
  );

  // 8. An empty result is `[]` and exits 0 — a correct answer, not a failure.
  const none = await kg(dir, ["nodes", "match", '(:Movie {title: "nothing here"})']);
  assertEquals(none.out, "[]\n");
  assertEquals(none.code, 0);

  // 9. `find` is gone, the command and the grammar both.
  assertEquals((await kg(dir, ["nodes", "find", "title"])).code, 4);
});
