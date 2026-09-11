/**
 * Neo4j's movies example, as a shell script of `kg` commands.
 *
 * **This reads one file's dialect, not Cypher.** The dataset is 268 node
 * `MERGE`s, 253 relationship `MERGE`s and 6 `MATCH` re-bindings, all regular
 * enough for three expressions — which is why this is a fixture and not an
 * `import` command the tool would have to keep promising.
 *
 * It emits a script rather than driving the tool directly so the import can be
 * read before it runs, diffed when the surface changes, and so the conformance
 * check covers what an agent actually touches: a process, arguments and stdin.
 */
const NODE = /^MERGE \((\w+):(\w+) \{(.*)\}\)(?: ON CREATE SET (.*))?$/;
const REL = /^MERGE \((\w+)\)-\[:(\w+)(?: \{(.*)\})?\]->\((\w+)\)$/;
const BIND = /^MATCH \((\w+):(\w+) \{.*\}\)$/;

const unescape = (s: string) => s.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
/** Single-quoted for the shell, which is the only quoting that survives. */
const sh = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
/** A Neo4j label is capitalised and case-sensitive; a kg label is not. */
const word = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

/** `name:'x', born:1964, roles:['a','b']` — values stay as written; the tool
 * stores text either way, since the shell removes quoting before it is seen. */
function properties(text: string): [string, string[]][] {
  const out: [string, string[]][] = [];
  // The inline map separates with `:`, `ON CREATE SET` with `=`.
  const pattern =
    /(\w+)\s*[:=]\s*(\[[^\]]*\]|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^,]+)/g;
  for (const [, name, raw] of text.matchAll(pattern)) {
    const value = raw!.trim();
    if (value.startsWith("[")) {
      const items = [...value.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) =>
        unescape(m[1]!)
      );
      if (items.length > 0) out.push([word(name!), items]);
    } else if (value.startsWith("'") || value.startsWith('"')) {
      out.push([word(name!), [unescape(value.slice(1, -1))]]);
    } else {
      out.push([word(name!), [value]]);
    }
  }
  return out;
}

// The script adds material and does not make a space. Every `kg` command treats
// a space as a precondition, so this inherits the tool's own refusal —
// `no space here — run: kg space init` — rather than deciding for the caller.
const lines = [
  "#!/usr/bin/env bash",
  "# Neo4j's movies example, as kg commands. Requires an existing space, and",
  "# adds to whatever is already in it.",
  "#",
  "# One line of output per thing made. `set` and `add` acknowledge on stderr",
  "# and are silenced; a failure still stops the script, since `set -e` does not",
  "# need the message to do it.",
  "set -euo pipefail",
  "",
];
const seen = new Set<string>();
/** What to call a node in the progress line — its title or name, not the
 * dataset's variable. */
const names = new Map<string, string>();
let nodes = 0;
let links = 0;

for (
  const raw of (await Deno.readTextFile(new URL("./movies.cypher", import.meta.url)))
    .split("\n")
) {
  const line = raw.trim().replace(/;$/, "");
  if (line === "" || line.startsWith("CREATE CONSTRAINT")) continue;

  const bind = BIND.exec(line);
  if (bind !== null) continue; // already created above; the variable is still in scope

  const node = NODE.exec(line);
  if (node !== null) {
    const [, variable, label, inline, sets] = node;
    if (seen.has(variable!)) continue;
    seen.add(variable!);
    // The dataset writes properties two ways — inline in the map, or in an
    // `ON CREATE SET` list — and some nodes use both.
    const all = [
      ...properties(inline ?? ""),
      ...properties((sets ?? "").replace(/\w+\./g, "")),
    ];
    const shown = all.find(([n]) => n === "title" || n === "name")?.[1][0] ?? variable!;
    names.set(variable!, shown);
    nodes++;
    lines.push(
      `printf '[%3d/__NODES__] %-6s %s\\n' ${nodes} ${sh(word(label!))} ${sh(shown)}`,
    );
    lines.push(`${variable}=$(kg node new --with-labels ${word(label!)})`);
    for (const [name, values] of all) {
      lines.push(`kg node "$${variable}" set ${name} ${sh(values[0]!)} >/dev/null 2>&1`);
    }
    continue;
  }

  const rel = REL.exec(line);
  if (rel !== null) {
    const [, from, type, props, to] = rel;
    const pairs = properties(props ?? "");
    const scalars = pairs.filter(([, v]) => v.length === 1);
    const withProps = scalars.length > 0
      ? ` --with-properties ${scalars.map(([n, v]) => sh(`${n}=${v[0]}`)).join(" ")}`
      : "";
    links++;
    lines.push(
      `printf '[%3d/__LINKS__] %-10s %s -> %s\\n' ${links} ${sh(word(type!))} ` +
        `${sh(names.get(from!) ?? from!)} ${sh(names.get(to!) ?? to!)}`,
    );
    lines.push(
      `l=$(kg node "$${from}" link --as ${
        word(type!)
      } --with-nodes "$${to}"${withProps})`,
    );
    for (const [name, values] of pairs.filter(([, v]) => v.length > 1)) {
      lines.push(`kg link "$l" add ${name} ${values.map(sh).join(" ")} >/dev/null 2>&1`);
    }
    continue;
  }
  throw new Error(`unrecognised: ${line}`);
}

lines.push("", `printf '\\n%s nodes, %s relations\\n' ${nodes} ${links}`);
await Deno.writeTextFile(
  new URL("./import.sh", import.meta.url),
  lines.join("\n")
    .replaceAll("__NODES__", String(nodes))
    .replaceAll("__LINKS__", String(links)) + "\n",
);
console.log(`  ${nodes} nodes, ${links} relations, ${lines.length} lines`);
