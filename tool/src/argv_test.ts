import { assertEquals } from "@std/assert";
import { type Flags, globals, head, split } from "./argv.ts";

const nodeNew: Flags = {
  stdin: { kind: "boolean" },
  "with-labels": { kind: "variadic" },
};
const link: Flags = { as: { kind: "value" }, "with-nodes": { kind: "variadic" } };

Deno.test("a flag not declared here is not a flag here", () => {
  assertEquals(split(["--properties"], nodeNew), {
    kind: "unknown",
    flag: "--properties",
  });
  assertEquals(split(["--stdin"], nodeNew).kind, "split");
});

Deno.test("a variadic flag stops at the next flag, and needs at least one value", () => {
  assertEquals(split(["--with-labels", "auth", "decision", "--stdin"], nodeNew), {
    kind: "split",
    flags: { "with-labels": ["auth", "decision"], stdin: true },
    positionals: [],
  });
  assertEquals(split(["--with-labels"], nodeNew), {
    kind: "missing",
    flag: "--with-labels",
  });
  // A value after an interrupting flag is a stray positional, which the table
  // then refuses — it is not silently swallowed.
  assertEquals(split(["--with-labels", "auth", "--stdin", "decision"], nodeNew), {
    kind: "split",
    flags: { "with-labels": ["auth"], stdin: true },
    positionals: ["decision"],
  });
});

Deno.test("flags are order-independent", () => {
  const canon = (argv: string[]) => {
    const r = split(argv, link);
    if (r.kind !== "split") return r.kind;
    return JSON.stringify({
      flags: Object.fromEntries(Object.entries(r.flags).sort()),
      positionals: r.positionals,
    });
  };
  const first = canon(["--as", "cites", "--with-nodes", "B", "C"]);
  assertEquals(canon(["--with-nodes", "B", "C", "--as", "cites"]), first);
});

Deno.test("a single dash is not a flag: only `-C` is, and it is global", () => {
  // So a negative value reaches the command, and a name shaped like a flag is
  // refused for what it is rather than reported as unknown.
  assertEquals(split(["-1.5"], {}), { kind: "split", flags: {}, positionals: ["-1.5"] });
  assertEquals(split(["--", "--stdin"], {}), {
    kind: "split",
    flags: {},
    positionals: ["--stdin"],
  });
});

Deno.test("the command path is the leading tokens carrying no dash", () => {
  assertEquals(head(["node", "new", "--with-labels", "auth"]), {
    path: ["node", "new"],
    rest: ["--with-labels", "auth"],
  });
  assertEquals(head(["node", "01a0", "set", "kind", "decision"]), {
    path: ["node", "01a0", "set", "kind", "decision"],
    rest: [],
  });
});

Deno.test("globals are taken before any command is known", () => {
  assertEquals(globals(["-C", "/tmp", "node", "new"]), {
    help: false,
    cwd: "/tmp",
    rest: ["node", "new"],
  });
  assertEquals(globals(["node", "new", "--help"]).help, true);
  assertEquals(globals(["-C"]).bad, "-C needs a directory");
});
