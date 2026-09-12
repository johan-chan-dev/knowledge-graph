import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { kg, space } from "./spawn.ts";

// No loop to demonstrate — the loops are the same afterwards. Its transcript is
// a list of things that must stop happening, in `docs/batches/10-one-writer.md`.

Deno.test("batch 10 — one writer for the frontmatter", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  // 1. A label's frontmatter survives a write to its description. It used to be
  //    erased: `label.write` started from an empty string rather than from the
  //    file, so it had nothing to carry.
  await kg(dir, ["node", "new", "--with-labels", "movie"]);
  const label = join(dir, ".kg", "labels", "movie.md");
  await Deno.writeTextFile(label, "---\nrequires:\n  - title\n---\n\nA film.\n");
  await kg(dir, ["label", "movie", "write", "--stdin"], "A film, as imported.\n");
  const after = await Deno.readTextFile(label);
  assertStringIncludes(after, "requires:");
  assertStringIncludes(after, "  - title");
  assertStringIncludes(after, "A film, as imported.");

  // 2. Nothing is left half-written: every write is a temporary file and a
  //    rename, so a directory holds no `.tmp` once a command returns.
  for (const where of [["nodes"], ["labels"], ["links"]]) {
    for await (const entry of Deno.readDir(join(dir, ".kg", ...where))) {
      assertEquals(entry.name.endsWith(".tmp"), false, `${entry.name} left behind`);
    }
  }

  // 3. Block YAML: a list is one element per line, so adding one link adds
  //    lines instead of rewriting one that grows with the node's degree.
  const a = (await kg(dir, ["node", "new"])).out.trim();
  const b = (await kg(dir, ["node", "new"])).out.trim();
  await kg(dir, ["node", a, "link", "--as", "cites", "--with-nodes", b]);
  const file = await Deno.readTextFile(join(dir, ".kg", "nodes", `${a}.md`));
  assertStringIncludes(file, "links:\n  - direction: out\n");
  assertEquals(file.includes("links: ["), false, "no flow-style sequence");

  // 4. `labels list` is three columns, whatever a description's first line
  //    holds. It is the one tabulated output fed by prose rather than by a
  //    checked value.
  await kg(dir, ["label", "tabbed", "write", "--stdin"], "one\ttwo\n\nmore\n");
  const row = (await kg(dir, ["labels", "list"])).out
    .split("\n").find((l) => l.startsWith("tabbed"))!;
  assertEquals(row.split("\t").length, 3);
  assertStringIncludes(row, "one two");

  // 5. A noncharacter is not printable text, and never reaches a file.
  const bad = await kg(dir, ["node", a, "set", "probe", "￿"]);
  assertEquals(bad.code, 1);
  assertStringIncludes(bad.err, "not a property value");
});
