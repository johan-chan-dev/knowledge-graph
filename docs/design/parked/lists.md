# A property that holds a list

```
kg node <id> add    <name> <value>...      elements into its list
kg node <id> remove <name> <value>...      elements out of it
kg nodes list --contains <name> <value>    the list includes it
```

**`set`/`unset` are about the property; `add`/`remove` are about its contents.**
The shape follows from the verb rather than from how many values were passed, so
`set labels auth` is a scalar and `add labels auth` is a one-element list — the
same principle as a flag's name stating its arity.

**`add` on a property that is a scalar refuses** — `cannot add to labels: not a
list`. Promoting `auth` to `[auth, pattern]` silently would be the tool deciding
what was meant.

**`remove` taking the last element removes the key**, leaving exactly what a node
that never had it looks like. A property emptied must be indistinguishable from
one never set; `labels: []` would be a residue of history.

**Filtering a list needs its own predicate.** `--where labels=auth` would have to
mean *equals* for a scalar and *contains* for a list — one operator, two
meanings. `--contains` says what it does, and `--where` against a list refuses
rather than matching nothing.

**Values are positional, never delimited.** `--contains labels auth` puts the
name first and the values after it, so nothing has to be separated. Any
separator collides with data the tool does not control — `cite: Smith, J.;
Jones, A.` is a legal value — and needing a flag to override the separator is
the proof that the separator was wrong.

**Taking several values is a different predicate, named for how it combines.**
`--contains-any labels auth pattern` unions; repeating `--contains` intersects,
by the rule that every filter ANDs. Combination never depends on whether you
repeated a flag or used a separator. A single-key membership test is SQL's `IN`
rather than the general `or` that was declined — bounded to one property, one
reading — but nothing needs it yet.

---

[docs](../../README.md) · [design](../) · [parked](README.md) · [spec](../../spec/)
