import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { kg, space } from "./spawn.ts";

Deno.test("batch 12 — the vocabulary", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  // 1. One word rule for keys, labels and relation types: openCypher's
  //    UnescapedSymbolicName, so nothing stored would need quoting in a
  //    pattern. The case is the author's and is kept.
  const film = (await kg(dir, ["node", "new", "--with-labels", "Movie"])).out.trim();
  assertEquals((await kg(dir, ["node", film, "set", "release_date", "2012"])).code, 0);
  assertEquals((await kg(dir, ["node", film, "set", "Title", "Cloud Atlas"])).code, 0);

  // The hyphen is the character that goes, and the refusal says why rather
  // than naming a house style.
  for (const bad of [["set", "valid-until", "x"], ["label", "sci-fi"]]) {
    const refused = await kg(dir, ["node", film, ...bad]);
    assertEquals(refused.code, 1, bad.join(" "));
    assertStringIncludes(
      refused.err,
      "never a hyphen, which a pattern would have to quote",
    );
  }

  // 2. The file is named by a fold of the word, and the word is in its
  //    frontmatter — the fold is lossy, so it cannot be read back out.
  const held = await Deno.readTextFile(join(dir, ".kg", "labels", "movie.md"));
  assertStringIncludes(held, "word: Movie");
  assertEquals((await kg(dir, ["labels", "list"])).out, "Movie\n");

  // 3. A second word folding to the same file is refused, naming the first.
  //    Without the fold a case-insensitive filesystem would merge them
  //    silently, keeping whichever was written last.
  const clash = await kg(dir, ["node", film, "label", "MOVIE"]);
  assertEquals(clash.code, 1);
  assertStringIncludes(clash.err, "it folds to movie.md, which holds Movie");
  assertEquals((await kg(dir, ["labels", "list"])).out, "Movie\n");

  // 4. A relation type is a word with a store, like a label. Using it creates
  //    it, so `types list` is a directory read rather than a scan of every
  //    link record.
  const director = (await kg(dir, ["node", "new", "--with-labels", "Person"])).out.trim();
  assertEquals(
    (await kg(dir, ["node", director, "link", "--as", "DIRECTED", "--with-nodes", film]))
      .code,
    0,
  );
  assertEquals((await kg(dir, ["types", "list"])).out, "DIRECTED\n");
  assertStringIncludes(
    await Deno.readTextFile(join(dir, ".kg", "types", "directed.md")),
    "word: DIRECTED",
  );
  const typeClash = await kg(dir, [
    "node",
    director,
    "link",
    "--as",
    "Directed",
    "--with-nodes",
    film,
  ]);
  assertEquals(typeClash.code, 1);
  assertStringIncludes(typeClash.err, "it folds to directed.md, which holds DIRECTED");

  // A type carries a body, so what the word means here is written where the
  // word lives — what batch 6 gave a label, for the same reason.
  await kg(dir, ["type", "DIRECTED", "write", "--stdin"], "Who took the decisions.\n");
  assertEquals((await kg(dir, ["type", "DIRECTED"])).out, "Who took the decisions.\n");

  // The two directories are separate namespaces: the same word can be both.
  assertEquals((await kg(dir, ["node", film, "label", "DIRECTED"])).code, 0);
  assertEquals((await kg(dir, ["labels", "list"])).out, "DIRECTED\nMovie\nPerson\n");

  // 5. Nothing translates a name. A hand-written label file names no word, so
  //    `ensure` adopts rather than refuses — nothing is inferred from the
  //    filename, the caller supplied the word.
  const byHand = join(dir, ".kg", "labels", "imported.md");
  await Deno.writeTextFile(byHand, "---\nrequires:\n  - title\n---\n\nFrom elsewhere.\n");
  assertEquals((await kg(dir, ["node", film, "label", "Imported"])).code, 0);
  const adopted = await Deno.readTextFile(byHand);
  assertStringIncludes(adopted, "word: Imported");
  assertStringIncludes(adopted, "  - title");
  assertStringIncludes(adopted, "From elsewhere.");
});
