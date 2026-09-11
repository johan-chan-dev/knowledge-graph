import { isList } from "./frontmatter.ts";
import type { Properties, Text } from "./frontmatter.ts";
import type { Expr } from "./expression.ts";

/**
 * Whether one node's properties satisfy one expression.
 *
 * **Two-valued, deliberately.** A comparison against an absent property is
 * false and `not` flips it, so `find 'p'` and `find 'not p'` always partition
 * the space — the payoff SQL cannot offer, where a NULL row falls out of both
 * halves silently. `docs/design/absence.md` argues the choice and its cost.
 *
 * **A comparison that cannot be made is false**, which is the same rule, not a
 * second one: an operator meeting a value of the wrong shape simply does not
 * match. `docs/design/parked/comparison.md` settled it.
 */
export function matches(expr: Expr, properties: Properties): boolean {
  switch (expr.kind) {
    case "not":
      return !matches(expr.of, properties);
    case "and":
      return matches(expr.left, properties) && matches(expr.right, properties);
    case "or":
      return matches(expr.left, properties) || matches(expr.right, properties);
    case "presence":
      // Presence is asked of the record, never of the value: `undefined > 0`
      // and `undefined <= 0` are both false in JavaScript, so a comparison
      // written the natural way gets the right answer for the wrong reason and
      // inherits everything else coercion decides.
      return properties[expr.name] !== undefined;
    case "compare": {
      const held = properties[expr.name];
      // `=` compares a value; a dimension carrying several is the other
      // question, and `in` is the operator that asks it. So a list does not
      // match — and `!=`, being exactly `not =`, matches.
      const same = typeof held === "string" && held === (expr.value as string);
      return expr.op === "=" ? same : !same;
    }
    case "order": {
      const held = properties[expr.name];
      if (typeof held !== "string") return false;
      const number = numeric(held);
      if (number === undefined) return false;
      switch (expr.op) {
        case ">":
          return number > expr.value;
        case "<":
          return number < expr.value;
        case ">=":
          return number >= expr.value;
        case "<=":
          return number <= expr.value;
      }
      break;
    }
    case "member": {
      const held = properties[expr.name];
      // A list of relations is not a list of values, so `"cites" in links`
      // compares text against maps and does not match. Storage stays untyped;
      // the operator carries the type, and meets what it meets.
      if (!isList(held)) return false;
      return held.includes(expr.value);
    }
  }
  return false;
}

/**
 * The stored text read as a number, or nothing.
 *
 * `Number("")` is `0` and `Number(" 1 ")` is `1`, both of which would make a
 * value match a comparison it has no business matching. The guard is explicit
 * for the same reason presence is.
 */
const NUMERAL = /^-?\d+(\.\d+)?$/;
function numeric(held: Text): number | undefined {
  return NUMERAL.test(held) ? Number(held) : undefined;
}
