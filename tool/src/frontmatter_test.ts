import { assertEquals, assertStringIncludes } from "@std/assert";
import * as frontmatter from "./frontmatter.ts";

/** `read` returns a verdict now. These tests are about the properties, so this
 * unwraps it and fails loudly if the block did not read at all. */
function props(text: string): frontmatter.Properties {
  const read = frontmatter.read(text);
  if (read.kind !== "properties") throw new Error(`unreadable: ${read.reason}`);
  return read.properties;
}

/** A literal, as properties. Tests are the one place a checked value is
 * written rather than parsed, so the assertion lives here and nowhere else. */
function like(o: Record<string, string | string[]>): frontmatter.Properties {
  return o as frontmatter.Properties;
}

const name = (s: string) => s as frontmatter.Name;

/** The reason, for the tests that are about refusing. */
function why(text: string): string | undefined {
  const read = frontmatter.read(text);
  return read.kind === "unreadable" ? read.reason : undefined;
}

// What a node file is made of — reachable with a string, expensive to reach
// through a filesystem and a command line.

Deno.test("split separates the two halves, and the blank line belongs to neither", () => {
  assertEquals(frontmatter.split("---\nkind: decision\n---\n\nbody\n"), {
    frontmatter: "kind: decision\n",
    content: "body\n",
  });
  assertEquals(frontmatter.split("---\n---\n\n"), { frontmatter: "", content: "" });
  // Content that genuinely starts blank keeps its own blank line.
  assertEquals(frontmatter.split("---\n---\n\n\nbody\n")?.content, "\nbody\n");
});

Deno.test("split refuses anything without a fence, CRLF included", () => {
  for (
    const raw of [
      "no fence at all\n",
      "---\nkind: decision\n",
      "---\r\nkind: decision\r\n---\r\n\r\nbody\r\n",
    ]
  ) {
    assertEquals(frontmatter.split(raw), undefined, JSON.stringify(raw));
  }
});

Deno.test("a value round-trips as the text it was given", () => {
  const given = {
    plain: "hello world",
    numbery: "42",
    boolish: "true",
    datey: "2027-01-01",
    commaed: "Smith, J.; Jones, A.",
    bracketed: "[auth, pattern]",
    urly: "https://example.org/p?ref=x&id=2",
    empty: "",
  };
  assertEquals(props(frontmatter.write(given)), given);
});

Deno.test("a list survives, and is distinguishable from a scalar that looks like one", () => {
  const given = { labels: ["auth", "pattern"], single: ["auth"], looks: "[auth]" };
  const text = frontmatter.write(given);
  assertEquals(props(text), given);
  // The quoting is what carries the distinction, not a convention we invented.
  assertEquals(
    text,
    "labels:\n  - auth\n  - pattern\nlooks: '[auth]'\nsingle:\n  - auth\n",
  );
});

Deno.test("keys are alphabetical; list elements keep the order they were given", () => {
  const text = frontmatter.write(like({ zulu: "1", alpha: "2", seq: ["c", "a", "b"] }));
  // Quoted, because bare `2` would come back a number.
  assertEquals(text.split("\n")[0], "alpha: '2'");
  assertEquals(props(text)[name("seq")], like({ x: ["c", "a", "b"] })[name("x")]);
});

Deno.test("an empty block reads as no properties, and writes back as nothing", () => {
  assertEquals(props(""), {});
  assertEquals(props("   \n"), {});
  assertEquals(frontmatter.write({}), "");
});

Deno.test("what is neither a value nor a list does not read at all", () => {
  for (
    const text of [
      "nested:\n  a: 1\n",
      "listy:\n  - a: 1\n",
      "scalar\n",
      "- a\n- b\n",
      "unbalanced: [\n",
    ]
  ) {
    assertEquals(why(text) !== undefined, true, JSON.stringify(text));
  }
});

Deno.test("a label word is kebab, because the word names a file", () => {
  for (const ok of ["movie", "acted-in", "a-1-b", "2fa"]) {
    assertEquals(frontmatter.isLabel(ok), true, ok);
  }
  for (const bad of ["actedIn", "Movie", "acted_in", "with space"]) {
    assertEquals(frontmatter.isLabel(bad), false, bad);
  }
});

Deno.test("a key is camelCase, beginning lowercase", () => {
  for (const ok of ["title", "validUntil", "a1", "v2Index", "headSha"]) {
    assertEquals(frontmatter.isName(ok), true, ok);
  }
  // It begins lowercase so the first character is never a case decision, and a
  // hyphen belongs to a label word rather than to a key.
  for (
    const bad of [
      "Title",
      "valid-until",
      "valid_until",
      "2fa",
      "-lead",
      "with.dot",
      "",
      "with space",
    ]
  ) {
    assertEquals(frontmatter.isName(bad), false, bad);
  }
});

Deno.test("a value is a single line of printable text", () => {
  for (const ok of ["hello world", "a=b&c;d", "", "  padded  ", "héllo"]) {
    assertEquals(frontmatter.isValue(ok), true, JSON.stringify(ok));
  }
  for (const bad of ["one\ntwo", "one\rtwo", "one\ttwo", "\u0000", "\u007F"]) {
    assertEquals(frontmatter.isValue(bad), false, JSON.stringify(bad));
  }
});

// The rule the tool's absence model depends on: a YAML null is recognised and
// refused, never stored. Without this, a key could hold an absence and `in`
// would stop agreeing with a lookup — which is the JavaScript conflation the
// design declines. See `docs/design/absence.md`.
Deno.test("an absence is never a value: YAML null is refused, empty string is not", () => {
  for (const text of ["kind:\n", "kind: null\n", "kind: ~\n", "kind: [~]\n"]) {
    assertEquals(why(text) !== undefined, true, JSON.stringify(text));
  }
  assertEquals(props('kind: ""\n'), like({ kind: "" }));
  // Every spelling the YAML 1.2 core schema resolves to null, refused by
  // testing the parsed value rather than the text — so a spelling nobody
  // thought of cannot get through.
  for (const text of ["kind: Null\n", "kind: NULL\n"]) {
    assertEquals(why(text) !== undefined, true, JSON.stringify(text));
  }
  // A quoted null is a value, and stays one.
  assertEquals(props('kind: "null"\n'), like({ kind: "null" }));
});

// `remove` deletes a key rather than leaving an empty list, so present-but-empty
// is a state the tool never writes and must not read back either.
Deno.test("an empty list is an absence, not a value", () => {
  assertStringIncludes(why("labels: []\n") ?? "", "labels is an empty list");
  assertEquals(props("labels: [auth]\n"), like({ labels: ["auth"] }));
});

// `docs/design/boundaries.md`: what the tool cannot write, it must not read —
// otherwise a hand-written name loads, displays, and can never be unset.
Deno.test("the reading door enforces the writing door's vocabulary", () => {
  assertStringIncludes(why("Title: x\n") ?? "", "Title is not a property name");
  // A key is camelCase, so kebab is not what the tool could have written —
  // `docs/design/naming.md`.
  assertStringIncludes(
    why("valid-until: x\n") ?? "",
    "valid-until is not a property name",
  );
  assertEquals(props("validUntil: x\n"), like({ validUntil: "x" }));

  // A control character reaches a value only as a YAML escape. Written raw it
  // is not YAML at all, and the parser refuses it first — also correct, and a
  // different refusal worth pinning so neither path silently changes.
  assertStringIncludes(
    why('a: "x\\x01y"\n') ?? "",
    "a holds a value with a control character",
  );
  assertStringIncludes(why('a: ["ok", "x\\x01y"]\n') ?? "", "control character");
  assertStringIncludes(
    why(`a: "x${String.fromCharCode(1)}y"\n`) ?? "",
    "the block is not YAML",
  );

  // Reserved names are a different case and stay readable: `body` is a name the
  // tool can represent and declines to write, not one it cannot hold.
  assertEquals(props("body: stale\n"), like({ body: "stale" }));
});
