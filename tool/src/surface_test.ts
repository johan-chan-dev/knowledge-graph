import { assert, assertEquals } from "@std/assert";
import { check, COMMANDS, declares, help, match } from "./surface.ts";

const A = "01a08853-987c-74a6-8e1c-77aec205a942";

/** The form as a caller would type it: placeholders filled, `...` dropped, and
 * flags left to the flag argument since they do not arrive as positionals. */
const typed = (form: string): string[] =>
  form.split(" ")
    .filter((token) => !token.startsWith("--"))
    .map((token) => token.replace(/\.\.\.$/, ""))
    .map((
      token,
    ) => ({ "<id>": A, "<name>": "x", "<value>": "v", "<word>": "w" }[token] ?? token));

Deno.test("every declared command is reachable by the form it prints", () => {
  for (const command of COMMANDS) {
    const matched = match(typed(command.form));
    assertEquals(matched.kind, "matched", command.form);
    assert(matched.kind === "matched");
    assertEquals(matched.command.form, command.form);
  }
});

// `form` is prose and `args` is the rule, which is the one place this table can
// still disagree with itself. Typing the form must satisfy the schema.
Deno.test("a command's form and its argument schema agree", () => {
  for (const command of COMMANDS) {
    const matched = match(typed(command.form));
    assert(matched.kind === "matched");
    const checked = check(command, matched.id, matched.args, {
      ...(command.flags.stdin ? { stdin: true as const } : {}),
    });
    assertEquals(checked.kind, "ok", `${command.form}: ${JSON.stringify(checked)}`);
  }
});

Deno.test("help prints every command, and nothing it cannot dispatch", () => {
  const printed = help();
  for (const command of COMMANDS) {
    assert(printed.includes(`kg ${command.form}`), `help omits ${command.form}`);
    for (const v of command.variants ?? []) {
      assert(printed.includes(`kg ${v.form}`), `help omits ${v.form}`);
    }
  }
});

Deno.test("no two commands answer to the same words", () => {
  const keys = COMMANDS.map((c) => `${c.scope} ${c.id ? "<id>" : ""} ${c.action ?? ""}`);
  assertEquals(new Set(keys).size, keys.length);
});

// A flag belongs to a command, so one that does not is not parseable there at
// all — `split` reports it unknown before `check` is reached. What remains
// checkable here is that every flag a command declares has a shape, and that
// `declares` can still say where a flag does belong.
Deno.test("every declared flag has a shape, and can be traced to its commands", () => {
  for (const command of COMMANDS) {
    for (const [name, shape] of Object.entries(command.flags)) {
      assertEquals(
        ["boolean", "value", "variadic"].includes(shape.kind),
        true,
        `${command.form}: --${name}`,
      );
      assert(declares(name).length > 0, `--${name} traces to no command`);
    }
  }
});
