# Structured output

```
kg <anything> --json
```

**Format, never a selector.** Same content, structured — the stderr advisories
stay prose under it, since they are confirmations rather than answers and moving
them into the object would make the flag select.

```
space  →  { "name": …, "root": …, "branch": …, "nodes": 47 }
nodes  →  [ { "id": …, "created": … }, … ]
node   →  { "id": …, "content": … }
write  →  { "id": … }
```

`created` is read out of a v7 id's first 48 bits and is `null` for an id the
tool never minted — which is a broken space, detected properly in a later batch.

**It waits because nothing needs it yet.** Ids one per line and a bare id are
already parseable; the readout is four fixed fields; and wrapping a node's
content in an escaped string is strictly worse than handing it over byte for
byte. JSON earns its place when a value can contain a newline or a shape nests,
and neither is true until labels arrive.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
