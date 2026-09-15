import { isLabel, isName, isValue } from "./frontmatter.ts";
import type { Label, Name, Text } from "./frontmatter.ts";

/**
 * A pattern, parsed. **openCypher's productions, taken whole** — this file is
 * the grammar and nothing else, so every refusal here lands before a file is
 * opened, which is the rule [batch 9](../../docs/batches/9-find.md) set for
 * `find` and the reason it is testable with no store.
 *
 * ```antlr
 * Pattern            : PatternPart ( ',' PatternPart )* ;
 * PatternElement     : NodePattern ( RelationshipPattern NodePattern )*
 *                        | '(' PatternElement ')' ;
 * NodePattern        : '(' Variable? NodeLabels? Properties? ')' ;
 * RelationshipDetail : '[' Variable? RelationshipTypes? Properties? ']' ;
 * RelationshipTypes  : ':' RelTypeName ( '|' ':'? RelTypeName )* ;
 * ```
 *
 * `RangeLiteral` and the path variable are out — `docs/batches/14-match.md`
 * says why, and both are a traversal rather than a shape.
 */

/** Values are text because the store holds text. A map is equality, so what it
 * compares against has to be a value the store could hold. */
export type Map_ = Record<Name, Text>;

export type Node = {
  readonly variable?: Name;
  readonly labels: readonly Label[];
  readonly properties: Map_;
};

export type Direction = "out" | "in" | "either";

export type Relationship = {
  readonly variable?: Name;
  /** Empty means any type — `-[]->` and `-->` both. */
  readonly types: readonly Label[];
  readonly direction: Direction;
  readonly properties: Map_;
};

/** One part: a node, then any number of hops. Several parts are a conjunction
 * over shared variables, which is what a single chain cannot express once a
 * node has three edges in the pattern. */
export type Part = {
  readonly first: Node;
  readonly steps: readonly { readonly via: Relationship; readonly to: Node }[];
};

export type Pattern = readonly Part[];

export type Parsed =
  | { readonly kind: "pattern"; readonly pattern: Pattern }
  | { readonly kind: "refused"; readonly message: string };

const WORD = "a letter or underscore, then letters, digits and underscores — " +
  "never a hyphen, which a pattern would have to quote";

type Token =
  | { kind: "word"; text: string }
  | { kind: "string"; value: string }
  | { kind: "number"; text: string }
  | { kind: "punct"; text: "(" | ")" | "[" | "]" | "{" | "}" | ":" | "," | "|" }
  | { kind: "dash" }
  | { kind: "arrow-right" }
  | { kind: "arrow-left" };

class Refusal extends Error {}
const refuse = (message: string): never => {
  throw new Refusal(message);
};

const PUNCT = "()[]{}:,|";

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i]!;
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (PUNCT.includes(c)) {
      tokens.push({ kind: "punct", text: c as "(" });
      i++;
      continue;
    }
    // `<-` is one token; a lone `<` is nothing this grammar has.
    if (c === "<") {
      if (source[i + 1] !== "-") refuse("stray `<` — an arrow is `<-` or `->`");
      tokens.push({ kind: "arrow-left" });
      i += 2;
      continue;
    }
    if (c === "-") {
      if (source[i + 1] === ">") {
        tokens.push({ kind: "arrow-right" });
        i += 2;
      } else {
        tokens.push({ kind: "dash" });
        i++;
      }
      continue;
    }
    // Both quote characters, so a value containing one can use the other —
    // the same rule `find` followed, and the shell is the outer grammar.
    if (c === '"' || c === "'") {
      const end = source.indexOf(c, i + 1);
      if (end === -1) refuse(`unclosed string — ${c} needs a matching ${c}`);
      const value = source.slice(i + 1, end);
      if (!isValue(value)) refuse(`not a value: ${value}`);
      tokens.push({ kind: "string", value });
      i = end + 1;
      continue;
    }
    // A hyphen may not *start* a word — that position is an arrow — but it may
    // continue one, so `acted-in` lexes whole and is refused by the naming rule
    // rather than by a bracket error three tokens later.
    const rest = source.slice(i);
    const word = /^[^\s()[\]{}:,|<>-][^\s()[\]{}:,|<>]*/.exec(rest)?.[0];
    if (word === undefined || word === "") refuse(`unexpected character: ${c}`);
    tokens.push(
      /^-?\d/.test(word!)
        ? { kind: "number", text: word! }
        : { kind: "word", text: word! },
    );
    i += word!.length;
  }
  return tokens;
}

export function parse(source: string): Parsed {
  try {
    return { kind: "pattern", pattern: parser(tokenize(source)) };
  } catch (error) {
    if (error instanceof Refusal) return { kind: "refused", message: error.message };
    throw error;
  }
}

function parser(tokens: Token[]): Pattern {
  let i = 0;
  const peek = (): Token | undefined => tokens[i];
  const isPunct = (text: string) => {
    const token = peek();
    return token?.kind === "punct" && token.text === text;
  };
  const take = (text: string, why: string) => {
    if (!isPunct(text)) refuse(why);
    i++;
  };

  const word = (what: "label" | "relation type" | "variable" | "key"): string => {
    const token = peek();
    if (token?.kind !== "word") refuse(`expected a ${what}, and the pattern ended`);
    const text = (token as Token & { kind: "word" }).text;
    const ok = what === "key" ? isName(text) : isLabel(text);
    if (!ok) refuse(`not a ${what}: ${text} — ${WORD}`);
    i++;
    return text;
  };

  /** `{ key: "value", … }` — equality, and the value is quoted because the
   * store holds text. A bare numeral is refused rather than accepted and never
   * matched, which is the silence batch 4 removed `--where` for producing. */
  function map(): Map_ {
    const out: Record<string, Text> = {};
    take("{", "expected `{`");
    if (isPunct("}")) {
      i++;
      return out as Map_;
    }
    for (;;) {
      const key = word("key");
      take(":", `expected \`:\` after ${key}`);
      const token = peek();
      if (token?.kind === "number") {
        refuse(
          `not a value: ${token.text} — a property is text on disk, so a map compares against a quoted string`,
        );
      }
      if (token?.kind !== "string") refuse(`expected a quoted value for ${key}`);
      out[key] = (token as Token & { kind: "string" }).value as Text;
      i++;
      if (isPunct(",")) {
        i++;
        continue;
      }
      take("}", "unclosed map — `{` needs a matching `}`");
      return out as Map_;
    }
  }

  function node(): Node {
    take("(", "expected a node — `(`");
    let variable: string | undefined;
    const labels: string[] = [];
    if (peek()?.kind === "word") variable = word("variable");
    while (isPunct(":")) {
      i++;
      labels.push(word("label"));
    }
    const properties = isPunct("{") ? map() : ({} as Map_);
    take(")", "unclosed node — `(` needs a matching `)`");
    return {
      variable: variable as Name | undefined,
      labels: labels as Label[],
      properties,
    };
  }

  /** `[r:A|B {k: "v"}]`, optional in every part — `-->` and `--` are a
   * relationship of any type, which the grammar allows by making the detail
   * itself optional. */
  function detail(): Omit<Relationship, "direction"> {
    if (!isPunct("[")) return { types: [], properties: {} as Map_ };
    i++;
    let variable: string | undefined;
    const types: string[] = [];
    if (peek()?.kind === "word") variable = word("variable");
    if (isPunct(":")) {
      i++;
      types.push(word("relation type"));
      while (isPunct("|")) {
        i++;
        if (isPunct(":")) i++;
        types.push(word("relation type"));
      }
    }
    const properties = isPunct("{") ? map() : ({} as Map_);
    take("]", "unclosed relationship — `[` needs a matching `]`");
    return {
      variable: variable as Name | undefined,
      types: types as Label[],
      properties,
    };
  }

  /** One of the four arrow shapes, each a dash on the left and a dash or an
   * arrowhead on the right. */
  function relationship(): Relationship | undefined {
    const start = i;
    let leftward = false;
    if (peek()?.kind === "arrow-left") {
      leftward = true;
      i++;
    } else if (peek()?.kind === "dash") {
      i++;
    } else {
      return undefined;
    }
    const middle = detail();
    let rightward = false;
    if (peek()?.kind === "arrow-right") {
      rightward = true;
      i++;
    } else if (peek()?.kind === "dash") {
      i++;
    } else {
      i = start;
      refuse("unexpected end of pattern — an arrow needs a node after it");
    }
    if (leftward && rightward) refuse("a relationship points one way — not `<-…->`");
    return {
      ...middle,
      direction: leftward ? "in" : rightward ? "out" : "either",
    };
  }

  function part(): Part {
    const first = node();
    const steps: { via: Relationship; to: Node }[] = [];
    for (;;) {
      const via = relationship();
      if (via === undefined) return { first, steps };
      if (!isPunct("(")) {
        refuse("unexpected end of pattern — an arrow needs a node after it");
      }
      steps.push({ via, to: node() });
    }
  }

  if (tokens.length === 0) refuse("empty pattern");
  const parts: Part[] = [part()];
  while (isPunct(",")) {
    i++;
    parts.push(part());
  }
  if (i < tokens.length) {
    refuse("the pattern is already complete — nothing may follow it");
  }
  return parts;
}
