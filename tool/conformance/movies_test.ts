import { assertEquals } from "@std/assert";
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
      const record = JSON.parse(
        await Deno.readTextFile(join(dir, ".kg", "links", entry.name)),
      );
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

    // The guide's own questions — see `questions.md`. Four are answerable
    // today; the rest turn on `find`, and the workaround each needs here is
    // what batch 9 removes.
    const scan = async (text: string) => {
      for (const id of (await kg(dir, ["nodes", "list"])).trim().split("\n")) {
        if ((await kg(dir, ["node", id, "--properties"])).includes(text)) return id;
      }
      throw new Error(`no node holding ${text}`);
    };
    const rows = (text: string) => text.trim() === "" ? [] : text.trim().split("\n");

    const cloudAtlas = await scan("Cloud Atlas");

    // Q10 — directors of Cloud Atlas. Tab-separated output filters by pipe, so
    // `backlinks` needs no type flag of its own.
    const directors: string[] = [];
    for (const row of rows(await kg(dir, ["node", cloudAtlas, "backlinks"]))) {
      const [type, , other] = row.split("\t");
      if (type !== "directed") continue;
      const name = (await kg(dir, ["node", other!, "--properties"]))
        .split("\n").find((l) => l.startsWith("name: "))!.slice(6);
      directors.push(name);
    }
    assertEquals(directors.sort(), ["Lana Wachowski", "Lilly Wachowski", "Tom Tykwer"]);

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
    // while traversal lives in commands rather than in a pattern.
    const tom = await scan("Tom Hanks");
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
