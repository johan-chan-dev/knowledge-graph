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

    await Deno.remove(dir, { recursive: true });
  },
});
