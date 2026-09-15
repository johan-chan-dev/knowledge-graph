import { assertEquals, assertStringIncludes } from "@std/assert";
import * as pattern from "./pattern.ts";

const parsed = (source: string) => {
  const out = pattern.parse(source);
  if (out.kind !== "pattern") throw new Error(`refused: ${out.message}`);
  return out.pattern;
};
/** Names and words are branded, which literals in a test are not. */
const plain = (map: pattern.Map_): Record<string, string> => ({ ...map });
const words = (each: readonly string[]): string[] => [...each];

const why = (source: string): string => {
  const out = pattern.parse(source);
  if (out.kind !== "refused") throw new Error(`parsed: ${source}`);
  return out.message;
};

Deno.test("a node pattern is a variable, labels and a map, all optional", () => {
  const [bare] = parsed("()");
  assertEquals(bare!.first.variable, undefined);
  assertEquals(words(bare!.first.labels), []);
  assertEquals(plain(bare!.first.properties), {});
  assertEquals(bare!.steps, []);
  const [one] = parsed('(m:Movie {title: "Cloud Atlas"})');
  assertEquals(one!.first.variable, "m");
  assertEquals(words(one!.first.labels), ["Movie"]);
  assertEquals(plain(one!.first.properties), { title: "Cloud Atlas" });
  // NodeLabels is a repetition, so several labels are conjunctive.
  assertEquals(words(parsed("(:Person:Director)")[0]!.first.labels), [
    "Person",
    "Director",
  ]);
});

Deno.test("a relationship carries a direction, an alternation and its own map", () => {
  const out = (source: string) => parsed(source)[0]!.steps[0]!.via;
  assertEquals(out("()-[:DIRECTED]->()").direction, "out");
  assertEquals(out("()<-[:DIRECTED]-()").direction, "in");
  assertEquals(out("()-[:DIRECTED]-()").direction, "either");
  assertEquals(words(out("()-[:ACTED_IN|DIRECTED]->()").types), ["ACTED_IN", "DIRECTED"]);
  assertEquals(out('()-[r:ACTED_IN {roles: "Neo"}]->()').variable, "r");
  assertEquals(plain(out('()-[r:ACTED_IN {roles: "Neo"}]->()').properties), {
    roles: "Neo",
  });
  // The detail is optional, so `-->` and `--` are a relationship of any type.
  assertEquals(words(out("()-->()").types), []);
  assertEquals(out("()-->()").direction, "out");
  assertEquals(out("()--()").direction, "either");
});

Deno.test("a chain hops, and a comma starts another part", () => {
  const [chain] = parsed("(a)-[:X]->(b)-[:Y]->(c)");
  assertEquals(chain!.steps.length, 2);
  assertEquals(chain!.steps[1]!.to.variable, "c");
  const parts = parsed("(a)-[:X]->(b), (a)-[:Y]->(c)");
  assertEquals(parts.length, 2);
  assertEquals(parts[1]!.first.variable, "a");
});

Deno.test("a map's key is a path, which a stored key can never be", () => {
  const [one] = parsed('(:Service {config.port: "8080", title: "x"})');
  assertEquals(plain(one!.first.properties), { "config.port": "8080", title: "x" });
  // On a relationship too, since a record is a document of properties.
  assertEquals(
    plain(parsed('()-[:X {provenance.tool: "fj"}]->()')[0]!.steps[0]!.via.properties),
    { "provenance.tool": "fj" },
  );
});

Deno.test("the boundary refuses by naming itself, not the character that stopped", () => {
  // What a reader who knows Cypher writes. Each of these used to answer with
  // the lexical symptom — `unexpected character: >`, or the hyphen rule to
  // someone asking about traversal — which names the wrong side to fix.
  assertStringIncludes(
    why("(m:Movie) where m.released > 2000"),
    "a pattern takes no condition",
  );
  assertStringIncludes(
    why("(m:Movie) WHERE m.released > 2000"),
    "`jq` filter over what this returns",
  );
  assertStringIncludes(why("MATCH (m:Movie) RETURN m"), "the command is the MATCH");
  assertStringIncludes(why("(m:Movie) RETURN m"), "`jq` is the RETURN");
  assertStringIncludes(
    why("(m)-[:DIRECTED*1..3]->(p)"),
    "a variable-length path is not built",
  );

  // And a word that merely contains the letters is not a clause.
  assertStringIncludes(why("(:Wherever"), "unclosed node");
});

Deno.test("every refusal names its cause, and none opens a file", () => {
  assertStringIncludes(why("(:Person)-[:DIRECTED]->"), "an arrow needs a node after it");
  assertStringIncludes(why("(:Person"), "unclosed node");
  assertStringIncludes(why("(:Person)-[:X(:Movie)"), "unclosed relationship");
  assertStringIncludes(why('(:Movie {released: "2000"'), "unclosed map");
  assertStringIncludes(why('(:Movie {title: "Cloud Atlas)'), "unclosed string");
  assertStringIncludes(why("(:acted-in)"), "not a label: acted-in");
  assertStringIncludes(why('(:Movie {valid-until: "x"})'), "not a key: valid-until");
  assertStringIncludes(why("()<-[:X]->()"), "points one way");
  assertStringIncludes(why(""), "empty pattern");
  assertStringIncludes(why("(a) (b)"), "already complete");

  // A bare numeral is refused rather than accepted and never matched: a
  // property is text on disk, so a map compares against a quoted string.
  assertStringIncludes(why("(:Movie {released: 2000})"), "a property is text on disk");
});
