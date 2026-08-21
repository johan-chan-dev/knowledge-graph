#!/usr/bin/env python3
"""kg — knowledge-graph toolbelt.

Correct by construction: the operations that write a node write it complete, so
the rules they enforce have no reachable broken state. What remains checkable is
prose, which no constructor owns.

Standard library only. A tool that needs an install step before it runs is a tool
that does not run.
"""
import argparse
import datetime
import json
import os
import pathlib
import re
import subprocess
import sys

CONFIG = ".kg.json"
CAP = 4            # queue items surfaced at once
MAP_BUDGET = 1400  # estimated tokens; past this the listing degrades to domains
GEN = re.compile(r"(<!-- generated:(\w+) -->\n)(.*?)(<!-- /generated:\2 -->)", re.S)
WATERMARK = re.compile(r"^reconciled: ([0-9a-f]{7,40})$", re.M)

KINDS = {
    #  kind        required attributes            forbidden attributes
    "fact":     (("title", "confidence", "compiled", "recheck"), ()),
    "concept":  (("title", "confidence", "compiled"), ("recheck",)),
    "decision": (("title", "status", "serves"), ("confidence", "recheck")),
    "thesis":   (("title", "basis", "would-falsify"), ("confidence", "recheck")),
}
STATUS = ("open", "provisional", "decided", "superseded")
CONFIDENCE = ("verified", "partial", "attested")
# blocked-by was earned, not designed. Writing the first node-to-task edge made
# it obvious that depends-on does not fit: a provisional decision is not
# *dependent on* the verification that would settle it, it is *blocked by* it —
# the decision stands and is usable, it simply cannot close. The other three
# original terms were guessed a priori and two of them have one use each.
RELATIONS = ("supersedes", "contradicts", "depends-on", "does-not-satisfy",
             "blocked-by")
FRAMES = ("jurisdiction", "vendor")
UNIVERSAL = "universal"

FM = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.S)
MDLINK = re.compile(r"\[[^\]]*\]\((?!https?://|#)([^)]+?\.md)[^)]*\)")
FENCE = re.compile(r"^```.*?^```", re.S | re.M)
CODESPAN = re.compile(r"`[^`\n]*`")


# ── errors ────────────────────────────────────────────────────────────────────

class Refused(Exception):
    """The operation would produce an invalid state, so it did not run."""


# ── config ────────────────────────────────────────────────────────────────────

def git(*args, cwd=None):
    """Empty on any failure — the watermark check degrades to silence rather
    than to a false alarm in a directory that is not a repository."""
    try:
        r = subprocess.run(["git", *args], cwd=cwd, capture_output=True,
                           text=True, timeout=10)
        return r.stdout.strip() if r.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def find_root(start=None):
    d = (start or pathlib.Path.cwd()).resolve()
    for p in [d, *d.parents]:
        if (p / CONFIG).is_file():
            return p
    raise Refused(f"no {CONFIG} found in {d} or any parent — run `kg init`")


def load_config(root):
    cfg = json.loads((root / CONFIG).read_text())
    cfg.setdefault("meta", "meta")
    cfg.setdefault("graphs", [])
    cfg.setdefault("tasks", [])
    return cfg


def graphs(root, cfg):
    """(dir, label, is_global) for every graph, globs expanded."""
    out = []
    for g in cfg["graphs"]:
        for d in sorted(root.glob(g["path"])) if "*" in g["path"] else [root / g["path"]]:
            if d.is_dir():
                out.append((d, str(d.relative_to(root)), g.get("tier") == "global"))
    return out


def graph_of(root, cfg, path):
    path = path.resolve()
    for d, label, is_global in graphs(root, cfg):
        if d.resolve() in path.parents:
            return d, label, is_global
    raise Refused(f"{path} is not inside any configured graph")


# ── frontmatter ───────────────────────────────────────────────────────────────
# A strict reader for the shape kg emits. Anything outside it is an error with a
# line number rather than a guess — the tool writes this, so the subset is
# self-consistent.

def _scalar(v):
    v = v.strip()
    if v.startswith("[") and v.endswith("]"):
        return [x.strip() for x in v[1:-1].split(",") if x.strip()]
    return v


def read(path):
    """Recursive descent over indented lines with a shared cursor.

    An earlier version sliced sublists and indexed them with an outer-scope
    helper, which silently produced keys out of continuation lines. One cursor,
    one line list, no slicing."""
    text = path.read_text()
    m = FM.match(text)
    if not m:
        return None, text
    lines, body = m.group(1).split("\n"), m.group(2)
    i = 0

    def ind(s):
        return len(s) - len(s.lstrip())

    def cur():
        nonlocal i
        while i < len(lines) and not lines[i].strip():
            i += 1
        return lines[i] if i < len(lines) else None

    def parse_scalar_block(base, folded):
        nonlocal i
        parts = []
        while i < len(lines):
            line = lines[i]
            if line.strip() and ind(line) < base:
                break
            parts.append(line.strip())
            i += 1
        return (" " if folded else "\n").join(p for p in parts if p)

    def parse_map(base):
        nonlocal i
        d = {}
        while True:
            line = cur()
            if line is None or ind(line) < base or line.strip().startswith("- "):
                return d
            at = ind(line)
            key, _, val = line.strip().partition(":")
            i += 1
            val = val.strip()
            if val in (">-", ">", "|", "|-"):
                d[key.strip()] = parse_scalar_block(at + 1, val[0] == ">")
            elif val == "":
                d[key.strip()] = parse_value(base + 1)
            else:
                d[key.strip()] = _scalar(val)

    def parse_list(base):
        nonlocal i
        items = []
        while True:
            line = cur()
            if line is None or ind(line) < base or not line.strip().startswith("- "):
                return items
            at = ind(line)
            lines[i] = " " * (at + 2) + line.strip()[2:]
            items.append(parse_map(at + 2))

    def parse_value(base):
        line = cur()
        if line is None or ind(line) < base:
            return {}
        return parse_list(base) if line.strip().startswith("- ") else parse_map(base)

    return parse_map(0), body


def _wrap(s, ind, width=76):
    pad, out, line = " " * ind, [], ""
    for word in s.split():
        if line and len(pad) + len(line) + 1 + len(word) > width:
            out.append(pad + line)
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        out.append(pad + line)
    return out


def _emit(doc, ind=0):
    pad, out = " " * ind, []
    for k, v in doc.items():
        if isinstance(v, dict):
            out.append(f"{pad}{k}:")
            out.append(_emit(v, ind + 2))
        elif isinstance(v, list) and v and isinstance(v[0], dict):
            out.append(f"{pad}{k}:")
            for item in v:
                block = _emit(item, ind + 4).split("\n")
                block[0] = f"{pad}  - " + block[0].lstrip()
                out.extend(block)
        elif isinstance(v, list):
            out.append(f"{pad}{k}: [{', '.join(str(x) for x in v)}]")
        else:
            s = str(v)
            if "\n" in s or len(f"{pad}{k}: {s}") > 80:
                out.append(f"{pad}{k}: >-")
                out.extend(_wrap(s, ind + 2))
            else:
                out.append(f"{pad}{k}: {s}")
    return "\n".join(out)


def write(path, doc, body):
    path.write_text("---\n" + _emit(doc, 0) + "\n---\n" + body)


# ── validation ────────────────────────────────────────────────────────────────
# Called before every write. Not validation after the fact — a precondition, so
# an operation that would produce an invalid node does not run.

def validate(doc, where="node"):
    errs = []
    kind = doc.get("kind")
    if kind not in KINDS:
        return [f"{where}: kind {kind!r} not in {'|'.join(KINDS)}"]
    attrs = doc.get("attributes") or {}
    required, forbidden = KINDS[kind]

    for k in required:
        if not attrs.get(k):
            errs.append(f"{where}: kind {kind} requires attributes.{k}")
    for k in forbidden:
        if k in attrs:
            errs.append(f"{where}: kind {kind} must not carry attributes.{k} — "
                        f"a decision is chosen, not checked; a concept does not expire")

    if kind == "decision":
        st = attrs.get("status")
        if st not in STATUS:
            errs.append(f"{where}: status {st!r} not in {'|'.join(STATUS)}")
        elif st != "open":
            for k in ("decided", "revisit-when"):
                if not attrs.get(k):
                    errs.append(f"{where}: status {st} requires attributes.{k}")
    if kind in ("fact", "concept"):
        c = attrs.get("confidence")
        if c not in CONFIDENCE:
            errs.append(f"{where}: confidence {c!r} not in {'|'.join(CONFIDENCE)}")
        elif c == "attested":
            for k in ("attested-by", "attested-on", "basis"):
                if not attrs.get(k):
                    errs.append(f"{where}: confidence attested requires attributes.{k}")

    for facet in FRAMES:
        v = attrs.get(facet)
        if v is None:
            continue
        if not isinstance(v, list):
            errs.append(f"{where}: attributes.{facet} must be a list, e.g. [fr, eu]")
        elif UNIVERSAL in v and len(v) > 1:
            errs.append(f"{where}: attributes.{facet} {v} — universal is exclusive; "
                        f"a claim holding across every value cannot also be bound to some")

    for key in ("compiled", "recheck", "decided", "attested-on", "superseded"):
        raw = attrs.get(key)
        if raw and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(raw)):
            errs.append(f"{where}: attributes.{key} {raw!r} is not YYYY-MM-DD")

    for rel in doc.get("relations") or []:
        if rel.get("rel") not in RELATIONS:
            errs.append(f"{where}: rel {rel.get('rel')!r} not in {'|'.join(RELATIONS)}")
        if not rel.get("to"):
            errs.append(f"{where}: relation missing 'to'")
    return errs


# ── the resolver ──────────────────────────────────────────────────────────────
# Four operations need exactly this: find candidate references, resolve each to
# an absolute path, compare. The two conventions are why a grep cannot do it —
# a typed relation is relative to the graph root, a prose citation to the file.

def strip_code(text):
    return CODESPAN.sub("", FENCE.sub("", text))


def refs(root, cfg, path):
    """(kind, raw, resolved) for every reference out of `path`."""
    doc, body = read(path)
    out = []
    if doc:
        for rel in doc.get("relations") or []:
            if rel.get("to"):
                out.append(("relation", rel["to"], (root / rel["to"]).resolve()))
    for raw in MDLINK.findall(strip_code(body if doc else path.read_text())):
        out.append(("prose", raw, (path.parent / raw).resolve()))
    return out


def walk(root, cfg):
    """Every markdown file that is not metadata, with whether it is a node."""
    skip = {".git", "node_modules", cfg["meta"]}
    for p in sorted(root.rglob("*.md")):
        parts = p.relative_to(root).parts
        if any(s in parts for s in skip):
            continue
        yield p


def inbound(root, cfg, target):
    """What cites `target`. Reports everything, and labels the tier.

    Deliberately not filtered. The tier rule governs which edges may be *stored*
    and what a root reader is shown in a *rendered view* — not what an explicit
    impact query may answer. "What breaks if this changes?" is the question the
    operation exists for, and for a global node the answer is mostly local."""
    target = target.resolve()
    hits = []
    for p in walk(root, cfg):
        if p.resolve() == target:
            continue
        try:
            _, label, _ = graph_of(root, cfg, p)
        except Refused:
            label = "—"
        for kind, raw, resolved in refs(root, cfg, p):
            if resolved == target:
                hits.append((p.relative_to(root), kind, label))
    return hits


# ── operations ────────────────────────────────────────────────────────────────

def index_of(root, cfg, gdir):
    return gdir / cfg["meta"] / "INDEX.md"


def index_add(root, cfg, gdir, rel, title):
    idx = index_of(root, cfg, gdir)
    idx.parent.mkdir(parents=True, exist_ok=True)
    if not idx.exists():
        idx.write_text(f"# {gdir.name} — index\n")
    text = idx.read_text()
    if str(rel) in text:
        return
    domain = pathlib.PurePosixPath(rel).parts[0] if "/" in str(rel) else ""
    entry = f"- [{title}](../{rel})\n"
    head = f"## {domain}/"
    if domain and head in text:
        at = text.index(head)
        nxt = text.find("\n## ", at + 1)
        cut = len(text) if nxt < 0 else nxt
        text = text[:cut].rstrip("\n") + "\n" + entry + text[cut:]
    else:
        text = text.rstrip("\n") + (f"\n\n{head}\n" if domain else "\n") + entry
    idx.write_text(text)


def op_new(root, cfg, args):
    path = pathlib.Path(args.path).resolve()
    attrs = json.loads(args.set) if args.set else {}
    if args.title:
        attrs["title"] = args.title
    kind = attrs.pop("kind", None) or args.kind
    body = ""
    if path.exists():
        doc, body = read(path)
        if doc:
            raise Refused(f"{args.path} already has frontmatter — it is a node. "
                          f"Use `kg set` to change it.")
    ordered = {"title": attrs.pop("title", None)}
    ordered["compiled"] = attrs.pop("compiled", str(datetime.date.today()))
    ordered.update(attrs)
    attrs = {k: v for k, v in ordered.items() if v is not None}
    doc = {"kind": kind, "attributes": attrs}
    errs = validate(doc, args.path)
    if errs:
        raise Refused("\n".join(errs))
    gdir, _, _ = graph_of(root, cfg, path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not body.strip():
        body = f"\n# {attrs['title']}\n"
    write(path, doc, body)
    index_add(root, cfg, gdir, path.relative_to(gdir), attrs["title"])
    print(f"wrote {path.relative_to(root)}")
    print(f"indexed in {index_of(root, cfg, gdir).relative_to(root)}")


def op_supersede(root, cfg, args):
    """Insert a version into a chain. The live node never moves.

    Its path is its identity, so every inbound citation keeps pointing at the
    current version and none of them rot. What changes is behind it: a snapshot
    of what the node used to say is written to an archive, stripped of
    everything but its own link further back, and the live node's `supersedes`
    edge is repointed at it.

    A linked-list insert, not a replacement."""
    path = pathlib.Path(args.path).resolve()
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.path} is not a node")
    if doc.get("kind") != "decision":
        raise Refused(
            f"refused — only a decision is superseded, and {args.path} is a "
            f"{doc.get('kind')}. A fact is checked against a source: when the "
            f"source moves the fact is wrong and gets corrected in place, with "
            f"git holding the history.")
    patch = json.loads(args.set) if args.set else {}
    if args.title:
        patch["title"] = args.title
    if not patch.get("revisit-when"):
        raise Refused(
            "refused — a new version needs its own revisit-when in --set. It is "
            "never carried forward: it names the event that would unmake the "
            "decision, and if you are superseding, that event either fired or "
            "was wrong.")

    # Timestamped, not numbered. A version number carries no information; the
    # stamp is when this version stopped being current, which is the one fact the
    # file does not otherwise hold. Seconds resolution removes the same-day
    # collision entirely, so there is no suffix scheme to remember.
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")
    archive = path.parent / f"{path.stem}.{now.strftime('%Y%m%d-%H%M%S')}.md"
    if archive.exists():
        raise Refused(f"{archive.name} already exists — two supersessions in the "
                      f"same second")

    prior = [r for r in (doc.get("relations") or []) if r.get("rel") == "supersedes"]
    snap = {"kind": doc["kind"], "attributes": dict(doc["attributes"])}
    snap["attributes"]["status"] = "superseded"
    snap["attributes"]["superseded"] = today
    if prior:
        snap["relations"] = prior          # the chain continues behind it
    errs = validate(snap, str(archive.relative_to(root)))
    if errs:
        raise Refused("\n".join(errs))

    for k, v in patch.items():
        if v is None:
            doc["attributes"].pop(k, None)
        else:
            doc["attributes"][k] = v
    doc["relations"] = [r for r in (doc.get("relations") or [])
                        if r.get("rel") != "supersedes"]
    doc["relations"].append(
        {"rel": "supersedes", "to": str(archive.relative_to(root))})
    errs = validate(doc, args.path)
    if errs:
        raise Refused("refused — the new version would be invalid:\n" + "\n".join(errs))

    write(archive, snap, body)
    write(path, doc, body)
    print(f"archived {archive.relative_to(root)}  "
          f"({'chain continues' if prior else 'chain starts'})")
    print(f"updated  {path.relative_to(root)} — path unchanged, "
          f"inbound citations untouched")


def resolve_ref(root, cfg, ref):
    """A numeric ref is a task, a path is a node. Returns (path, is_task).

    One resolver so every operation accepts both — a task and a node are
    different entities, but pointing at one is the same act."""
    if str(ref).isdigit():
        hit = [(p, d) for p, d in tasks(root, cfg) if d["id"] == int(ref)]
        if not hit:
            raise Refused(f"no task with id {ref}")
        return hit[0][0], True
    path = pathlib.Path(ref).resolve()
    if not path.exists():
        raise Refused(f"{ref} does not exist")
    return path, any(d == "tasks" for d in path.relative_to(root).parts)


def op_set(root, cfg, args):
    path, is_task = resolve_ref(root, cfg, args.ref)
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.ref} has no frontmatter — use `kg new` to make it a node")
    patch = json.loads(args.set)
    for k, v in patch.items():
        if k == "kind":
            doc["kind"] = v
        elif v is None:
            doc.setdefault("attributes", {}).pop(k, None)
        else:
            doc.setdefault("attributes", {})[k] = v
    errs = (validate_task if is_task else validate)(doc, args.ref)
    if errs:
        raise Refused("refused — the result would be invalid:\n" + "\n".join(errs))
    write(path, doc, body)
    print(f"updated {path.relative_to(root)}")


def op_link(root, cfg, args):
    path, is_task = resolve_ref(root, cfg, args.frm)
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.frm} has no frontmatter")
    is_global = False if is_task else graph_of(root, cfg, path)[2]
    tgt = pathlib.Path(args.to)
    resolved = (root / tgt).resolve()
    if not resolved.exists():
        raise Refused(f"relation target does not resolve: {args.to} "
                      f"(a relation's `to` is relative to the repository root, so it "
                      f"can name a node in another graph without ../ escapes)")
    if is_global:
        _, tlabel, t_global = graph_of(root, cfg, resolved)
        if not t_global:
            raise Refused(f"refused — a global node may not cite into {tlabel}. "
                          f"A claim's frame must contain the frames it depends on.")
    rels = doc.setdefault("relations", [])
    entry = next((r for r in rels
                  if r.get("to") == str(tgt) and r.get("rel") == args.rel), None)
    if entry is None:
        entry = {"rel": args.rel, "to": str(tgt)}
        rels.append(entry)
    if args.set:
        # merges, and null deletes — `--set` means the same thing in every
        # operation. Replacing wholesale would silently drop an aspect on a
        # re-link that meant to change nothing.
        attrs = entry.setdefault("attributes", {})
        for k, v in json.loads(args.set).items():
            attrs.pop(k, None) if v is None else attrs.update({k: v})
        if not attrs:
            entry.pop("attributes", None)
    errs = (validate_task if is_task else validate)(doc, args.frm)
    if errs:
        raise Refused("\n".join(errs))
    write(path, doc, body)
    print(f"{path.relative_to(root)}  -{args.rel}->  {args.to}")


def all_md(root, cfg):
    """Every markdown file including metadata.

    `walk` skips meta/ because a node walk should not treat an index as a node.
    A rename must see them: an INDEX entry is a reference like any other, and
    missing it leaves the index pointing at a file that no longer exists."""
    skip = {".git", "node_modules"}
    for p in sorted(root.rglob("*.md")):
        if not any(s in p.relative_to(root).parts for s in skip):
            yield p


def plan_mv(root, cfg, old, new):
    """(file, kind, before, after) for every reference a rename must rewrite."""
    plan = []
    for p in all_md(root, cfg):
        doc, body = read(p)
        if p.resolve() == old.resolve():
            # Its own prose links break: the file moved, so every relative path
            # out of it is measured from a different directory. This is the half
            # a naive find-and-replace misses entirely.
            for raw in set(MDLINK.findall(strip_code(body or ""))):
                tgt = (old.parent / raw).resolve()
                after = os.path.relpath(tgt, new.parent)
                if after != raw:
                    plan.append((p, "own prose", raw, after))
            continue
        for rel in (doc or {}).get("relations") or []:
            if rel.get("to") and (root / rel["to"]).resolve() == old.resolve():
                plan.append((p, "relation", rel["to"], str(new.relative_to(root))))
        for raw in set(MDLINK.findall(strip_code(body if doc else p.read_text()))):
            if (p.parent / raw).resolve() == old.resolve():
                plan.append((p, "prose", raw, os.path.relpath(new, p.parent)))
    return plan


def space_of(root, cfg, path):
    """Which space a file belongs to — the graph directory, as identity.

    A space is bounded, not merely tiered. Two sibling product spaces are both
    "local" and are still different spaces, so a closure computed on tier alone
    would drag one product's nodes through another's."""
    try:
        return graph_of(root, cfg, path)[0].resolve()
    except Refused:
        return None


def tier_of(root, cfg, path):
    """True for global, False for local, None for anything outside a graph."""
    try:
        return graph_of(root, cfg, path)[2]
    except Refused:
        return None


def check_move_tier(root, cfg, old, new):
    """A move between spaces can break the citation rule in both directions.

    Promoting carries the node's own downward edges up with it; demoting leaves
    every citation from above pointing down. `check` finds both at commit time —
    this finds them at the moment of the act, which is where they can still be
    reconsidered rather than merely repaired."""
    was, now = tier_of(root, cfg, old), tier_of(root, cfg, new)
    if was == now or now is None:
        return []
    bad = []
    doc, _ = read(old)
    if now:  # promoted: what this node cites must be global too
        for kind, raw, res in refs(root, cfg, old):
            if res.exists() and tier_of(root, cfg, res) is False:
                bad.append(f"  it cites {raw} — which stays local")
    else:    # demoted: what cites it from above may no longer
        for p, kind, _ in inbound(root, cfg, old):
            if tier_of(root, cfg, root / p):
                bad.append(f"  {p} cites it from the global tier")
    return bad


def closure_residual(root, cfg, mapping, promoting):
    """Rule violations the closure deliberately did not repair.

    Bounding the closure to one space means a dependency living in a *third*
    space is left where it is — correct, since dragging it would ship another
    product's reasoning. But the citation rule still fails, so the move has to
    say so instead of writing a broken graph quietly.

    This is the closure's refusal half: what it cannot carry is exactly what
    somebody else owns."""
    bad = []
    for node in mapping:
        if promoting:
            for _, raw, res in refs(root, cfg, node):
                if (res.exists() and res.resolve() not in mapping
                        and tier_of(root, cfg, res) is False):
                    bad.append(f"  {node.relative_to(root)}\n      cites {raw}"
                               f" — another space's node, which stays local")
        else:
            for pth, _, _ in inbound(root, cfg, node):
                res = (root / pth).resolve()
                if res not in mapping and tier_of(root, cfg, res):
                    bad.append(f"  {pth} cites {node.relative_to(root)} "
                               f"from the global tier, and is not moving")
    return bad


def move_closure(root, cfg, old, new):
    """Everything that must move with `old` for the citation rule to hold.

    Promoting: whatever it rests on that stays behind. Demoting: whatever rests
    on it from above. Both computed transitively, because the same rule applies
    to each node dragged in.

    The closure is a **test as much as an operation**. If promoting one node
    requires promoting six obviously product-specific ones, the node was not
    global — seeing the cost is usually the answer."""
    src, dst = space_of(root, cfg, old), space_of(root, cfg, new)
    if src == dst or dst is None or src is None:
        return {}
    promoting = tier_of(root, cfg, new) and not tier_of(root, cfg, old)
    src_graph, dst_graph = graph_of(root, cfg, old)[0], graph_of(root, cfg, new)[0]

    # The closure never leaves the source space. What the node rests on in
    # *other* spaces stays where it is — those are the citations that survive the
    # move, or that need awareness to survive it. Bounding here is the difference
    # between shipping one product's reasoning and shipping the whole graph.
    moving, frontier = {old.resolve()}, [old.resolve()]
    while frontier:
        nxt = []
        for node in frontier:
            if promoting:   # what it rests on, that would be left behind
                cand = [res for _, _, res in refs(root, cfg, node) if res.exists()]
            else:           # what rests on it, that would lose sight of it
                cand = [(root / pth).resolve() for pth, _, _ in inbound(root, cfg, node)]
            for res in cand:
                if space_of(root, cfg, res) == src and res not in moving:
                    moving.add(res); nxt.append(res)
        frontier = nxt
    mapping = {old.resolve(): new}
    for m in moving:
        if m != old.resolve():
            mapping[m] = dst_graph / m.relative_to(src_graph)
    return mapping


def plan_moves(root, cfg, mapping):
    """One plan for many simultaneous moves.

    References between two files that are both moving have to be re-based
    against their *final* positions, so every rewrite is computed from the whole
    mapping rather than one move at a time."""
    plan = []
    for p in all_md(root, cfg):
        doc, body = read(p)
        src = mapping.get(p.resolve(), p)
        for rel in (doc or {}).get("relations") or []:
            tgt = (root / rel["to"]).resolve() if rel.get("to") else None
            if tgt in mapping:
                plan.append((p, "relation", rel["to"],
                             str(mapping[tgt].relative_to(root))))
        for raw in set(MDLINK.findall(strip_code(body if doc else p.read_text()))):
            tgt = (p.parent / raw).resolve()
            if tgt in mapping or p.resolve() in mapping:
                final = mapping.get(tgt, tgt)
                after = os.path.relpath(final, src.parent)
                if after != raw:
                    plan.append((p, "prose", raw, after))
    return plan


def op_mv(root, cfg, args):
    old = pathlib.Path(args.old).resolve()
    new = pathlib.Path(args.new).resolve()
    if not old.is_file():
        raise Refused(f"{args.old} does not exist")
    if new.exists():
        raise Refused(f"{args.new} already exists")

    if args.closure:
        mapping = move_closure(root, cfg, old, new)
        if len(mapping) > 1:
            print(f"{len(mapping)} nodes must move together:")
            for a, b in sorted(mapping.items()):
                print(f"  {a.relative_to(root)}\n      -> {b.relative_to(root)}")
            print("\nIf any of these is obviously scoped to where it already is,"
                  "\nthe node being moved is too — that is what the closure tells you.\n")
        promoting = tier_of(root, cfg, new) and not tier_of(root, cfg, old)
        residual = closure_residual(root, cfg, mapping, promoting)
        if residual and not args.force:
            raise Refused(
                f"the closure stops at the space boundary, and {len(residual)} "
                f"edge(s) cross it:\n" + "\n".join(residual[:8])
                + (f"\n  … and {len(residual)-8} more" if len(residual) > 8 else "")
                + "\n\n  These belong to a space this move does not own, so the "
                  "closure will not\n  carry them. Promote them from their own "
                  "space first, or --force.")
        plan = plan_moves(root, cfg, mapping)
        for p, kind, before, after in plan:
            print(f"  {p.relative_to(root)}  {kind}  {before} -> {after}")
        print(f"{len(plan)} reference(s) in {len({p for p,*_ in plan})} file(s)")
        if args.dry_run:
            print("dry run — nothing written")
            return 0
        apply_plan(root, plan)
        for a, b in mapping.items():
            b.parent.mkdir(parents=True, exist_ok=True)
            a.rename(b)
        print(f"moved {len(mapping)} node(s)")
        return 0

    bad = check_move_tier(root, cfg, old, new)
    if bad and not args.force:
        raise Refused(
            f"this move crosses a space boundary and would break the citation "
            f"rule in {len(bad)} place(s):\n" + "\n".join(bad[:8])
            + (f"\n  … and {len(bad)-8} more" if len(bad) > 8 else "")
            + "\n\n  A space inherits downward only: a global claim may not rest "
              "on a local one,\n  because its frame must contain the frames it "
              "depends on. Repoint or promote\n  those first, or --force.")

    plan = plan_mv(root, cfg, old, new)
    for p, kind, before, after in plan:
        print(f"  {p.relative_to(root)}\n      {kind:10} {before}\n      {'':10} -> {after}")
    print(f"{len(plan)} reference(s) in "
          f"{len({p for p, *_ in plan})} file(s)")
    if args.dry_run:
        print("dry run — nothing written")
        return 0

    apply_plan(root, plan)

    new.parent.mkdir(parents=True, exist_ok=True)
    old.rename(new)
    print(f"moved {old.relative_to(root)} -> {new.relative_to(root)}")
    return 0


def apply_plan(root, plan):
    for p, kind, before, after in plan:
        doc, body = read(p)
        if kind == "relation":
            for rel in doc["relations"]:
                if rel.get("to") == before:
                    rel["to"] = after
            write(p, doc, body)
        else:
            def swap(m, b=before, a=after):
                return m.group(0).replace(f"({b}", f"({a}", 1) if m.group(1) == b else m.group(0)
            if doc:
                write(p, doc, MDLINK.sub(swap, body))
            else:
                p.write_text(MDLINK.sub(swap, p.read_text()))


def op_inbound(root, cfg, args):
    target = pathlib.Path(args.path).resolve()
    hits = inbound(root, cfg, target)
    if not hits:
        print("nothing cites it")
        return
    for kind in ("relation", "prose"):
        group = [h for h in hits if h[1] == kind]
        if group:
            print(f"{kind}  ({len(group)})")
            for p, _, label in group:
                print(f"    {p}")


def op_unlink(root, cfg, args):
    path, is_task = resolve_ref(root, cfg, args.frm)
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.frm} has no frontmatter")
    rels = doc.get("relations") or []
    keep = [r for r in rels
            if not (r.get("to") == args.to and (not args.rel or r.get("rel") == args.rel))]
    if len(keep) == len(rels):
        raise Refused(f"no relation to {args.to}"
                      + (f" with rel {args.rel}" if args.rel else ""))
    doc["relations"] = keep
    if not keep:
        doc.pop("relations")
    errs = (validate_task if is_task else validate)(doc, args.frm)
    if errs:
        raise Refused("\n".join(errs))
    write(path, doc, body)
    print(f"removed {len(rels) - len(keep)} relation(s) to {args.to}")


# ── tasks ─────────────────────────────────────────────────────────────────────
# A second entity, not a node kind. It drains, and it is the only thing that can
# be deleted.

COSTS, DUE = ("high", "medium", "low"), ("now", "deferred")


def task_dirs(root, cfg):
    out = []
    for pat in cfg["tasks"]:
        out += [d for d in (sorted(root.glob(pat)) if "*" in pat else [root / pat])
                if d.is_dir()]
    return out


def tasks(root, cfg):
    for d in task_dirs(root, cfg):
        for p in sorted(d.glob("*.md")):
            doc, _ = read(p)
            if doc and "id" in doc:
                # Frontmatter scalars come back as strings; a task id is a number
                # and every comparison downstream assumes so.
                try:
                    doc["id"] = int(doc["id"])
                except (TypeError, ValueError):
                    raise Refused(f"{p}: id {doc['id']!r} is not an integer")
                yield p, doc


def validate_task(doc, where):
    errs, a = [], doc.get("attributes") or {}
    if a.get("cost-if-wrong") not in COSTS:
        errs.append(f"{where}: cost-if-wrong {a.get('cost-if-wrong')!r} "
                    f"not in {'|'.join(COSTS)}")
    if a.get("due") not in DUE:
        errs.append(f"{where}: due {a.get('due')!r} not in {'|'.join(DUE)}")
    elif a["due"] == "deferred" and not a.get("due-when"):
        errs.append(f"{where}: due deferred needs due-when — the event that makes "
                    f"it due, not a date. A bare `deferred` rots the way a bare "
                    f"`provisional` would")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(a.get("queued", ""))):
        errs.append(f"{where}: queued {a.get('queued')!r} is not YYYY-MM-DD")
    # A task holds edges without becoming a node. It makes no claim — no kind, no
    # frame, no confidence — but the relations it has are real, and 140 of them
    # in the origin repo were prose because there was nowhere to put them.
    for rel in doc.get("relations") or []:
        if rel.get("rel") not in RELATIONS:
            errs.append(f"{where}: rel {rel.get('rel')!r} not in {'|'.join(RELATIONS)}")
        if not rel.get("to"):
            errs.append(f"{where}: relation missing 'to'")
    return errs


def op_task_new(root, cfg, args):
    dirs = task_dirs(root, cfg)
    if not dirs:
        raise Refused("no task directory configured")
    into = pathlib.Path(args.dir).resolve() if args.dir else dirs[0]
    path = into / f"{args.slug}.md"
    if path.exists():
        raise Refused(f"{path.relative_to(root)} already exists")

    # A counter rather than max+1. Ids are never reused, and max+1 reuses one the
    # moment the highest-numbered task is retired.
    cfgp = root / CONFIG
    raw = json.loads(cfgp.read_text())
    used = {d["id"] for _, d in tasks(root, cfg)}
    nid = max([int(raw.get("next-id", 1)), *(i + 1 for i in used)])
    attrs = {"cost-if-wrong": args.cost, "queued": str(datetime.date.today()),
             "due": args.due}
    if args.due_when:
        attrs["due-when"] = args.due_when
    doc = {"id": nid, "attributes": attrs}
    errs = validate_task(doc, str(path.relative_to(root)))
    if errs:
        raise Refused("\n".join(errs))
    into.mkdir(parents=True, exist_ok=True)
    write(path, doc, f"\n# {args.slug.replace('-', ' ').capitalize()}\n")
    raw["next-id"] = nid + 1
    cfgp.write_text(json.dumps(raw, indent=2) + "\n")
    print(f"wrote {path.relative_to(root)}  (id {nid})")


def op_task_retire(root, cfg, args):
    hit = [(p, d) for p, d in tasks(root, cfg) if d["id"] == int(args.id)]
    if not hit:
        raise Refused(f"no task with id {args.id}")
    path, _ = hit[0]
    refs_in = inbound(root, cfg, path)
    if refs_in and not args.force:
        lines = "\n".join(f"    {p}  ({kind})" for p, kind, _ in refs_in)
        raise Refused(
            f"{len(refs_in)} inbound reference(s) to {path.relative_to(root)}:\n"
            f"{lines}\n"
            f"  Repoint them, or --force. A task drains — its content moved — but a\n"
            f"  reference left behind asserts work that no longer exists, and that\n"
            f"  is where blockers that already cleared are found.")
    path.unlink()
    print(f"retired {path.relative_to(root)}"
          + (f" (forced past {len(refs_in)} reference(s))" if refs_in else ""))


# Ranking is question-independent, so it is mechanical. A verified fact is worth
# more than a partial one whatever you asked; an open decision is worth flagging
# whatever you asked. What none of it can know is whether any of this answers the
# question in front of you — that is the agent's, and it is the whole of the
# agent's job here.
TRUST = {"verified": 0, "decided": 1, "partial": 2, "provisional": 3,
         "attested": 4, "open": 5, "thesis": 6}


def edges(root, cfg):
    """(outbound, inbound, state) over every typed relation in the graph."""
    out, inn, state = {}, {}, {}
    for p in all_md(root, cfg):
        doc, _ = read(p)
        if not doc or not ("kind" in doc or "id" in doc):
            continue
        if "id" in doc:   # a task: no kind, but its edges are real
            rel, a = str(p.relative_to(root)), doc.get("attributes") or {}
            state[rel] = (f"task {doc['id']}", p.stem.replace("-", " "))
            for r in doc.get("relations") or []:
                if r.get("to"):
                    out.setdefault(rel, []).append((r["rel"], r["to"]))
                    inn.setdefault(r["to"], []).append((r["rel"], rel))
            continue
        rel, a = str(p.relative_to(root)), doc.get("attributes") or {}
        state[rel] = (a.get("status") or a.get("confidence") or doc["kind"],
                      a.get("title", p.stem))
        for r in doc.get("relations") or []:
            if r.get("to"):
                out.setdefault(rel, []).append((r["rel"], r["to"]))
                inn.setdefault(r["to"], []).append((r["rel"], rel))
    return out, inn, state


def op_neighbors(root, cfg, args):
    """An ego graph — the induced neighbourhood within a radius of one node.

    Returns a *list*, not the nodes. Searching is not reading: on this graph a
    two-hop list costs ~161 tokens where reading what it names costs ~14,000, and
    the list carries enough — trust tier, hop distance, edge type — to choose."""
    seed = str(resolve_ref(root, cfg, args.path)[0].relative_to(root))
    out, inn, state = edges(root, cfg)
    if seed not in state:
        raise Refused(f"{args.path} is not a node")

    seen, frontier, rows = {seed}, [seed], []
    for hop in range(1, args.hops + 1):
        nxt = []
        for n in frontier:
            for rel, t in out.get(n, []) + inn.get(n, []):
                if t not in seen and t in state:
                    seen.add(t)
                    nxt.append(t)
                    rows.append((hop, rel, t, "out" if any(
                        x == t for _, x in out.get(n, [])) else "in"))
        frontier = nxt
    if not rows:
        print("no typed neighbours — this node has no relations and none point at it")
        return 0

    rows.sort(key=lambda r: (r[0], TRUST.get(state[r[2]][0], 9), r[2]))
    for hop, rel, n, direction in rows:
        st, title = state[n]
        arrow = "->" if direction == "out" else "<-"
        print(f"{hop}  {arrow} {rel:16} {st:11} {n}")
        print(f"          {title}")
        if args.frontmatter:
            doc, _ = read(root / n)
            for line in _emit(doc.get("attributes") or {}, 10).split("\n"):
                print(line)
    print(f"\n{len(rows)} neighbours within {args.hops} hop(s) of {seed}")
    return 0


def op_stale(root, cfg, args):
    today = datetime.date.today()
    overdue, provisional = [], []
    for gdir, label, _ in graphs(root, cfg):
        for p in sorted(gdir.rglob("*.md")):
            if cfg["meta"] in p.relative_to(root).parts:
                continue
            doc, _ = read(p)
            if not doc:
                continue
            a = doc.get("attributes") or {}
            r = a.get("recheck")
            if r and str(r) < str(today):
                overdue.append((p.relative_to(root), r))
            if doc.get("kind") == "decision" and a.get("status") == "provisional":
                provisional.append((p.relative_to(root), a.get("revisit-when", "—"),
                                    a.get("decided", "—")))
    print(f"recheck overdue  {len(overdue)}")
    for rel, when in overdue:
        print(f"    {rel}  {when}")
    print(f"\nprovisional, trigger unread  {len(provisional)}")
    for rel, trig, dec in provisional:
        print(f"    {rel}  ({dec})\n        {trig}")
    print("\nListed, not decided. Whether a trigger has fired is an event in the "
          "world.")


# ── migration ─────────────────────────────────────────────────────────────────

TYPE_TO_KIND = {"decision": "decision", "thesis": "thesis", "concept": "concept",
                "regulation": "fact", "vendor-capability": "fact",
                "domain-fact": "fact", "pattern": "fact"}


def migrate_doc(root, cfg, path, doc):
    """Flat frontmatter to kind/attributes/relations. Returns None if already new.

    The relation rebase is the part that cannot be done by hand at scale: `to`
    was relative to the *graph* root, so a cross-tier edge needed ../ escapes out
    of its own graph. Each one is resolved against the old base and re-expressed
    against the repository root."""
    if "attributes" in doc or "kind" in doc:
        return None
    old_type = doc.get("type")
    if old_type is None:
        return None
    kind = TYPE_TO_KIND.get(old_type)
    if kind is None:
        raise Refused(f"{path}: unknown type {old_type!r}")

    gdir, _, _ = graph_of(root, cfg, path)
    rels = []
    for entry in doc.get("relations") or []:
        for rel, tgt in entry.items():
            resolved = (gdir / tgt).resolve()
            if not resolved.exists():
                raise Refused(f"{path}: relation {rel} -> {tgt} does not resolve")
            rels.append({"rel": rel, "to": str(resolved.relative_to(root))})

    attrs = {k: v for k, v in doc.items() if k not in ("type", "relations")}
    ordered = {"title": attrs.pop("title", None)}
    ordered["compiled"] = attrs.pop("compiled", None)
    ordered.update(attrs)
    attrs = {k: v for k, v in ordered.items() if v is not None}

    out = {"kind": kind, "attributes": attrs}
    if kind == "fact" and old_type != "domain-fact":
        attrs["labels"] = [old_type]
    elif old_type == "domain-fact":
        attrs["labels"] = ["domain-fact"]
    if rels:
        out["relations"] = rels
    return out


def migrate_task(doc):
    if "attributes" in doc:
        return None
    tid = doc.get("id")
    if tid is None:
        return None
    return {"id": int(tid),
            "attributes": {k: v for k, v in doc.items() if k != "id"}}


def op_migrate(root, cfg, args):
    targets = [pathlib.Path(args.path).resolve()] if args.path else None
    done = skipped = 0
    errs = []
    for gdir, label, _ in graphs(root, cfg):
        for p in sorted(gdir.rglob("*.md")):
            if cfg["meta"] in p.relative_to(root).parts:
                continue
            if targets and p.resolve() not in targets:
                continue
            doc, body = read(p)
            if not doc:
                continue
            new = migrate_doc(root, cfg, p, doc)
            if new is None:
                skipped += 1
                continue
            bad = validate(new, str(p.relative_to(root)))
            if bad:
                errs += bad
                continue
            done += 1
            print(f"  {p.relative_to(root)}  {doc.get('type')} -> kind {new['kind']}"
                  + (f" labels {new['attributes']['labels']}"
                     if "labels" in new["attributes"] else ""))
            for r in new.get("relations") or []:
                print(f"      {r['rel']:16} {r['to']}")
            if not args.dry_run:
                write(p, new, body)
    for d in task_dirs(root, cfg):
        for p in sorted(d.glob("*.md")):
            if targets and p.resolve() not in targets:
                continue
            doc, body = read(p)
            if not doc:
                continue
            new = migrate_task(doc)
            if new is None:
                skipped += 1
                continue
            bad = validate_task(new, str(p.relative_to(root)))
            if bad:
                errs += bad
                continue
            done += 1
            print(f"  {p.relative_to(root)}  task {new['id']}")
            if not args.dry_run:
                write(p, new, body)
    for e in errs:
        print(f"ERROR {e}")
    print(f"\n{done} migrated, {skipped} already current, {len(errs)} errors")
    if args.dry_run:
        print("dry run — nothing written")
    return 1 if errs else 0


# ── the derived layer ─────────────────────────────────────────────────────────
# One job: materialise the files a session loads. Browsing, querying and
# exploring belong to a viewer, later — this exists because an @-import is a file.

def live_nodes(root, cfg):
    """(path, label, kind, state) for every node still in the live graph."""
    out = []
    for gdir, label, _ in graphs(root, cfg):
        for p in sorted(gdir.rglob("*.md")):
            if cfg["meta"] in p.relative_to(root).parts:
                continue
            doc, _ = read(p)
            if not doc or "kind" not in doc:
                continue
            a = doc.get("attributes") or {}
            if a.get("status") == "superseded":
                continue
            kind = doc["kind"]
            state = (a.get("status") if kind == "decision"
                     else "thesis" if kind == "thesis"
                     else a.get("confidence", "?"))
            out.append((p, label, kind, state, a))
    return out


def render_queue(root, cfg):
    items = []
    for p, d in tasks(root, cfg):
        a = d.get("attributes") or {}
        items.append({"id": d["id"], "kind": "task", "cost": a.get("cost-if-wrong"),
                      "due": a.get("due"), "queued": a.get("queued"),
                      "path": str(p.relative_to(root))})
    for p, label, kind, state, a in live_nodes(root, cfg):
        if kind == "decision" and state == "open":
            items.append({"id": None, "kind": "open decision", "cost": "—",
                          "due": "—", "queued": "—", "path": str(p.relative_to(root))})
    order = {"high": 0, "medium": 1, "low": 2}
    items.sort(key=lambda q: (0 if q["kind"] == "open decision" else 1,
                              0 if q["due"] == "now" else 1,
                              order.get(q["cost"], 9), str(q["queued"]), q["path"]))
    head = ["| ID | Kind | Cost | Due | Queued | File |",
            "|----|------|------|-----|--------|------|"]
    def rows(g):
        return [f"| {q['id'] if q['id'] else '—'} | {q['kind']} | {q['cost']} | "
                f"{q['due']} | {q['queued']} | `{q['path']}` |" for q in g]
    out = ["# Queue", "",
           "**Generated by `kg build`. Do not edit** — change the source files and",
           "rebuild.", "",
           "Everything pending, in one place, so nothing survives only in a",
           f"conversation. At most **{CAP}** items are surfaced; the rest are held.",
           "", "**Order.** Open decisions first, then everything `due: now` before",
           "anything `deferred`, then by `cost-if-wrong`, then oldest first.", "",
           f"## Surfaced — {min(CAP, len(items))} of {len(items)}", "",
           *head, *rows(items[:CAP])]
    if items[CAP:]:
        out += ["", f"## Held — {len(items[CAP:])}", "", *head, *rows(items[CAP:])]
    return "\n".join(out) + "\n"


def render_map_blocks(root, cfg):
    nodes, excluded, overdue = live_nodes(root, cfg), 0, 0
    today = str(datetime.date.today())
    for gdir, _, _ in graphs(root, cfg):
        for p in gdir.rglob("*.md"):
            if cfg["meta"] in p.relative_to(root).parts:
                continue
            doc, _ = read(p)
            if doc and (doc.get("attributes") or {}).get("status") == "superseded":
                excluded += 1
    by_graph = {}
    for p, label, kind, state, a in nodes:
        r = a.get("recheck")
        stale = " STALE" if r and str(r) < today else ""
        if stale:
            overdue += 1
        by_graph.setdefault(label, []).append(
            (str(p.relative_to(root)), f"{state}{stale}", a.get("title", p.stem)))
    total = len(nodes)
    degrade = total * 14 > MAP_BUDGET
    listing = []
    for label in sorted(by_graph, key=lambda l: (l.count("/"), l)):
        items = sorted(by_graph[label])
        if degrade:
            listing.append(f"{label}/  {len(items)} nodes")
            continue
        listing.append(f"### {label}/")
        listing += [f"- `{rel}` · {st} · {ti}" for rel, st, ti in items]
        listing.append("")
    if degrade:
        listing += ["", f"*Listing degraded to counts: the node list would exceed "
                    f"the {MAP_BUDGET}-token budget. Read each graph's "
                    f"`meta/INDEX.md` to drill.*"]
    pressure = [f"- budget    {total * 14} of {MAP_BUDGET} tokens"
                f"{' — DEGRADED' if degrade else ''}",
                f"- nodes     {total} listed, {excluded} excluded (superseded)",
                f"- recheck   {overdue} overdue"]
    return {"listing": "\n".join(listing).rstrip() + "\n",
            "pressure": "\n".join(pressure) + "\n"}


def op_build(root, cfg, args):
    stale = []
    q = root / cfg["meta"] / "QUEUE.md"
    want = render_queue(root, cfg)
    if not q.exists() or q.read_text() != want:
        stale.append(q)
        if not args.check:
            q.parent.mkdir(parents=True, exist_ok=True)
            q.write_text(want)

    m = root / cfg["meta"] / "MAP.md"
    if m.exists():
        blocks, text = render_map_blocks(root, cfg), m.read_text()
        rebuilt = GEN.sub(lambda x: x.group(1) + blocks.get(x.group(2), x.group(3))
                          + x.group(4), text)
        if rebuilt != text:
            stale.append(m)
            if not args.check:
                m.write_text(rebuilt)
    for s in stale:
        print(("stale: " if args.check else "wrote ") + str(s.relative_to(root)))
    if not stale:
        print("up to date")
    return 1 if (stale and args.check) else 0


def op_check(root, cfg, args):
    errs, warns = [], []
    for p in walk(root, cfg):
        rel = p.relative_to(root)
        try:
            _, _, src_global = graph_of(root, cfg, p)
        except Refused:
            src_global = None
        for kind, raw, resolved in refs(root, cfg, p):
            if not resolved.exists():
                errs.append(f"{rel}: broken {kind} link -> {raw}")
                continue
            if src_global:
                try:
                    _, tlabel, t_global = graph_of(root, cfg, resolved)
                    if not t_global:
                        errs.append(f"{rel}: global node cites into {tlabel} -> {raw}")
                except Refused:
                    pass
        if src_global:
            doc, body = read(p)
            for n, line in enumerate((body or "").split("\n"), 1):
                if line.lstrip().startswith(">"):
                    continue
                clean = re.sub(r'"[^"\n]*"', "", re.sub(r"https?://\S+", "", line))
                m = re.search(r"\b(we|us|our|ours)\b", clean, re.I)
                if m and m.group(0) != "US":
                    warns.append(f"{rel}:{n}: first person plural at the global tier "
                                 f"— reasoning needing an \"us\" is scope-bound")
                    break
    today = str(datetime.date.today())
    cited, census = set(), {"kinds": {}, "status": {}, "tasks": 0}

    for p in all_md(root, cfg):
        for _, _, resolved in refs(root, cfg, p):
            cited.add(resolved)

    for path, label, kind, state, a in live_nodes(root, cfg):
        rel = path.relative_to(root)
        census["kinds"][kind] = census["kinds"].get(kind, 0) + 1
        if kind == "decision":
            census["status"][state] = census["status"].get(state, 0) + 1
        idx = index_of(root, cfg, root / label)
        if not idx.exists():
            errs.append(f"{label}/{cfg['meta']}/INDEX.md is missing")
        elif str(path.relative_to(root / label)) not in idx.read_text():
            errs.append(f"{rel}: not listed in {idx.relative_to(root)}")
        if path.resolve() not in cited:
            warns.append(f"{rel}: no inbound link from another node")
        r = a.get("recheck")
        if r and str(r) < today:
            warns.append(f"{rel}: recheck overdue since {r}")
    census["tasks"] = sum(1 for _ in tasks(root, cfg))

    # The watermark cannot show the map's commentary is right. It proves nobody
    # has looked at the graph changes since it was written.
    m = root / cfg["meta"] / "MAP.md"
    if m.exists():
        w = WATERMARK.search(m.read_text())
        if not w:
            warns.append(f"{m.relative_to(root)}: no `reconciled: <sha>` line")
        else:
            paths = [g["path"] for g in cfg["graphs"]]
            since = git("log", "--oneline", f"{w.group(1)}..HEAD", "--", *paths,
                        cwd=root)
            n = len(since.splitlines())
            if n:
                warns.append(
                    f"{m.relative_to(root)}: commentary reconciled at "
                    f"{w.group(1)[:7]}; {n} commit(s) have touched a graph since")

    for w in warns:
        print(f"warn  {w}")
    for e in errs:
        print(f"ERROR {e}")
    kinds = " · ".join(f"{n} {k}" for k, n in sorted(census["kinds"].items()))
    st = " · ".join(f"{n} {s}" for s, n in sorted(census["status"].items(),
                                                  key=lambda kv: -kv[1]))
    print(f"\n{sum(census['kinds'].values())} nodes, {len(errs)} errors, "
          f"{len(warns)} warnings")
    print(f"census  {kinds} | decisions {st} | tasks {census['tasks']}")
    return 1 if errs else 0


def op_init(root, cfg, args):
    raise Refused("unreachable — init runs before a config exists")


def do_init(args):
    root = pathlib.Path.cwd()
    cfgp = root / CONFIG
    if cfgp.exists():
        print(f"{CONFIG} already exists"); return 1
    cfg = {"graphs": [{"path": g, "tier": "global" if i == 0 else "local"}
                      for i, g in enumerate(args.graphs)],
           "tasks": args.tasks, "meta": args.meta, "next-id": 1}
    cfgp.write_text(json.dumps(cfg, indent=2) + "\n")
    for g in args.graphs:
        if "*" not in g:
            (root / g / args.meta).mkdir(parents=True, exist_ok=True)
    for d in args.tasks:
        if "*" not in d:
            (root / d).mkdir(parents=True, exist_ok=True)
    print(f"wrote {CONFIG}")
    print("\nOne thing this cannot do for you — hook paths are local config and "
          "do not travel with a clone:\n\n    git config core.hooksPath .githooks\n")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(prog="kg")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("new"); p.set_defaults(fn=op_new)
    p.add_argument("path"); p.add_argument("--title")
    p.add_argument("--kind"); p.add_argument("--set")

    p = sub.add_parser("set"); p.set_defaults(fn=op_set)
    p.add_argument("ref"); p.add_argument("--set", required=True)

    p = sub.add_parser("link"); p.set_defaults(fn=op_link)
    p.add_argument("frm"); p.add_argument("to")
    p.add_argument("--rel", required=True, choices=RELATIONS)
    p.add_argument("--set")

    p = sub.add_parser("mv"); p.set_defaults(fn=op_mv)
    p.add_argument("old"); p.add_argument("new")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--force", action="store_true")
    p.add_argument("--closure", action="store_true")

    p = sub.add_parser("inbound"); p.set_defaults(fn=op_inbound)
    p.add_argument("path")

    p = sub.add_parser("supersede"); p.set_defaults(fn=op_supersede)
    p.add_argument("path"); p.add_argument("--title"); p.add_argument("--set")

    p = sub.add_parser("unlink"); p.set_defaults(fn=op_unlink)
    p.add_argument("frm"); p.add_argument("to"); p.add_argument("--rel")

    p = sub.add_parser("build"); p.set_defaults(fn=op_build)
    p.add_argument("--check", action="store_true")

    p = sub.add_parser("migrate"); p.set_defaults(fn=op_migrate)
    p.add_argument("path", nargs="?"); p.add_argument("--dry-run", action="store_true")

    p = sub.add_parser("neighbors"); p.set_defaults(fn=op_neighbors)
    p.add_argument("path"); p.add_argument("--hops", type=int, default=2)
    p.add_argument("--frontmatter", action="store_true")

    p = sub.add_parser("stale"); p.set_defaults(fn=op_stale)
    p = sub.add_parser("check"); p.set_defaults(fn=op_check)

    tk = sub.add_parser("task").add_subparsers(dest="tcmd", required=True)
    p = tk.add_parser("new"); p.set_defaults(fn=op_task_new)
    p.add_argument("slug"); p.add_argument("--cost", required=True, choices=COSTS)
    p.add_argument("--due", required=True, choices=DUE)
    p.add_argument("--due-when"); p.add_argument("--dir")
    p = tk.add_parser("retire"); p.set_defaults(fn=op_task_retire)
    p.add_argument("id"); p.add_argument("--force", action="store_true")

    p = sub.add_parser("init"); p.set_defaults(fn=None)
    p.add_argument("--graphs", nargs="+", default=["knowledge"])
    p.add_argument("--tasks", nargs="+", default=["tasks"])
    p.add_argument("--meta", default="meta")

    args = ap.parse_args(argv)
    if args.cmd == "init":
        return do_init(args)
    try:
        root = find_root()
        return args.fn(root, load_config(root), args) or 0
    except Refused as e:
        print(f"refused: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
