import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { init, label, list, newNode, show } from "../src/commands.ts";
import { findSpace, spaceName } from "../src/space.ts";
import { serialise, split } from "../src/node.ts";
import { isV7 } from "../src/tokens.ts";

const lines = (o: Awaited<ReturnType<typeof list>>) => o.kind === "ok" ? o.lines : [];
const bare = { labels: [], meta: false, path: false, json: false };

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

const idOf = (o: Awaited<ReturnType<typeof newNode>>) => {
  if (o.kind !== "ok") throw new Error("expected ok");
  return o.lines[0].split("/").pop()!.replace(".md", "");
};

const attrsAt = async (dir: string, rel: string) => {
  const r = split(await Deno.readTextFile(join(dir, rel)));
  if (r.kind !== "split") throw new Error("malformed: " + r.reason);
  return r.attrs;
};

Deno.test("label adds, is idempotent, and preserves the body", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const made = await newNode({ meta: false }, dir);
  const id = idOf(made);
  const rel = (made as { lines: string[] }).lines[0];
  await Deno.writeTextFile(join(dir, rel), serialise({}, "some prose\n"));

  assertEquals((await label(id, ["auth", "pattern"], { remove: false }, dir)).kind, "ok");
  assertEquals((await attrsAt(dir, rel)).labels, ["auth", "pattern"]);

  await label(id, ["auth"], { remove: false }, dir);
  assertEquals(
    (await attrsAt(dir, rel)).labels,
    ["auth", "pattern"],
    "adding a label already present changes nothing",
  );

  const text = await Deno.readTextFile(join(dir, rel));
  assert(text.endsWith("some prose\n"), "the body is untouched");
});

Deno.test("removing the last label removes the key", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const made = await newNode({ meta: false }, dir);
  const id = idOf(made);
  const rel = (made as { lines: string[] }).lines[0];

  await label(id, ["auth"], { remove: false }, dir);
  await label(id, ["auth"], { remove: true }, dir);

  assertEquals(
    await Deno.readTextFile(join(dir, rel)),
    serialise({}, ""),
    "indistinguishable from a node that never had labels",
  );
  await label(id, ["gone"], { remove: true }, dir);
  assertEquals(
    (await attrsAt(dir, rel)).labels,
    undefined,
    "removing an absent label is fine",
  );
});

Deno.test("label refuses a bad name whole, before writing", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const id = idOf(await newNode({ meta: false }, dir));
  const rel = `.kg/nodes/${id}.md`;

  assertEquals(
    (await label(id, ["good", "Bad_Name"], { remove: false }, dir)).kind,
    "refused",
  );
  assertEquals((await attrsAt(dir, rel)).labels, undefined, "not even the valid one");

  assertEquals((await label(id, [], { remove: false }, dir)).kind, "usage");
  assertEquals(
    (await label("00000000-0000-7000-8000-000000000000", ["x"], { remove: false }, dir))
      .kind,
    "absent",
  );
});

Deno.test("list filters by label, ANDed", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const a = idOf(await newNode({ meta: false }, dir));
  const b = idOf(await newNode({ meta: false }, dir));
  await label(a, ["auth", "pattern"], { remove: false }, dir);
  await label(b, ["auth"], { remove: false }, dir);

  assertEquals(lines(await list({ ...bare, labels: ["auth"] }, dir)).length, 2);
  assertEquals(lines(await list({ ...bare, labels: ["auth", "pattern"] }, dir)), [a]);
  assertEquals(lines(await list({ ...bare, labels: ["nope"] }, dir)).length, 0);
  assertEquals(
    lines(await list(bare, dir)).length,
    2,
    "unfiltered still sees everything",
  );
});

Deno.test("a filtered listing skips an unreadable node and names it", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const id = idOf(await newNode({ meta: false }, dir));
  await label(id, ["auth"], { remove: false }, dir);
  await Deno.writeTextFile(join(dir, ".kg", "nodes", "broken.md"), "no frontmatter\n");

  const out = await list({ ...bare, labels: ["auth"] }, dir);
  assert(out.kind === "ok");
  assertEquals(out.lines, [id]);
  assertEquals(out.warnings.length, 1);
  assert(out.warnings[0].includes("broken.md"));

  const plain = await list(bare, dir);
  assert(plain.kind === "ok");
  assertEquals(
    plain.lines.length,
    2,
    "an unfiltered listing parses nothing, so it sees both",
  );
});

Deno.test("json carries labels, and omits the key when there are none", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);
  const id = idOf(await newNode({ meta: false }, dir));

  const bare1 = await show(id, { path: false, json: true }, dir);
  assert(bare1.kind === "ok");
  assertEquals(JSON.parse(bare1.lines[0]).labels, undefined);

  await label(id, ["auth"], { remove: false }, dir);
  const tagged = await show(id, { path: false, json: true }, dir);
  assert(tagged.kind === "ok");
  assertEquals(JSON.parse(tagged.lines[0]).labels, ["auth"]);
});

Deno.test("a string that is not an id is refused, not reported absent", async () => {
  const dir = await Deno.makeTempDir();
  await init(dir);

  const bad = await show("a", { path: false, json: false }, dir);
  assert(bad.kind === "refused");
  assert(bad.message.includes("expected a uuid"), bad.message);

  const labelled = await label("a", ["b"], { remove: false }, dir);
  assert(labelled.kind === "refused", "the same for a command that would write");

  const wellFormed = await show("00000000-0000-7000-8000-000000000000", {
    path: false,
    json: false,
  }, dir);
  assertEquals(
    wellFormed.kind,
    "absent",
    "well formed but not here is a different answer",
  );
});
