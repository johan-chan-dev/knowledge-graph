import { isName, isValue } from "./frontmatter.ts";
import type { Name, Text } from "./frontmatter.ts";

/**
 * The grammar `kg nodes find` takes, parsed before a file is opened.
 *
 * Parsing is separated from evaluation because *validation precedes lookup* is
 * half of what this batch decides: every refusal below is reachable with no
 * space, no node and no filesystem at all, which is what makes the rule
 * testable as a property of a function rather than a claim about a transcript.
 *
 * `docs/batches/9-find.md` is the argument. What it leaves out is left out
 * here: `~`, the reserved operands, ordering the results.
 */

/** A bare word is always a name or a keyword; a quoted string is always a
 * value. Nothing depends on where a token appears, so there are no contextual
 * keywords and `not` needs no lookahead to tell a negation from a property
 * called `not`. */
const KEYWORDS = ["and", "or", "not", "in", "has"] as const;

/** Operands the design names and this batch does not build. They would
 * otherwise lex as ordinary names and test the presence of a property that can
 * never exist — always false, for a reason the caller could not see. */
const LEFT: Record<string, string> = {
  body: "the node's content",
  created: "the node's minting time",
};

export type Order = ">" | "<" | ">=" | "<=";

export type Expr =
  | { readonly kind: "presence"; readonly name: Name }
  | {
    readonly kind: "compare";
    readonly name: Name;
    readonly op: "=" | "!=";
    readonly value: Text;
  }
  | {
    readonly kind: "order";
    readonly name: Name;
    readonly op: Order;
    readonly value: number;
  }
  | { readonly kind: "member"; readonly value: Text; readonly name: Name }
  | { readonly kind: "not"; readonly of: Expr }
  | { readonly kind: "and"; readonly left: Expr; readonly right: Expr }
  | { readonly kind: "or"; readonly left: Expr; readonly right: Expr };

export type Parsed =
  | { readonly kind: "parsed"; readonly expr: Expr }
  | { readonly kind: "refused"; readonly message: string };

type Token =
  | { kind: "name"; text: string }
  | { kind: "keyword"; text: (typeof KEYWORDS)[number] }
  | { kind: "string"; text: string; value: string }
  | { kind: "number"; text: string; value: number }
  | { kind: "op"; text: string }
  | { kind: "("; text: string }
  | { kind: ")"; text: string };

const NUMERAL = /^-?\d+(\.\d+)?$/;
const OPS = ["!=", ">=", "<=", "=", ">", "<", "~"];

class Refusal extends Error {}

/** A function declaration, not a `const` arrow: TypeScript narrows after a
 * `never`-returning call only when the callee is a declared name, and without
 * that every refusal below leaves the token typed as possibly undefined. */
function refuse(message: string): never {
  throw new Refusal(message);
}

/** A token beginning `-` followed by a digit is a numeral, and property names
 * begin `[a-z0-9]`, so `-0.5` cannot be read as a name and `valid-until`
 * cannot be read as arithmetic. */
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const c = source[i]!;
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      tokens.push({ kind: c, text: c });
      i++;
      continue;
    }

    // Both quote characters, so a value containing one can use the other.
    if (c === '"' || c === "'") {
      const end = source.indexOf(c, i + 1);
      if (end === -1) refuse(`unterminated string: ${source.slice(i)} — no closing ${c}`);
      const value = source.slice(i + 1, end);
      if (!isValue(value)) {
        refuse(`not a value: ${c}${value}${c} — it holds a control character`);
      }
      tokens.push({ kind: "string", text: source.slice(i, end + 1), value });
      i = end + 1;
      continue;
    }

    const op = OPS.find((o) => source.startsWith(o, i));
    if (op !== undefined) {
      tokens.push({ kind: "op", text: op });
      i += op.length;
      continue;
    }

    let j = i;
    while (
      j < source.length && !" \t()".includes(source[j]!) &&
      !OPS.some((o) => source.startsWith(o, j))
    ) j++;
    const word = source.slice(i, j);
    if (word === "") refuse(`unexpected character: ${c}`);
    i = j;

    if (NUMERAL.test(word)) {
      tokens.push({ kind: "number", text: word, value: Number(word) });
      continue;
    }
    if ((KEYWORDS as readonly string[]).includes(word)) {
      tokens.push({ kind: "keyword", text: word as (typeof KEYWORDS)[number] });
      continue;
    }
    // Not checked here: an unquoted `Matrix` is a broken name in subject
    // position and a missing pair of quotes in operand position, and only the
    // parser knows which. Refusing at the lexer would give both the same
    // message, and the wrong one half the time.
    tokens.push({ kind: "name", text: word });
  }
  return tokens;
}

/** `not` binds tightest, then `and`, then `or`, both left-associative. */
function parser(tokens: Token[]) {
  let i = 0;
  const peek = () => tokens[i];
  function ended(after: string): never {
    refuse(`unexpected end of expression — \`${after}\` needs something after it`);
  }

  const name = (token: Token & { kind: "name" }): Name => {
    const left = LEFT[token.text];
    if (left !== undefined) {
      refuse(`${token.text} is not built yet — it is ${left}, not a property`);
    }
    // `labels` and `links` are reserved against *writing* and are exactly what
    // an expression asks about, so the write door's refusal does not apply.
    if (!isName(token.text)) {
      refuse(
        `not a name: ${token.text} — a property name is a lowercase hyphenated token`,
      );
    }
    return token.text as Name;
  };

  function or(): Expr {
    let left = and();
    while (peek()?.kind === "keyword" && peek()!.text === "or") {
      i++;
      if (i >= tokens.length) ended("or");
      left = { kind: "or", left, right: and() };
    }
    return left;
  }

  function and(): Expr {
    let left = unary();
    while (peek()?.kind === "keyword" && peek()!.text === "and") {
      i++;
      if (i >= tokens.length) ended("and");
      left = { kind: "and", left, right: unary() };
    }
    return left;
  }

  /** One optional prefix, not a chain. `not not x` is not a double negation
   * and has no use; allowing it would make `not not` ambiguous against a
   * property named `not` for nothing. */
  function unary(): Expr {
    if (peek()?.kind === "keyword" && peek()!.text === "not") {
      i++;
      if (i >= tokens.length) ended("not");
      const token = peek()!;
      if (token.kind === "keyword" && token.text === "not") {
        refuse("not takes one prefix — `not not` is not a double negation");
      }
      return { kind: "not", of: primary() };
    }
    return primary();
  }

  function primary(): Expr {
    const token = peek();
    if (token === undefined) refuse("empty expression");

    if (token.kind === "(") {
      i++;
      if (i >= tokens.length) ended("(");
      const inner = or();
      if (peek()?.kind !== ")") refuse("unclosed group — `(` needs a matching `)`");
      i++;
      return inner;
    }

    // A quoted string may only begin a membership test: `"auth" in labels`.
    if (token.kind === "string") {
      i++;
      const next = peek();
      if (next === undefined || next.kind !== "keyword" || next.text !== "in") {
        refuse(
          `${token.text} is a value — a test begins with a name, or with \`${token.text} in\``,
        );
      }
      i++;
      const target = peek();
      if (target === undefined) ended("in");
      if (target.kind !== "name") {
        refuse(`not a name: ${target.text} — \`in\` asks about a property`);
      }
      i++;
      return { kind: "member", value: token.value as Text, name: name(target) };
    }

    // Presence is spelled, never implied by a bare name. The same token would
    // otherwise be a proposition here and an operand three words later —
    // `score and not score > 0.7` — with only the parser's lookahead to say
    // which, and nothing on the line to show it.
    if (token.kind === "keyword" && token.text === "has") {
      i++;
      const subject = peek();
      if (subject === undefined) ended("has");
      if (subject.kind !== "name") {
        refuse(`not a name: ${subject.text} — \`has\` asks about a property`);
      }
      const held = name(subject);
      i++;
      return { kind: "presence", name: held };
    }

    if (token.kind !== "name") {
      refuse(`unexpected ${token.text} — a test begins with \`has\`, a name or a value`);
    }
    const subject = name(token);
    i++;

    const op = peek();
    if (op === undefined || op.kind !== "op") {
      refuse(
        `${subject} alone is not a test — write \`has ${subject}\` to ask whether it is there`,
      );
    }
    i++;
    if (op.text === "~") {
      refuse("~ is not built yet — it searches prose, which this batch leaves");
    }

    const literal = peek();
    if (literal === undefined) ended(op.text);

    // Each operator declares its literal, and a mismatch refuses here rather
    // than being inferred from what the value happens to look like.
    if (op.text === "=" || op.text === "!=") {
      if (literal.kind !== "string") {
        refuse(
          `not a value: ${literal.text} — \`${op.text}\` compares text, write "${literal.text}"`,
        );
      }
      i++;
      return {
        kind: "compare",
        name: subject,
        op: op.text,
        value: literal.value as Text,
      };
    }
    if (literal.kind !== "number") {
      refuse(
        `not a number: ${literal.text} — \`${op.text}\` compares numbers, drop the quotes`,
      );
    }
    i++;
    return {
      kind: "order",
      name: subject,
      op: op.text as Order,
      value: literal.value,
    };
  }

  const expr = or();
  if (i < tokens.length) {
    refuse(`unexpected ${tokens[i]!.text} — the expression was already complete`);
  }
  return expr;
}

export function parse(source: string): Parsed {
  try {
    const tokens = tokenize(source);
    if (tokens.length === 0) return { kind: "refused", message: "empty expression" };
    return { kind: "parsed", expr: parser(tokens) };
  } catch (error) {
    if (error instanceof Refusal) return { kind: "refused", message: error.message };
    throw error;
  }
}
