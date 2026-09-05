import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { init, list, newNode, show } from "../src/commands.ts";
import { findSpace, spaceName } from "../src/space.ts";
import { serialise } from "../src/node.ts";
import { isV7 } from "../src/tokens.ts";

const lines = (o: Awaited<ReturnType<typeof list>>) => o.kind === "ok" ? o.lines : [];
const bare = { meta: false, path: false, json: false };

const absent = async (path: string) => {
  try {
    await Deno.stat(path);
    return false;
  } catch {
    return true;
  }
};

Deno.test("init creates the repository when there is none", async () => {
  const dir = await Deno.makeTempDir();
  assertEquals((await init(dir)).kind, "ok");
  assert((await Deno.stat(join(dir, ".git"))).isDirectory, "a space has a repository");
  assert((await Deno.stat(join(dir, ".kg", "nodes"))).isDirectory);
  assert((await Deno.stat(join(dir, ".kg", "meta", "nodes"))).isDirectory);
  assert(
    await absent(join(dir, ".kg", "space.md")),
    "a space stores no name: it never refers to itself",
  );
  assertEquals((await init(dir)).kind, "refused", "a repository holds one space or none");
});

Deno.test("init from a subdirectory puts the space at the repository root", async () => {
  const dir = await Deno.makeTempDir();
  await new Deno.Command("git", { args: ["init", "--quiet"], cwd: dir, stderr: "null" })
    .output();
  const deep = join(dir, "src", "inner");
  await Deno.mkdir(deep, { recursive: true });

  assertEquals((await init(deep)).kind, "ok");
  assert((await Deno.stat(join(dir, ".kg"))).isDirectory, "at the root");
  assert(await absent(join(deep, ".kg")), "not where init happened to be run");
});

Deno.test("the space name is the repository directory's name, and travels", async () => {
  const parent = await Deno.makeTempDir();
  const dir = join(parent, "architecture-design");
  await Deno.mkdir(dir);
  await init(dir);

  const space = await findSpace(dir);
  assert(space !== null);
  assertEquals(spaceName(space), "architecture-design");

  const moved = join(parent, "renamed-design");
  await Deno.rename(dir, moved);
  const after = await findSpace(moved);
  assert(after !== null);
  assertEquals(spaceName(after), "renamed-design", "the name is the directory");
});

Deno.test("new writes an empty node and prints its path", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const made = await newNode({ meta: false }, dir);
  assert(made.kind === "ok");
  const rel = made.lines[0];
  const id = rel.split("/").pop()!.replace(".md", "");
  assert(isV7(id), `${id} should be a v7 uuid`);
  assertEquals(rel, `.kg/nodes/${id}.md`);

  assertEquals(
    await Deno.readTextFile(join(dir, rel)),
    serialise({}, ""),
    "nothing is initialised beyond the file itself",
  );
});

Deno.test("list enumerates in creation order, ids or paths", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  for (let i = 0; i < 3; i++) {
    await newNode({ meta: false }, dir);
    await new Promise((r) => setTimeout(r, 2));
  }

  const ids = lines(await list(bare, dir));
  assertEquals(ids.length, 3);
  assertEquals([...ids].sort(), ids, "v7 ids sort by creation");

  const paths = lines(await list({ ...bare, path: true }, dir));
  assertEquals(paths[0], `.kg/nodes/${ids[0]}.md`);
});

Deno.test("meta is a separate collection", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  await newNode({ meta: true }, dir);
  assertEquals(lines(await list(bare, dir)).length, 0);
  assertEquals(lines(await list({ ...bare, meta: true }, dir)).length, 1);
});

Deno.test("show returns the node, its path, or absence", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const made = await newNode({ meta: false }, dir);
  assert(made.kind === "ok");
  const id = made.lines[0].split("/").pop()!.replace(".md", "");

  const asPath = await show(id, { path: true, json: false }, dir);
  assert(asPath.kind === "ok");
  assertEquals(asPath.lines[0], made.lines[0]);

  const asJson = await show(id, { path: false, json: true }, dir);
  assert(asJson.kind === "ok");
  const parsed = JSON.parse(asJson.lines[0]);
  assertEquals(parsed.id, id);
  assertEquals(parsed.path, made.lines[0]);
  assert(
    Math.abs(Date.parse(parsed.created) - Date.now()) < 5000,
    "created is read out of the id, not stored",
  );

  const missing = await show("00000000-0000-7000-8000-000000000000", {
    path: false,
    json: false,
  }, dir);
  assertEquals(missing.kind, "absent");
});

Deno.test("commands refuse outside a space", async () => {
  const dir = await Deno.makeTempDir();
  assertEquals((await newNode({ meta: false }, dir)).kind, "refused");
  assertEquals((await list(bare, dir)).kind, "refused");
});
