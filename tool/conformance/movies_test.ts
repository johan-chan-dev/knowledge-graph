import { assertEquals } from "@std/assert";
import { parse as parseYaml } from "@std/yaml";
import { BINARY } from "../tests/batches/spawn.ts";
import { dirname, fromFileUrl, join } from "@std/path";

/**
 * Someone else's graph, held by this tool.
 *
 * Neo4j's movies example was built with no knowledge of this design, which is
 * what makes it worth importing: it catches assumptions a fixture written here
 * would share. The borrowed half of the model — labels classify, properties
 * hold data, relationships carry a type and properties — is what this checks.
 * Bodies and the material lifecycle are this tool's own and are not here.
 */
const here = dirname(fromFileUrl(import.meta.url));

async function sh(dir: string, script: string): Promise<number> {
  const child = new Deno.Command("bash", {
    args: [script],
    cwd: dir,
    env: { PATH: `${dirname(BINARY)}:${Deno.env.get("PATH") ?? ""}` },
    stdout: "null",
    stderr: "null",
  }).spawn();
  return (await child.output()).code;
}

type Entry = { type: string; direction: string; neighbour: string };

/** A node's relations, as `--properties` now hands them back: the stored entry
 * plus the far end and the relation's own properties, resolved on the way out.
 * Batch 11 removed `links` and `backlinks`; this is what replaced them. */
async function entries(dir: string, id: string): Promise<Entry[]> {
  const parsed = JSON.parse(await kg(dir, ["node", id, "--properties"])) as {
    links?: Entry[];
  };
  return parsed.links ?? [];
}

async function kg(dir: string, argv: string[]): Promise<string> {
  const child = new Deno.Command(BINARY, {
    args: ["-C", dir, ...argv],
    stdin: "null",
    stdout: "piped",
    stderr: "null",
  }).spawn();
  return new TextDecoder().decode((await child.output()).stdout);
}

Deno.test({
  name: "the movies graph imports, and nothing is lost",
  // 800 processes: slow, and the point is the surface rather than the speed.
  sanitizeResources: false,
  async fn() {
    const dir = await Deno.makeTempDir({ prefix: "kg-movies-" });
    await new Deno.Command("git", { args: ["init", "-q", dir], stdout: "null" }).output();
    // Setting up the fixture is the test's job; the script only adds material.
    await kg(dir, ["space", "init"]);
    assertEquals(await sh(dir, join(here, "import.sh")), 0, "the import ran");

    // Neo4j's own figures for this dataset.
    assertEquals((await kg(dir, ["nodes", "list"])).trim().split("\n").length, 171);
    assertEquals((await kg(dir, ["labels", "list"])).trim().split("\n").sort(), [
      "Movie",
      "Person",
    ]);
    // The counts the listing used to carry are asserted below, through `find` —
    // a question of its own, at the cost that command's name declares.

    // Every relationship type, with the counts the cypher declares.
    const types = new Map<string, number>();
    for await (const entry of Deno.readDir(join(dir, ".kg", "links"))) {
      const record = parseYaml(
        await Deno.readTextFile(join(dir, ".kg", "links", entry.name)),
      ) as { type: string };
      types.set(record.type, (types.get(record.type) ?? 0) + 1);
    }
    assertEquals([...types.entries()].sort(), [
      ["ACTED_IN", 172],
      ["DIRECTED", 44],
      ["FOLLOWS", 3],
      ["PRODUCED", 15],
      ["REVIEWED", 9],
      ["WROTE", 10],
    ]);

    // Traversal, asked of the tool and computed from the source. Counting
    // files says the import landed; this says the graph answers.
    const cypher = await Deno.readTextFile(join(here, "movies.cypher"));
    const named = new Map<string, string>();
    for (const m of cypher.matchAll(/^MERGE \((\w+):\w+ \{(.*?)\}\)/gm)) {
      const shown =
        /(?:title|name)\s*:\s*'((?:[^'\\]|\\.)*)'|(?:title|name)\s*:\s*"([^"]*)"/
          .exec(m[2]!);
      if (shown !== null) {
        named.set(m[1]!, (shown[1] ?? shown[2]!).replaceAll("\\'", "'"));
      }
    }
    const outward = new Map<string, number>();
    const inward = new Map<string, number>();
    for (const m of cypher.matchAll(/^MERGE \((\w+)\)-\[:\w+.*?\]->\((\w+)\)/gm)) {
      const from = named.get(m[1]!) ?? m[1]!, to = named.get(m[2]!) ?? m[2]!;
      outward.set(from, (outward.get(from) ?? 0) + 1);
      inward.set(to, (inward.get(to) ?? 0) + 1);
    }

    let checked = 0;
    for (const id of (await kg(dir, ["nodes", "list"])).trim().split("\n")) {
      const properties = JSON.parse(await kg(dir, ["node", id, "--properties"]));
      const shown: string | undefined = properties.name ?? properties.title;
      if (shown === undefined) continue;
      const carried = await entries(dir, id);
      assertEquals(
        carried.filter((e) => e.direction === "out").length,
        outward.get(shown) ?? 0,
        `outgoing links for ${shown}`,
      );
      assertEquals(
        carried.filter((e) => e.direction === "in").length,
        inward.get(shown) ?? 0,
        `incoming links for ${shown}`,
      );
      checked++;
    }
    assertEquals(checked, 171, "every node was asked");

    // The guide's own questions — see `questions.md`. Nine of the thirteen
    // turn on `find` and nothing else.
    const rows = (text: string) => text.trim() === "" ? [] : text.trim().split("\n");
    const find = async (expression: string) =>
      rows(await kg(dir, ["nodes", "find", expression]));
    const only = async (expression: string) => {
      const found = await find(expression);
      assertEquals(found.length, 1, expression);
      return found[0]!;
    };
    const shown = async (id: string, name: string): Promise<string | undefined> =>
      JSON.parse(await kg(dir, ["node", id, "--properties"]))[name];

    // Q1, Q2 and Q3 are one selection asked for three ways, and the difference
    // between them is the whole of what `find` returns: the ids are the answer,
    // a loop turns them into titles, a pipe reduces them to a number.
    const recent = await find("released > 2000");
    assertEquals(recent.length, 12);
    const titles: string[] = [];
    for (const id of recent) titles.push((await shown(id, "title"))!);
    assertEquals(titles.sort(), [
      "Charlie Wilson's War",
      "Cloud Atlas",
      "Frost/Nixon",
      "Ninja Assassin",
      "RescueDawn",
      "Something's Gotta Give",
      "Speed Racer",
      "The Da Vinci Code",
      "The Matrix Reloaded",
      "The Matrix Revolutions",
      "The Polar Express",
      "V for Vendetta",
    ]);

    // Q6, Q7 — every person, and every film with its title and released year.
    // The projection is the caller's loop; `find` selects and stops there.
    assertEquals((await find('"Person" in labels')).length, 133);
    const films = await find('"Movie" in labels');
    assertEquals(films.length, 38);
    for (const film of films) {
      assertEquals(typeof await shown(film, "title"), "string", `title for ${film}`);
    }

    // Q8 — the film titled Cloud Atlas. 171 reads by hand before this.
    const cloudAtlas = await only('title = "Cloud Atlas"');

    // Q9 — films released between 2010 and 2015, which is that same film.
    assertEquals(await find("released > 2010 and released < 2015"), [cloudAtlas]);

    // Q4, Q5 — people who directed, and acted in, a film released after 2010.
    // `find` chooses the films; the enriched entries carry the far end.
    const byRelation = async (film: string, type: string) => {
      const people: string[] = [];
      for (const entry of await entries(dir, film)) {
        if (entry.type === type && entry.direction === "in") {
          people.push((await shown(entry.neighbour, "name"))!);
        }
      }
      return people.sort();
    };
    const after2010 = await find("released > 2010");
    assertEquals(after2010, [cloudAtlas]);
    assertEquals(await byRelation(after2010[0]!, "DIRECTED"), [
      "Lana Wachowski",
      "Lilly Wachowski",
      "Tom Tykwer",
    ]);
    assertEquals((await byRelation(after2010[0]!, "ACTED_IN")).length, 4);

    // Q10 — directors of Cloud Atlas, which is this batch's own validation:
    // one `--properties`, a filter on type and direction, then the names.
    assertEquals(await byRelation(cloudAtlas, "DIRECTED"), [
      "Lana Wachowski",
      "Lilly Wachowski",
      "Tom Tykwer",
    ]);

    // The same answer through the commands a caller actually types — this is
    // batch 11's own validation, and what proves removing `backlinks` cost
    // nothing: the enriched entries, filtered, then resolved in one call.
    const carried = JSON.parse(
      await kg(dir, ["node", cloudAtlas, "--properties"]),
    ) as { links: { type: string; direction: string; neighbour: string }[] };
    const directors = carried.links
      .filter((e) => e.type === "DIRECTED" && e.direction === "in")
      .map((e) => e.neighbour);
    const resolvedNames = JSON.parse(
      await kg(dir, ["nodes", "--properties", ...directors]),
    ) as { name: string }[];
    assertEquals(resolvedNames.map((each) => each.name).sort(), [
      "Lana Wachowski",
      "Lilly Wachowski",
      "Tom Tykwer",
    ]);

    // Q12 — everyone connected to Cloud Atlas, and by what.
    const byType = new Map<string, number>();
    for (const entry of await entries(dir, cloudAtlas)) {
      if (entry.direction !== "in") continue;
      byType.set(entry.type, (byType.get(entry.type) ?? 0) + 1);
    }
    assertEquals([...byType.entries()].sort(), [
      ["ACTED_IN", 4],
      ["DIRECTED", 3],
      ["PRODUCED", 1],
      ["REVIEWED", 1],
      ["WROTE", 1],
    ]);

    // Q11 — Tom Hanks' co-actors. Two hops, one call per node: the entries of
    // his films carry the actors, so each hop is a read rather than a join.
    // Q13, three hops from Kevin Bacon, is the one this deliberately cannot
    // reach.
    const tom = await only('name = "Tom Hanks"');
    const coactors = new Set<string>();
    for (const acted of await entries(dir, tom)) {
      if (acted.type !== "ACTED_IN" || acted.direction !== "out") continue;
      for (const other of await entries(dir, acted.neighbour)) {
        if (other.type === "ACTED_IN" && other.neighbour !== tom) {
          coactors.add(other.neighbour);
        }
      }
    }
    assertEquals(coactors.size, 34);

    await Deno.remove(dir, { recursive: true });
  },
});
