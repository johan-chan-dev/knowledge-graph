import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { kg, space } from "./spawn.ts";

Deno.test("batch 11 — resolution", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const film = (await kg(dir, ["node", "new", "--with-labels", "movie"])).out.trim();
  await kg(dir, ["node", film, "set", "title", "Cloud Atlas"]);
  await kg(dir, ["node", film, "set", "validUntil", "2027-01-01"]);
  const director = (await kg(dir, ["node", "new", "--with-labels", "person"])).out.trim();
  await kg(dir, ["node", director, "set", "name", "Tom Tykwer"]);
  const record = (await kg(dir, [
    "node",
    director,
    "link",
    "--as",
    "directed",
    "--with-nodes",
    film,
    "--with-properties",
    "since=2012",
  ])).out.trim();

  // 1. A key is typed and stored alike — nothing is translated.
  assertStringIncludes(
    await Deno.readTextFile(join(dir, ".kg", "nodes", `${film}.md`)),
    "validUntil: '2027-01-01'",
  );
  assertStringIncludes(
    (await kg(dir, ["node", film, "set", "valid-until", "x"])).err,
    "never a hyphen, which a pattern would have to quote",
  );
  // Batch 12 put a label under the same rule, so it loses its hyphen too.
  assertEquals((await kg(dir, ["node", film, "label", "sci-fi"])).code, 1);
  assertEquals((await kg(dir, ["node", film, "label", "SciFi"])).code, 0);

  // 2, 3. A record is a YAML document, written through the one writer — so
  //       nothing is left half-written behind it.
  assertStringIncludes(
    await Deno.readTextFile(join(dir, ".kg", "links", `${record}.yaml`)),
    "type: directed",
  );
  for await (const entry of Deno.readDir(join(dir, ".kg", "links"))) {
    assertEquals(entry.name.endsWith(".tmp"), false, `${entry.name} left behind`);
  }
  assertEquals(JSON.parse((await kg(dir, ["link", record])).out).since, "2012");

  // 4. The entry on disk points at the record; the command resolves it.
  const stored = await Deno.readTextFile(join(dir, ".kg", "nodes", `${film}.md`));
  assertEquals(stored.includes("neighbour"), false, "nothing is duplicated on disk");
  const shown = JSON.parse((await kg(dir, ["node", film, "--properties"])).out);
  assertEquals(shown.links[0].neighbour, director);
  assertEquals(shown.links[0].direction, "in");
  assertEquals(shown.links[0].since, "2012", "the relation's own property, read in");

  // 5. The two shortcuts are gone; the enrichment is what replaced them.
  assertEquals((await kg(dir, ["node", film, "links"])).code, 4);
  assertEquals((await kg(dir, ["node", film, "backlinks"])).code, 4);

  // 6. The plural is the singular with its ids handed over — argv or stdin,
  //    never both, and never neither.
  const fromArgv = JSON.parse(
    (await kg(dir, ["nodes", "--properties", film, director])).out,
  );
  assertEquals(fromArgv.length, 2);
  assertEquals(fromArgv[0].id, film, "each object carries its id");
  const piped = await kg(dir, ["nodes", "--stdin", "--properties"], `${film}\n`);
  assertEquals(JSON.parse(piped.out)[0].title, "Cloud Atlas");
  assertStringIncludes(
    (await kg(dir, ["nodes", "--stdin", "--properties", film])).err,
    "ids, or --stdin, and not both",
  );
  assertStringIncludes((await kg(dir, ["nodes"])).err, "takes one action");

  // 7. Batch 13 took the format flag away: structured output is JSON, and a
  //    list of ids is lines. Nothing chooses.
  assertEquals(
    JSON.parse((await kg(dir, ["node", film, "--properties"])).out).title,
    "Cloud Atlas",
  );
  assertEquals((await kg(dir, ["node", film, "--properties", "--json"])).code, 4);
  // Batch 14 removed `find`; the equality it stood for here is a pattern.
  assertEquals(
    JSON.parse((await kg(dir, ["nodes", "match", '({title: "Cloud Atlas"})'])).out)
      .map((node: { id: string }) => node.id),
    [film],
  );

  // 8. `labels list` is one word per line, ordered by the slug rather than by
  //    the word — so `Auth` and `auth` stay adjacent instead of landing at
  //    opposite ends of a code-unit sort.
  assertEquals((await kg(dir, ["labels", "list"])).out, "movie\nperson\nSciFi\n");
});
