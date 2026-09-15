import { assertEquals, assertStringIncludes } from "@std/assert";
import { message, parsed, pipe, space, stdout } from "./helpers.ts";
import { exitCode } from "../src/outcome.ts";

/**
 * Use cases that cross batches.
 *
 * Every other file under `tests/` is about one subject, and every file under
 * `tests/batches/` is about one batch's loop. **Neither catches a rule that is
 * right on both sides of a seam and wrong across it** — which is where all four
 * of these were found: a path meeting a verb that takes names, a shape landing
 * on a list, a word used in two vocabularies, the output of one command fed to
 * another.
 *
 * They are written as a caller would reach them, not as the implementation is
 * laid out, because a seam is only visible from outside.
 */

Deno.test("a shape landing on a scalar or a list says what it destroyed", async () => {
  const { kg, dir } = await space();
  await kg("space", "init");
  const id = stdout(await kg("node", "new")).trim();

  await kg("node", id, "set", "a", "a scalar");
  const overScalar = await pipe(
    dir,
    ["node", id, "set", "--stdin"],
    '{"a": {"deep": "x"}}',
  );
  assertStringIncludes(overScalar.err, "set 1, replaced 1");

  await kg("node", id, "add", "b", "x", "y");
  const overList = await pipe(
    dir,
    ["node", id, "set", "--stdin"],
    '{"b": {"deep": "x"}}',
  );
  assertStringIncludes(overList.err, "set 1, replaced 1");

  // The count is the point: `set b.deep` alone would report a creation and say
  // nothing about the list that went, which is a value lost in silence.
  assertEquals(parsed(await kg("node", id, "--properties")).b, { deep: "x" });
});

Deno.test("a verb that takes a name says so when handed a path", async () => {
  const { kg } = await space();
  await kg("space", "init");
  const id = stdout(await kg("node", "new")).trim();
  await kg("node", id, "set", "config.tags", "x");

  for (const verb of ["add", "remove"] as const) {
    const refused = await kg("node", id, verb, "config.tags", "c");
    // A refusal rather than a usage error: the argument broke a rule, which is
    // a claim about what was written rather than about the command's form.
    assertEquals(exitCode(refused), 1, verb);
    // Not the hyphen message: a caller who wrote a path is not misspelling a
    // name, and pointing at hyphens would point at the wrong thing.
    assertStringIncludes(message(refused), "takes a name, not a path");
  }
});

Deno.test("the output is not an input, and refuses rather than ignoring", async () => {
  const { kg, dir } = await space();
  await kg("space", "init");
  const id = stdout(await kg("node", "new", "--with-labels", "Service")).trim();
  await kg("node", id, "set", "port", "8080");

  // The obvious pipeline: `--properties` carries `labels`, which has its own
  // verb, so the write refuses instead of dropping it quietly.
  const whole = stdout(await kg("node", id, "--properties"));
  const naive = await pipe(dir, ["node", id, "set", "--stdin"], whole);
  assertEquals(naive.code, 1);
  assertStringIncludes(naive.err, "labels is reserved");

  // And the correction, which is the thing to document rather than to smooth
  // over: the caller drops what belongs to another verb.
  const filtered = JSON.parse(whole);
  delete filtered.labels;
  delete filtered.links;
  filtered.status = "live";
  const again = await pipe(dir, ["node", id, "set", "--stdin"], JSON.stringify(filtered));
  assertEquals(again.code, 0);
  assertEquals(parsed(await kg("node", id, "--properties")).status, "live");
});

Deno.test("a word is a label and a relation type at once, and neither shadows", async () => {
  const { kg } = await space();
  await kg("space", "init");
  const a = stdout(await kg("node", "new", "--with-labels", "Service")).trim();
  const b = stdout(await kg("node", "new")).trim();

  // Separate directories, so the same word in both is two facts, not a clash.
  assertEquals(
    exitCode(await kg("node", a, "link", "--as", "Service", "--with-nodes", b)),
    0,
  );
  assertEquals(stdout(await kg("labels", "list")), "Service\n");
  assertEquals(stdout(await kg("types", "list")), "Service\n");

  // And a pattern tells them apart by position rather than by spelling.
  const nodes = JSON.parse(stdout(await kg("nodes", "match", "(:Service)")));
  assertEquals(nodes.length, 1);
  const linked = JSON.parse(stdout(await kg("nodes", "match", "()-[:Service]->()")));
  assertEquals(linked.length, 2);
});

Deno.test("a reserved name is reserved at the head of a path too", async () => {
  const { kg } = await space();
  await kg("space", "init");
  const id = stdout(await kg("node", "new", "--with-labels", "Service")).trim();

  for (const argv of [["set", "links.x", "y"], ["delete", "labels.x"]] as const) {
    const refused = await kg("node", id, ...argv);
    assertEquals(exitCode(refused), 1, argv.join(" "));
    assertStringIncludes(message(refused), "is reserved");
  }
});

Deno.test("a structure survives every read it passes through", async () => {
  const { kg, dir } = await space();
  await kg("space", "init");
  const a = stdout(await kg("node", "new", "--with-labels", "Service")).trim();
  const b = stdout(await kg("node", "new", "--with-labels", "Service")).trim();
  await pipe(dir, ["node", a, "set", "--stdin"], '{"config": {"tls": {"ca": "here"}}}');
  await kg("node", a, "link", "--as", "CITES", "--with-nodes", b);

  // Through the singular read, the plural one, and a match — three code paths
  // that assemble properties differently and must agree.
  const one = parsed(await kg("node", a, "--properties")).config;
  const many = parsed(await kg("nodes", "--properties", a, b))[0].config;
  const alone = JSON.parse(
    stdout(await kg("nodes", "match", '(:Service {config.tls.ca: "here"})')),
  );
  assertEquals(one, { tls: { ca: "here" } });
  assertEquals(many, { tls: { ca: "here" } });
  assertEquals(alone.length, 1, "one node pattern names one node");
  assertEquals(alone[0].config, { tls: { ca: "here" } });

  // And through a relation, where the pattern returns both ends and the
  // structure has to survive the snapshot the matcher builds rather than the
  // per-node read the other two paths use.
  const pair = JSON.parse(
    stdout(
      await kg(
        "nodes",
        "match",
        '(:Service {config.tls.ca: "here"})-[:CITES]->(:Service)',
      ),
    ),
  );
  assertEquals(pair.length, 2);
  assertEquals(pair.find((n: { id: string }) => n.id === a).config, {
    tls: { ca: "here" },
  });
});
