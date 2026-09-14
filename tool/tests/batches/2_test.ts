import { assertEquals } from "@std/assert";
import { kg, space } from "./spawn.ts";

// The loop that batch closes, against the compiled binary. Its transcript
// is in `docs/batches/2-properties.md` — change one and this fails first.

Deno.test("batch 2 — nodes carry properties", async () => {
  const dir = await space();
  await kg(dir, ["space", "init"]);

  const a = (await kg(dir, ["node", "new", "--stdin"], "Modules own their schema.\n")).out
    .trim();
  const b =
    (await kg(dir, ["node", "new", "--stdin"], "OWASP is authoritative until 2027.\n"))
      .out
      .trim();
  const c = (await kg(dir, ["node", "new", "--stdin"], "One full-stack app.\n")).out
    .trim();

  assertEquals(
    (await kg(dir, ["node", a, "set", "kind", "decision"])).err.trim(),
    "set kind",
  );
  await kg(dir, ["node", b, "set", "kind", "authority"]);
  await kg(dir, ["node", b, "set", "validUntil", "2027-01-01"]);
  await kg(dir, ["node", c, "set", "kind", "decision"]);

  // The same command twice: only the second says the property already existed.
  assertEquals(
    (await kg(dir, ["node", b, "set", "kind", "authority"])).err.trim(),
    "replaced kind",
  );

  const asProperties = await kg(dir, ["node", b, "--properties"]);
  assertEquals(asProperties.out, "kind: authority\nvalidUntil: '2027-01-01'\n");
  assertEquals(asProperties.err, "", "the lines are right there to count");

  // Reading the content renders the same lines, on the other channel.
  const asContent = await kg(dir, ["node", b]);
  assertEquals(asContent.out, "OWASP is authoritative until 2027.\n");
  assertEquals(
    asContent.err,
    asProperties.out,
    "byte for byte, only the channel differs",
  );

  // Filtering is parked; `nodes list` is a bare directory read.
  const listed = (await kg(dir, ["nodes", "list"])).out.split("\n").filter(Boolean);
  assertEquals(listed.sort(), [a, b, c].sort());
});
