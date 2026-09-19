import { assertEquals } from "@std/assert";
import { kg, space } from "./spawn.ts";

/**
 * Batch 16 — two writers at once.
 *
 * Every assertion here fails without the lock, and fails *quietly*: the files
 * stay valid and every process exits `0`. Measured before the guard existed,
 * ten concurrent `add` left three values of ten.
 *
 * The writes must start together. A sequential loop passes at ten of ten
 * against a tool that loses nine of them, so a test that awaits each call in
 * turn would be a test of nothing.
 */

Deno.test("batch 16 — concurrent updates are cumulative", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new"])).out.trim();
  const properties = async () =>
    JSON.parse(
      (await kg(dir, [
        "node",
        id,
        "--properties",
      ])).out,
    );

  // 1. Ten values into one list, ten processes, started together.
  const values = Array.from({ length: 10 }, (_, i) => `v${i + 1}`);
  const added = await Promise.all(
    values.map((v) => kg(dir, ["node", id, "add", "tags", v])),
  );
  assertEquals(added.filter((r) => r.code !== 0), [], "every add reported success");
  assertEquals(((await properties()).tags as string[]).sort(), values.sort());

  // 2. Ten *different* properties, which is the general lost update: each
  //    writer changes something nobody else touched, and without the lock the
  //    last rename still discards the other nine.
  const names = Array.from({ length: 10 }, (_, i) => `k${i + 1}`);
  await Promise.all(names.map((k) => kg(dir, ["node", id, "set", k, "x"])));
  const after = await properties();
  assertEquals(names.filter((k) => after[k] !== "x"), [], "no property was discarded");

  // 3. A refusal must let go of the file. `add` declines a scalar, and if the
  //    hold survived that refusal the next write would wait for a process that
  //    has already exited.
  assertEquals((await kg(dir, ["node", id, "set", "scalar", "one"])).code, 0);
  assertEquals((await kg(dir, ["node", id, "add", "scalar", "two"])).code, 1);
  assertEquals((await kg(dir, ["node", id, "set", "after", "refusal"])).code, 0);
  assertEquals((await properties()).after, "refusal");
});

Deno.test("batch 16 — a shared endpoint keeps every link", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const target = (await kg(dir, ["node", "new"])).out.trim();
  const sources = await Promise.all(
    Array.from({ length: 8 }, () => kg(dir, ["node", "new"]).then((r) => r.out.trim())),
  );

  // The case that motivated the batch: `link` rewrites a node the caller did
  // not name, so eight sessions attaching to one concept collide on it — and
  // an extraction pass produces shared concepts by design.
  const made = await Promise.all(
    sources.map((from) =>
      kg(dir, ["node", from, "link", "--as", "CITES", "--with-nodes", target])
    ),
  );
  assertEquals(made.filter((r) => r.code !== 0), [], "every link reported success");

  const links = JSON.parse((await kg(dir, ["node", target, "--properties"])).out).links ??
    [];
  assertEquals(links.length, 8, "the target lists every link made to it");

  // And the records agree with the entries, which is the divergence a lost
  // entry produces: the pattern reads the records, a single-node read does not.
  const matched = JSON.parse(
    (await kg(dir, ["nodes", "match", "()-[:CITES]->()"])).out,
  ) as { id: string }[];
  assertEquals(matched.filter((n) => n.id === target).length, 1);
  assertEquals(matched.length, 9, "eight sources and the target they share");
});
