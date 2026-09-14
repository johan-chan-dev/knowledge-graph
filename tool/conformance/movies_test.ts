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
      "movie\t38",
      "person\t133",
    ]);

    // Every relationship type, with the counts the cypher declares.
    const types = new Map<string, number>();
    for await (const entry of Deno.readDir(join(dir, ".kg", "links"))) {
      const record = parseYaml(
        await Deno.readTextFile(join(dir, ".kg", "links", entry.name)),
      ) as { type: string };
      types.set(record.type, (types.get(record.type) ?? 0) + 1);
    }
    assertEquals([...types.entries()].sort(), [
      ["acted-in", 172],
      ["directed", 44],
      ["follows", 3],
      ["produced", 15],
      ["reviewed", 9],
      ["wrote", 10],
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
      const shown = (await kg(dir, ["node", id, "--properties"]))
        .split("\n").find((l) => l.startsWith("name: ") || l.startsWith("title: "))
        ?.replace(/^(?:name|title): /, "").replace(/^'|'$/g, "");
      if (shown === undefined) continue;
      const rows = (text: string) =>
        text.trim() === "" ? 0 : text.trim().split("\n").length;
      assertEquals(
        rows(await kg(dir, ["node", id, "links"])),
        outward.get(shown) ?? 0,
        `outgoing links for ${shown}`,
      );
      assertEquals(
        rows(await kg(dir, ["node", id, "backlinks"])),
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
    const shown = async (id: string, name: string) =>
      (await kg(dir, ["node", id, "--properties"]))
        .split("\n").find((l) => l.startsWith(`${name}: `))?.slice(name.length + 2);

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
    assertEquals((await find('"person" in labels')).length, 133);
    const films = await find('"movie" in labels');
    assertEquals(films.length, 38);
    for (const film of films) {
      assertEquals(typeof await shown(film, "title"), "string", `title for ${film}`);
    }

    // Q8 — the film titled Cloud Atlas. 171 reads by hand before this.
    const cloudAtlas = await only('title = "Cloud Atlas"');

    // Q9 — films released between 2010 and 2015, which is that same film.
    assertEquals(await find("released > 2010 and released < 2015"), [cloudAtlas]);

    // Q4, Q5 — people who directed, and acted in, a film released after 2010.
    // `find` chooses the films; the tab-separated backlinks do the rest.
    const byRelation = async (film: string, type: string) => {
      const people: string[] = [];
      for (const row of rows(await kg(dir, ["node", film, "backlinks"]))) {
        const [kind, , person] = row.split("\t");
        if (kind === type) people.push((await shown(person!, "name"))!);
      }
      return people.sort();
    };
    const after2010 = await find("released > 2010");
    assertEquals(after2010, [cloudAtlas]);
    assertEquals(await byRelation(after2010[0]!, "directed"), [
      "Lana Wachowski",
      "Lilly Wachowski",
      "Tom Tykwer",
    ]);
    assertEquals((await byRelation(after2010[0]!, "acted-in")).length, 4);

    // Q10 — directors of Cloud Atlas. Tab-separated output filters by pipe, so
    // `backlinks` needs no type flag of its own.
    assertEquals(await byRelation(cloudAtlas, "directed"), [
      "Lana Wachowski",
      "Lilly Wachowski",
      "Tom Tykwer",
    ]);

    // Q12 — everyone connected to Cloud Atlas, and by what.
    const byType = new Map<string, number>();
    for (const row of rows(await kg(dir, ["node", cloudAtlas, "backlinks"]))) {
      const type = row.split("\t")[0]!;
      byType.set(type, (byType.get(type) ?? 0) + 1);
    }
    assertEquals([...byType.entries()].sort(), [
      ["acted-in", 4],
      ["directed", 3],
      ["produced", 1],
      ["reviewed", 1],
      ["wrote", 1],
    ]);

    // Q11 — Tom Hanks' co-actors. Two hops, and the shape a script has to take
    // while traversal lives in commands rather than in a pattern. Q13, three
    // hops from Kevin Bacon, is the one this deliberately cannot reach.
    const tom = await only('name = "Tom Hanks"');
    const coactors = new Set<string>();
    for (const row of rows(await kg(dir, ["node", tom, "links"]))) {
      const [type, , film] = row.split("\t");
      if (type !== "acted-in") continue;
      for (const back of rows(await kg(dir, ["node", film!, "backlinks"]))) {
        const [t, , person] = back.split("\t");
        if (t === "acted-in" && person !== tom) coactors.add(person!);
      }
    }
    assertEquals(coactors.size, 34);

    await Deno.remove(dir, { recursive: true });
  },
});
