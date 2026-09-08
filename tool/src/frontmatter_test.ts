import { assertEquals } from "@std/assert";
import * as frontmatter from "./frontmatter.ts";

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
    assertEquals(frontmatter.split(raw), null, JSON.stringify(raw));
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
  assertEquals(frontmatter.read(frontmatter.write(given)), given);
});

Deno.test("a list survives, and is distinguishable from a scalar that looks like one", () => {
  const given = { labels: ["auth", "pattern"], single: ["auth"], looks: "[auth]" };
  const text = frontmatter.write(given);
  assertEquals(frontmatter.read(text), given);
  // The quoting is what carries the distinction, not a convention we invented.
  assertEquals(text, "labels: [auth, pattern]\nlooks: '[auth]'\nsingle: [auth]\n");
});

Deno.test("keys are alphabetical; list elements keep the order they were given", () => {
  const text = frontmatter.write({ zulu: "1", alpha: "2", seq: ["c", "a", "b"] });
  // Quoted, because bare `2` would come back a number.
  assertEquals(text.split("\n")[0], "alpha: '2'");
  assertEquals(frontmatter.read(text)?.seq, ["c", "a", "b"]);
});

Deno.test("an empty block reads as no properties, and writes back as nothing", () => {
  assertEquals(frontmatter.read(""), {});
  assertEquals(frontmatter.read("   \n"), {});
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
    assertEquals(frontmatter.read(text), null, JSON.stringify(text));
  }
});

Deno.test("a name is a lowercase hyphenated token", () => {
  for (const ok of ["kind", "valid-until", "a1", "a-1-b"]) {
    assertEquals(frontmatter.isName(ok), true, ok);
  }
  for (
    const bad of [
      "Kind",
      "valid_until",
      "-lead",
      "trail-",
      "with.dot",
      "",
      "a--b",
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
