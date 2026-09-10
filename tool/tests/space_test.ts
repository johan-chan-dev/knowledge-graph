import { assert, assertEquals, assertMatch, assertStringIncludes } from "@std/assert";
import { exitCode } from "../src/outcome.ts";
import { message, rows, seeded, space, stdout } from "./helpers.ts";

// kg space · kg space init

Deno.test("outside a space, every command says so and exits 2", async () => {
  const { kg } = await space();
  for (const argv of [["space"], ["nodes", "list"]]) {
    const outcome = await kg(...argv);
    assertEquals(exitCode(outcome), 2, argv.join(" "));
    assertEquals(message(outcome), "no space here — run: kg space init");
  }
});

Deno.test("init creates the repository it needs, and says so on stderr", async () => {
  const { kg } = await space();
  const outcome = await kg("space", "init");
  assertEquals(exitCode(outcome), 0);
  assert(outcome.kind === "ok");
  assertStringIncludes(outcome.notes.join("\n"), "initialised a git repository at");
  assertStringIncludes(stdout(outcome), "branch   (no commit yet)");
  assertStringIncludes(stdout(outcome), "nodes    0");
});

Deno.test("a repository holds one space or none", async () => {
  const { kg } = await space();
  await kg("space", "init");
  const again = await kg("space", "init");
  assertEquals(exitCode(again), 1);
  assertStringIncludes(message(again), "this repository already has a space at");
});

Deno.test("the readout names the directory the space sits in", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");
  const outcome = await kg("space");
  // The space stores no name of its own — it is read off the directory.
  assertMatch(stdout(outcome), new RegExp(`^${dir.split("/").pop()}\n`));
});

Deno.test("init guards the space against line-ending conversion", async () => {
  const { dir, kg } = await space();
  await kg("space", "init");

  // The tool writes LF and is the only writer; git must not convert either way.
  assertEquals(
    await Deno.readTextFile(`${dir}/.kg/.gitattributes`).then((t) =>
      t.split("\n").filter((l) => l && !l.startsWith("#"))
    ),
    ["* -text"],
  );

  // And a nearer rule beats the enclosing project's, so the guard holds inside
  // a repository with its own opinion.
  await Deno.writeTextFile(`${dir}/.gitattributes`, "* text=auto eol=crlf\n");
  const attr = await new Deno.Command("git", {
    args: ["-C", dir, "check-attr", "text", "--", ".kg/nodes/x.md"],
    stdout: "piped",
  }).output();
  assertStringIncludes(new TextDecoder().decode(attr.stdout), "text: unset");
});

Deno.test("a node with CRLF does not parse, rather than half-parsing", async () => {
  const { dir, kg } = await seeded();
  const id = rows(await kg("nodes", "list"))[0] ?? "";
  await Deno.writeTextFile(
    `${dir}/.kg/nodes/${id}.md`,
    "---\r\nkind: decision\r\n---\r\n\r\none\r\ntwo\r\n",
  );
  // Tolerating it produced a stray \r on read and mixed line endings on write.
  assertEquals(exitCode(await kg("node", id)), 1);
});
