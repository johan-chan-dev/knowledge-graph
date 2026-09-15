import type { Entry, Label, Name, Properties, Text, Value } from "./frontmatter.ts";
import { isLinks } from "./frontmatter.ts";
import type { Map_, Node, Part, Pattern, Relationship } from "./pattern.ts";

/**
 * Matching a pattern over a snapshot of the graph.
 *
 * **Nothing here reads a file.** The caller hands over every node with its
 * entries already resolved, which is what makes this a join in memory rather
 * than a traversal of a store — `docs/batches/14-match.md` has the measurement
 * and the reason the cost is flat.
 */

/** An entry as the caller resolved it: the stored `{type, link, direction}`
 * with `neighbour` and the relation's own properties merged in. */
type Resolved = Entry & { neighbour?: string } & Record<string, unknown>;

export type Graph = ReadonlyMap<string, Properties>;

const entriesOf = (properties: Properties): Resolved[] => {
  const carried = properties["links" as Name];
  return isLinks(carried) ? (carried as unknown as Resolved[]) : [];
};

/** A map compares a value, so a property holding a list does not match one —
 * the same rule `find` followed, where `=` and `in` ask different questions and
 * meeting the other's operand is no match rather than an inferred one. */
function carries(properties: Properties, wanted: Map_): boolean {
  for (const [name, value] of Object.entries(wanted)) {
    const held = properties[name as Name] as Value | undefined;
    if (typeof held !== "string" || held !== (value as string)) return false;
  }
  return true;
}

function labelled(properties: Properties, wanted: readonly Label[]): boolean {
  if (wanted.length === 0) return true;
  const carried = properties["labels" as Name];
  if (!Array.isArray(carried)) return false;
  const held = new Set(carried as Text[]);
  return wanted.every((word) => held.has(word as unknown as Text));
}

const fits = (pattern: Node, properties: Properties): boolean =>
  labelled(properties, pattern.labels) && carries(properties, pattern.properties);

/** `direction` on an entry is read from the node carrying it, so `out` means
 * the relation runs away from wherever the walk currently stands. */
function follows(pattern: Relationship, entry: Resolved): boolean {
  if (pattern.direction !== "either" && entry.direction !== pattern.direction) {
    return false;
  }
  if (pattern.types.length > 0 && !pattern.types.includes(entry.type)) return false;
  for (const [name, value] of Object.entries(pattern.properties)) {
    if (entry[name] !== (value as string)) return false;
  }
  return true;
}

type Bindings = ReadonlyMap<string, string>;
/** Link ids already walked. **A relationship binds at most once within one
 * pattern** — openCypher's default, and what keeps a two-hop pattern from
 * coming back along the edge it arrived on. */
type Used = ReadonlySet<string>;

const bind = (bindings: Bindings, name: string | undefined, id: string): Bindings =>
  name === undefined ? bindings : new Map(bindings).set(name, id);

/** A variable already standing for another node rules the candidate out; an
 * unbound one constrains nothing. That is the whole of a join. */
function joins(bindings: Bindings, name: string | undefined, id: string): boolean {
  if (name === undefined) return true;
  const bound = bindings.get(name);
  return bound === undefined || bound === id;
}

/**
 * Every node id that takes part in any solution, which is the subgraph the
 * pattern names. Anonymous positions count: a pattern returns **both ends of
 * every relation it names**, and a name is only ever a join constraint.
 */
export function matched(pattern: Pattern, graph: Graph): Set<string> {
  const found = new Set<string>();

  const walk = (
    steps: Part["steps"],
    at: number,
    here: string,
    bindings: Bindings,
    used: Used,
    touched: readonly string[],
    done: (bindings: Bindings, used: Used, touched: readonly string[]) => void,
  ): void => {
    const step = steps[at];
    if (step === undefined) return done(bindings, used, touched);
    const properties = graph.get(here);
    if (properties === undefined) return;
    for (const entry of entriesOf(properties)) {
      if (used.has(entry.link)) continue;
      if (!follows(step.via, entry)) continue;
      const there = entry.neighbour;
      if (there === undefined) continue;
      if (!joins(bindings, step.to.variable, there)) continue;
      const other = graph.get(there);
      if (other === undefined || !fits(step.to, other)) continue;
      walk(
        steps,
        at + 1,
        there,
        bind(bind(bindings, step.via.variable, entry.link), step.to.variable, there),
        new Set(used).add(entry.link),
        [...touched, there],
        done,
      );
    }
  };

  const part = (
    parts: Pattern,
    at: number,
    bindings: Bindings,
    used: Used,
    touched: readonly string[],
  ): void => {
    const current = parts[at];
    if (current === undefined) {
      for (const id of touched) found.add(id);
      return;
    }
    const held = current.first.variable === undefined
      ? undefined
      : bindings.get(current.first.variable);
    const candidates = held === undefined ? graph.keys() : [held];
    for (const id of candidates) {
      const properties = graph.get(id);
      if (properties === undefined || !fits(current.first, properties)) continue;
      walk(
        current.steps,
        0,
        id,
        bind(bindings, current.first.variable, id),
        used,
        [...touched, id],
        (b, u, t) => part(parts, at + 1, b, u, t),
      );
    }
  };

  part(pattern, 0, new Map(), new Set(), []);
  return found;
}
