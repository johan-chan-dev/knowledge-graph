import { assert, assertEquals } from "@std/assert";
import { check, COMMANDS, help, match } from "./surface.ts";

const A = "01a08853-987c-74a6-8e1c-77aec205a942";

/** The form as a caller would type it: placeholders filled, `...` dropped, and
 * flags left to the flag argument since they do not arrive as positionals. */
const typed = (form: string): string[] =>
  form.split(" ")
    .filter((token) => !token.startsWith("--"))
    .map((token) => token.replace(/\.\.\.$/, ""))
    .map((token) => ({ "<id>": A, "<name>": "x", "<value>": "v" }[token] ?? token));

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
      stdin: command.flags.includes("stdin"),
      properties: false,
    });
    assertEquals(checked.kind, "ok", `${command.form}: ${JSON.stringify(checked)}`);
  }
});

Deno.test("help prints every command, and nothing it cannot dispatch", () => {
  const printed = help();
  for (const command of COMMANDS) {
    assert(printed.includes(`kg ${command.form}`), `help omits ${command.form}`);
    if (command.variant) assert(printed.includes(`kg ${command.variant.form}`));
  }
});

Deno.test("no two commands answer to the same words", () => {
  const keys = COMMANDS.map((c) => `${c.scope} ${c.id ? "<id>" : ""} ${c.action ?? ""}`);
  assertEquals(new Set(keys).size, keys.length);
});

Deno.test("a flag is refused by every command that does not declare it", () => {
  for (const command of COMMANDS) {
    for (const flag of ["stdin", "properties"] as const) {
      if (command.flags.includes(flag)) continue;
      const matched = match(typed(command.form));
      assert(matched.kind === "matched");
      const checked = check(command, matched.id, matched.args, {
        stdin: flag === "stdin",
        properties: flag === "properties",
      });
      assertEquals(checked.kind, "usage", `${command.form} accepted --${flag}`);
    }
  }
});
