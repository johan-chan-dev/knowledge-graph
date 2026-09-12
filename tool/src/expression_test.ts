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

Deno.test("presence is spelled, and a bare name is not a test", () => {
  assertEquals(tree("has retired"), { kind: "presence", name: "retired" } as Expr);
  assertStringIncludes(why("retired"), "retired alone is not a test");
  assertStringIncludes(why("retired"), "write `has retired`");
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

Deno.test("a hyphen inside a name is not arithmetic", () => {
  assertEquals(
    tree("has valid-until"),
    { kind: "presence", name: "valid-until" } as Expr,
  );
});

Deno.test("not binds tightest, then and, then or", () => {
  assertEquals(tree("not has a and has b"), {
    kind: "and",
    left: { kind: "not", of: { kind: "presence", name: "a" } },
    right: { kind: "presence", name: "b" },
  } as Expr);
  assertEquals(tree("has a or has b and has c"), {
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
  assertEquals(tree("not (has a and has b)"), {
    kind: "not",
    of: {
      kind: "and",
      left: { kind: "presence", name: "a" },
      right: { kind: "presence", name: "b" },
    },
  } as Expr);
});

Deno.test("and is left-associative", () => {
  assertEquals(tree("has a and has b and has c"), {
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
  assertStringIncludes(why("has retired and"), "unexpected end of expression");
  assertStringIncludes(why("has retired and"), "`and` needs something after it");
  assertStringIncludes(why("not not has a"), "not takes one prefix");
});

Deno.test("an unclosed group refuses", () => {
  assertStringIncludes(why("(has a and has b"), "unclosed group");
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
  assertStringIncludes(why("has created"), "not built yet");
  assertStringIncludes(why('title ~ "x"'), "~ is not built yet");
});

Deno.test("a trailing token is not silently ignored", () => {
  assertStringIncludes(why("has a has b"), "already complete");
  assertStringIncludes(why(""), "empty expression");
});

Deno.test("a name that could not be written is refused", () => {
  assertStringIncludes(why("has Title"), "not a name: Title");
});
