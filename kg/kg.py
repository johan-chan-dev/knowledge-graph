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
import sys

CONFIG = ".kg.json"

KINDS = {
    #  kind        required attributes            forbidden attributes
    "fact":     (("title", "confidence", "compiled", "recheck"), ()),
    "concept":  (("title", "confidence", "compiled"), ("recheck",)),
    "decision": (("title", "status", "serves"), ("confidence", "recheck")),
    "thesis":   (("title", "basis", "would-falsify"), ("confidence", "recheck")),
}
STATUS = ("open", "provisional", "decided", "superseded")
CONFIDENCE = ("verified", "partial", "attested")
RELATIONS = ("supersedes", "contradicts", "depends-on", "does-not-satisfy")
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

    # Dated, not numbered. Every other date in the schema is a date, a version
    # number carries no information, and an archive sorts chronologically beside
    # the node it came from. The date is when the snapshot was taken — when this
    # version stopped being current — which is the one fact the file does not
    # otherwise hold.
    today = str(datetime.date.today())
    archive = path.parent / f"{path.stem}.{today}.md"
    n = 2
    while archive.exists():
        archive = path.parent / f"{path.stem}.{today}-{n}.md"
        n += 1

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


def op_set(root, cfg, args):
    path = pathlib.Path(args.ref).resolve()
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
    errs = validate(doc, args.ref)
    if errs:
        raise Refused("refused — the result would be invalid:\n" + "\n".join(errs))
    write(path, doc, body)
    print(f"updated {path.relative_to(root)}")


def op_link(root, cfg, args):
    path = pathlib.Path(args.frm).resolve()
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.frm} is not a node")
    _, _, is_global = graph_of(root, cfg, path)
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
    errs = validate(doc, args.frm)
    if errs:
        raise Refused("\n".join(errs))
    write(path, doc, body)
    print(f"{args.frm}  -{args.rel}->  {args.to}")


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


def op_mv(root, cfg, args):
    old = pathlib.Path(args.old).resolve()
    new = pathlib.Path(args.new).resolve()
    if not old.is_file():
        raise Refused(f"{args.old} does not exist")
    if new.exists():
        raise Refused(f"{args.new} already exists")

    plan = plan_mv(root, cfg, old, new)
    for p, kind, before, after in plan:
        print(f"  {p.relative_to(root)}\n      {kind:10} {before}\n      {'':10} -> {after}")
    print(f"{len(plan)} reference(s) in "
          f"{len({p for p, *_ in plan})} file(s)")
    if args.dry_run:
        print("dry run — nothing written")
        return 0

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

    new.parent.mkdir(parents=True, exist_ok=True)
    old.rename(new)
    print(f"moved {old.relative_to(root)} -> {new.relative_to(root)}")
    return 0


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
    path = pathlib.Path(args.frm).resolve()
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.frm} is not a node")
    rels = doc.get("relations") or []
    keep = [r for r in rels
            if not (r.get("to") == args.to and (not args.rel or r.get("rel") == args.rel))]
    if len(keep) == len(rels):
        raise Refused(f"no relation to {args.to}"
                      + (f" with rel {args.rel}" if args.rel else ""))
    doc["relations"] = keep
    if not keep:
        doc.pop("relations")
    errs = validate(doc, args.frm)
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
    for w in warns:
        print(f"warn  {w}")
    for e in errs:
        print(f"ERROR {e}")
    print(f"\n{len(errs)} errors, {len(warns)} warnings")
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

    p = sub.add_parser("inbound"); p.set_defaults(fn=op_inbound)
    p.add_argument("path")

    p = sub.add_parser("supersede"); p.set_defaults(fn=op_supersede)
    p.add_argument("path"); p.add_argument("--title"); p.add_argument("--set")

    p = sub.add_parser("unlink"); p.set_defaults(fn=op_unlink)
    p.add_argument("frm"); p.add_argument("to"); p.add_argument("--rel")

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
