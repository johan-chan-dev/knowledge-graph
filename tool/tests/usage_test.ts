import { assertEquals, assertStringIncludes } from "@std/assert";
import { run } from "../src/main.ts";
import { exitCode } from "../src/outcome.ts";
import { message, space, stdout } from "./helpers.ts";

// help, unknown scopes and actions, arity

Deno.test("asking for help succeeds; being wrong does not", async () => {
  const help = await run(["--help"]);
  assertEquals(exitCode(help), 0, "help answers on stdout and succeeds");
  assertStringIncludes(stdout(help), "Reading a single resource is implicit");

  for (const argv of [["--nope"], ["nope"], ["node"], ["nodes"], ["nodes", "extra"]]) {
    assertEquals(exitCode(await run(argv)), 4, argv.join(" "));
  }
});

Deno.test("a single resource reads bare; a collection names its action", async () => {
  // `space` and `node <id>` are the two that read without a verb.
  const { kg } = await space();
  assertEquals(exitCode(await kg("space")), 2, "reads and reports, never usage");
  assertStringIncludes(
    message(await run(["-C", "/nonexistent", "space"])),
    "not a directory",
  );
  assertStringIncludes(message(await run(["node", "a", "b"])), "takes one action");
  assertStringIncludes(message(await run(["node"])), "needs an id, or new");
  assertStringIncludes(message(await run(["nodes"])), "takes one action");
});

Deno.test("a flag under Global is not one that belongs to a command", async () => {
  const help = stdout(await run(["--help"]));
  const [commands, global] = help.split("Global:");

  const inCommands = new Set(commands.match(/--[a-z-]+/g) ?? []);
  const asGlobal = global.match(/--[a-z-]+/g) ?? [];

  // `--properties` was listed in both: correctly beside `kg node <id>`, and
  // wrongly as global, which claimed every command accepts it.
  for (const flag of asGlobal) {
    assertEquals(inCommands.has(flag), false, `${flag} is command-specific, not global`);
  }
  assertEquals(asGlobal, ["--help"], "and -C, which the regex does not match");
});
