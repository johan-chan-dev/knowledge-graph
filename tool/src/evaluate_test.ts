import { assertEquals } from "@std/assert";
import { matches } from "./evaluate.ts";
import { parse } from "./expression.ts";
import type { Properties } from "./frontmatter.ts";

/** A literal, as properties. Tests are the one place a checked value is
 * written rather than parsed. */
const like = (o: Record<string, unknown>) => o as Properties;

function hits(source: string, properties: Properties): boolean {
  const parsed = parse(source);
  if (parsed.kind !== "parsed") throw new Error(`refused: ${parsed.message}`);
  return matches(parsed.expr, properties);
}

Deno.test("presence is asked of the record, not of the value", () => {
  assertEquals(hits("retired", like({ retired: "no" })), true);
  assertEquals(hits("retired", like({ retired: "" })), true);
  assertEquals(hits("retired", like({})), false);
});

Deno.test("a comparison against an absent property is false, and not flips it", () => {
  assertEquals(hits("score > 0.7", like({})), false);
  assertEquals(hits("not score > 0.7", like({})), true);
});

Deno.test("a query and its negation partition the space", () => {
  const nodes = [like({}), like({ score: "0.9" }), like({ score: "abc" })];
  for (const node of nodes) {
    assertEquals(hits("score > 0.7", node) !== hits("not score > 0.7", node), true);
  }
});

Deno.test("the known asymmetry: not (a > b) is not a <= b", () => {
  assertEquals(hits("score <= 0.7", like({})), false);
  assertEquals(hits("not (score > 0.7)", like({})), true);
  // The idiom for the other question.
  assertEquals(hits("score and not score > 0.7", like({})), false);
  assertEquals(hits("score and not score > 0.7", like({ score: "0.1" })), true);
});

Deno.test("a value that will not take the type simply does not match", () => {
  assertEquals(hits("score > 0.7", like({ score: "abc" })), false);
  assertEquals(hits("score < 0.7", like({ score: "abc" })), false);
});

Deno.test("numbers are not coerced the way JavaScript would", () => {
  assertEquals(hits("score > -1", like({ score: "" })), false);
  assertEquals(hits("score > 0", like({ score: " 1 " })), false);
  assertEquals(hits("released > 2000", like({ released: "2012" })), true);
  assertEquals(hits("released > 2000", like({ released: "1999" })), false);
});

Deno.test("a trailing zero survives, because storage is text", () => {
  assertEquals(hits('version = "1.10"', like({ version: "1.10" })), true);
  assertEquals(hits('version = "1.1"', like({ version: "1.10" })), false);
});

Deno.test("= compares a value and in asks about membership", () => {
  const many = like({ labels: ["auth", "pattern"] });
  const one = like({ labels: "auth" });
  assertEquals(hits('"auth" in labels', many), true);
  assertEquals(hits('"none" in labels', many), false);
  // Each refuses the other's operand, which at read time is no match.
  assertEquals(hits('labels = "auth"', many), false);
  assertEquals(hits('"auth" in labels', one), false);
});

Deno.test("!= is exactly not =", () => {
  for (const node of [like({}), like({ a: "x" }), like({ a: ["x"] })]) {
    assertEquals(hits('a != "x"', node), !hits('a = "x"', node));
  }
});

Deno.test("a list of relations is not a list of values", () => {
  const linked = like({
    links: [{
      type: "cites",
      link: "01a084f0-631b-7bba-a6fe-81d79faedbde",
      direction: "out",
    }],
  });
  assertEquals(hits('"cites" in links', linked), false);
  assertEquals(hits("links", linked), true);
});

Deno.test("and, or and grouping combine as the grammar says", () => {
  const node = like({ labels: ["decision"], score: "0.9" });
  assertEquals(hits('"decision" in labels and score > 0.7', node), true);
  assertEquals(hits('"decision" in labels and retired', node), false);
  assertEquals(hits('retired or "decision" in labels', node), true);
  assertEquals(hits('(retired or archived) and "decision" in labels', node), false);
});
