import { assertEquals, assertStringIncludes } from "@std/assert";
import { kg, space } from "./spawn.ts";

Deno.test("batch 15 — one write", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);
  const id = (await kg(dir, ["node", "new", "--with-labels", "Service"])).out.trim();
  const properties = async () =>
    JSON.parse((await kg(dir, ["node", id, "--properties"])).out);

  // 1. A unit of meaning is one act. The counts are leaves, because reporting
  //    a key would say `1` whether the object carried one leaf or forty.
  const wrote = await kg(
    dir,
    ["node", id, "set", "--stdin"],
    JSON.stringify({
      title: "a service",
      config: { host: "api.example.com", port: "8080" },
      tags: ["a", "b"],
    }),
  );
  assertEquals(wrote.code, 0);
  assertStringIncludes(wrote.err, "set 4, replaced 0");

  // 2. A place and a thing. Writing at a path merges deeply, and the report
  //    names the **leaf** — `config.port`, not the `config` it was written to.
  const deep = await kg(
    dir,
    ["node", id, "set", "config", "--stdin"],
    '{"port": "9090"}',
  );
  assertStringIncludes(deep.err, "replaced config.port");
  assertEquals((await properties()).config, { host: "api.example.com", port: "9090" });

  // A scalar at a path is the same act: `set title "x"` was always a path of
  // length one.
  assertEquals((await kg(dir, ["node", id, "set", "config.tls.ca", "here"])).code, 0);
  assertEquals((await properties()).config.tls, { ca: "here" });

  // 3. What the store cannot hold is refused rather than reinterpreted. JSON
  //    types a scalar explicitly, so a number here is a choice.
  for (
    const [body, why] of [
      ['{"released": 2000}', "a property is text, so write it quoted"],
      ['{"live": true}', "a property is text"],
      ['{"status": null}', "removed with `delete`, which is a verb"],
      ['{"labels": ["Decision"]}', "labels is reserved"],
      ['{"id": "x"}', "id is not a property"],
      ['{"config.port": "x"}', "a name is not a path"],
      ['{"config": {"port-x": "y"}}', "not a property name: config.port-x"],
      ['{"config": {}}', "config is an empty map"],
    ] as const
  ) {
    const refused = await kg(dir, ["node", id, "set", "--stdin"], body);
    assertEquals(refused.code, 1, body);
    assertStringIncludes(refused.err, why);
  }

  // 4. A path may not pass through a scalar: replacing a value with a
  //    structure so a path can exist is the guessing batch 4 removed.
  const through = await kg(dir, ["node", id, "set", "title.deep", "x"]);
  assertEquals(through.code, 1);
  assertStringIncludes(through.err, "so a path cannot pass through it");

  // 5. A list is replaced whole, and `add` is how its items move — a list is a
  //    dimension, not a container, so there is nothing inside it to merge into.
  await kg(dir, ["node", id, "set", "--stdin"], '{"tags": ["c"]}');
  assertEquals((await properties()).tags, ["c"]);
  await kg(dir, ["node", id, "add", "tags", "d"]);
  assertEquals((await properties()).tags, ["c", "d"]);

  // 6. `delete` takes several paths, is idempotent, and takes the parent a
  //    removal empties — as the tool already does to a list.
  const gone = await kg(dir, ["node", id, "delete", "config.tls.ca", "tags", "absent"]);
  assertEquals(gone.code, 0);
  assertStringIncludes(gone.err, "deleted config.tls.ca, tags");
  assertStringIncludes(gone.err, "absent was not set");
  assertEquals((await properties()).config, { host: "api.example.com", port: "9090" });

  // 7. A pattern's map key is a path. An absent leaf does not match, and
  //    neither does one landing on a map.
  const match = async (pattern: string) =>
    JSON.parse((await kg(dir, ["nodes", "match", pattern])).out).length;
  assertEquals(await match('(:Service {config.port: "9090"})'), 1);
  assertEquals(await match('(:Service {config.port: "8080"})'), 0);
  assertEquals(await match('(:Service {config.absent.deep: "x"})'), 0);
  assertEquals(await match('(:Service {config: "x"})'), 0);

  // 8. A record is a document of properties, so both scopes say the same
  //    thing — `link <id> unset` beside `node <id> delete` would be two names
  //    for one act, told apart only by scope.
  const other = (await kg(dir, ["node", "new"])).out.trim();
  const link =
    (await kg(dir, ["node", id, "link", "--as", "CITES", "--with-nodes", other]))
      .out.trim();
  await kg(dir, ["link", link, "set", "--stdin"], '{"provenance": {"tool": "fj"}}');
  assertEquals(JSON.parse((await kg(dir, ["link", link])).out).provenance, {
    tool: "fj",
  });
  await kg(dir, ["link", link, "delete", "provenance.tool"]);
  assertEquals(JSON.parse((await kg(dir, ["link", link])).out).provenance, undefined);

  // 9. Three forms and a refusal — two sources for one thing is a question the
  //    command cannot answer for the caller.
  const both = await kg(dir, ["node", id, "set", "title", "x", "--stdin"], "{}");
  assertEquals(both.code, 4);
  assertStringIncludes(both.err, "takes a value, or --stdin, and not both");
  const neither = await kg(dir, ["node", id, "set", "title"]);
  assertEquals(neither.code, 4);
  assertStringIncludes(neither.err, "needs a path and a value, or --stdin");
});
