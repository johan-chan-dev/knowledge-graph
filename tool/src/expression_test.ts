import { assertEquals, assertStringIncludes } from "@std/assert";
import { type Expr, parse } from "./expression.ts";

/** The tree, for the tests that are about parsing. */
function tree(source: string): Expr {
  const parsed = parse(source);
  if (parsed.kind !== "parsed") throw new Error(`refused: ${parsed.message}`);
  return parsed.expr;
}

/** The reason, for the tests that are about refusing. */
function why(source: string): string {
  const parsed = parse(source);
  if (parsed.kind !== "refused") throw new Error(`parsed: ${source}`);
  return parsed.message;
}

Deno.test("a bare name is a presence test", () => {
  assertEquals(tree("retired"), { kind: "presence", name: "retired" } as Expr);
});

Deno.test("each operator declares its literal", () => {
  assertEquals(tree('title = "Cloud Atlas"'), {
    kind: "compare",
    name: "title",
    op: "=",
    value: "Cloud Atlas",
  } as Expr);
  assertEquals(tree("released > 2000"), {
    kind: "order",
    name: "released",
    op: ">",
    value: 2000,
  } as Expr);
});

Deno.test("a value on the left is a membership test", () => {
  assertEquals(tree('"decision" in labels'), {
    kind: "member",
    value: "decision",
    name: "labels",
  } as Expr);
});

Deno.test("a mismatched literal refuses, and says which side to fix", () => {
  assertStringIncludes(why("title = Matrix"), "not a value: Matrix");
  assertStringIncludes(why("title = Matrix"), 'write "Matrix"');
  assertStringIncludes(why('score > "0.7"'), 'not a number: "0.7"');
  assertStringIncludes(why('score > "0.7"'), "drop the quotes");
});

Deno.test("a bare numeral is a number, and a negative one is not a name", () => {
  assertEquals(tree("score > -0.5"), {
    kind: "order",
    name: "score",
    op: ">",
    value: -0.5,
  } as Expr);
});

Deno.test("a key in an expression is camelCase", () => {
  assertEquals(tree("validUntil"), { kind: "presence", name: "validUntil" } as Expr);
});

Deno.test("not binds tightest, then and, then or", () => {
  assertEquals(tree("not a and b"), {
    kind: "and",
    left: { kind: "not", of: { kind: "presence", name: "a" } },
    right: { kind: "presence", name: "b" },
  } as Expr);
  assertEquals(tree("a or b and c"), {
    kind: "or",
    left: { kind: "presence", name: "a" },
    right: {
      kind: "and",
      left: { kind: "presence", name: "b" },
      right: { kind: "presence", name: "c" },
    },
  } as Expr);
});

Deno.test("a group overrides precedence", () => {
  assertEquals(tree("not (a and b)"), {
    kind: "not",
    of: {
      kind: "and",
      left: { kind: "presence", name: "a" },
      right: { kind: "presence", name: "b" },
    },
  } as Expr);
});

Deno.test("and is left-associative", () => {
  assertEquals(tree("a and b and c"), {
    kind: "and",
    left: {
      kind: "and",
      left: { kind: "presence", name: "a" },
      right: { kind: "presence", name: "b" },
    },
    right: { kind: "presence", name: "c" },
  } as Expr);
});

Deno.test("a keyword is never a name", () => {
  assertStringIncludes(why("retired and"), "unexpected end of expression");
  assertStringIncludes(why("retired and"), "`and` needs something after it");
  assertStringIncludes(why("not not a"), "not takes one prefix");
});

Deno.test("an unclosed group refuses", () => {
  assertStringIncludes(why("(a and b"), "unclosed group");
});

Deno.test("both quote characters are accepted inside", () => {
  assertEquals(tree(`title = 'Smith"s'`), {
    kind: "compare",
    name: "title",
    op: "=",
    value: 'Smith"s',
  } as Expr);
  assertStringIncludes(why(`title = "unclosed`), "unterminated string");
});

Deno.test("what this batch leaves says so, rather than lying", () => {
  assertStringIncludes(why('body ~ "session"'), "not built yet");
  assertStringIncludes(why("created"), "not built yet");
  assertStringIncludes(why('title ~ "x"'), "~ is not built yet");
});

Deno.test("a trailing token is not silently ignored", () => {
  assertStringIncludes(why("a b"), "already complete");
  assertStringIncludes(why(""), "empty expression");
});

Deno.test("a name that could not be written is refused", () => {
  // A capital is the author's to choose now; a hyphen is not, because a pattern
  // would have to quote it — `docs/design/naming.md`.
  assertStringIncludes(why("valid-until"), "not a name: valid-until");
  assertStringIncludes(why("with.dot"), "not a name: with.dot");
});
