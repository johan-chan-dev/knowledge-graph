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
GEN = re.compile(r"(<!-- generated:(\w+) -->\n)(.*?)(<!-- /generated:\2 -->)", re.S)
SOURCE_URL = re.compile(r"https?://\S+")
WATERMARK = re.compile(r"^reconciled: ([0-9a-f]{7,40})$", re.M)

# The methodology is NOT compiled in. Kinds, relations, enumerations, frames and
# the queue cap are practice, not mechanism, and they live in `.kg.json` where
# they can be read, versioned with the graph, and changed without a release.
# `practice.default.json` beside this file is what `init` copies in; nothing
# falls back to it at runtime, so a repository always states what it holds itself
# to.

def practice(cfg):
    p = cfg.get("practice")
    if not p:
        raise Refused(
            ".kg.json has no `practice` block, and there is no built-in default "
            "to fall back on.\n\n  The methodology is data: kinds, relations, "
            "enumerations, frames, the queue cap.\n  Copy the starting set from "
            f"{pathlib.Path(__file__).parent / 'practice.default.json'}\n  into "
            '.kg.json under "practice", and edit it to what you actually hold '
            "yourself to.")
    return p


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
    """(dir, label, shared) for every graph, globs expanded."""
    out = []
    for g in cfg["graphs"]:
        for d in sorted(root.glob(g["path"])) if "*" in g["path"] else [root / g["path"]]:
            if d.is_dir():
                out.append((d, str(d.relative_to(root)), g.get("scope") == "shared"))
    return out


def graph_of(root, cfg, path):
    path = path.resolve()
    for d, label, shared in graphs(root, cfg):
        if d.resolve() in path.parents:
            return d, label, shared
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

def _enum_errs(pr, attrs, where):
    errs = []
    for field, allowed in (pr.get("enums") or {}).items():
        v = attrs.get(field)
        if v is not None and v not in allowed:
            errs.append(f"{where}: {field} {v!r} not in {'|'.join(allowed)}")
    return errs


def _conditional_errs(pr, attrs, where):
    """Requirements that depend on a value, e.g. attested needs a basis.

    `when` matches attributes: a plain value, or {"not": value}. It fires only
    when the field is present, so a missing field is one error from `requires`
    rather than two."""
    errs = []
    for rule in pr.get("conditional") or []:
        hit = True
        for field, want in (rule.get("when") or {}).items():
            have = attrs.get(field)
            if have is None:
                hit = False; break
            if isinstance(want, dict) and "not" in want:
                if have == want["not"]:
                    hit = False; break
            elif have != want:
                hit = False; break
        if not hit:
            continue
        for k in rule.get("requires") or []:
            if not attrs.get(k):
                cond = ", ".join(f"{f}={v!r}" for f, v in rule["when"].items())
                why = rule.get("why")
                errs.append(f"{where}: {cond} requires attributes.{k}"
                            + (f" — {why}" if why else ""))
    return errs


def _relation_errs(pr, doc, where):
    errs, rels = [], pr.get("relations") or []
    for rel in doc.get("relations") or []:
        if rel.get("rel") not in rels:
            errs.append(f"{where}: rel {rel.get('rel')!r} not in {'|'.join(rels)}")
        if not rel.get("to"):
            errs.append(f"{where}: relation missing 'to'")
    return errs


def _date_errs(pr, attrs, where):
    errs = []
    for key in pr.get("dates") or []:
        raw = attrs.get(key)
        if raw and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(raw)):
            errs.append(f"{where}: attributes.{key} {raw!r} is not YYYY-MM-DD")
    return errs


def validate(cfg, doc, where="node"):
    pr = practice(cfg)
    errs = []
    kind = doc.get("kind")
    attrs = doc.get("attributes") or {}
    if kind is None:
        # Unqualified. `kind` is a judgement about what a thing IS, so its
        # absence is the positive statement that nobody has made that judgement
        # yet. Nothing about a raw node is checkable, because it claims nothing.
        return []
    kinds = pr.get("kinds") or {}
    if kind not in kinds:
        return [f"{where}: kind {kind!r} not in {'|'.join(kinds)}"]
    spec = kinds[kind]

    for k in spec.get("requires") or []:
        if not attrs.get(k):
            errs.append(f"{where}: kind {kind} requires attributes.{k}")
    for k, why in (spec.get("forbids") or {}).items():
        if k in attrs:
            errs.append(f"{where}: kind {kind} must not carry attributes.{k} — {why}")

    errs += _enum_errs(pr, attrs, where)
    errs += _conditional_errs(pr, attrs, where)

    for facet in pr.get("frames") or []:
        v = attrs.get(facet)
        if v is None:
            continue
        if not isinstance(v, list):
            errs.append(f"{where}: attributes.{facet} must be a list, e.g. [fr, eu]")
        elif pr.get("universal") in v and len(v) > 1:
            errs.append(f"{where}: attributes.{facet} {v} — "
                        f"{pr.get('universal')} is exclusive; a claim holding across "
                        f"every value cannot also be bound to some")

    errs += _date_errs(pr, attrs, where)
    errs += _relation_errs(pr, doc, where)
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


def generated(root, cfg):
    """The derived layer — the files `build` writes whole.

    Half of `meta/` is generated and half is authored, and one predicate was
    being applied to both. These two regenerate from the graph, so link-checking
    them reports on the generator rather than on the graph. An INDEX is
    hand-maintained and its links are claims like any other."""
    return {(root / cfg["meta"] / "QUEUE.md").resolve(),
            (root / cfg["meta"] / "MAP.md").resolve()}


def walk(root, cfg, meta=False):
    """Every markdown file that is not metadata, with whether it is a node.

    `meta=True` also yields the AUTHORED metadata — the per-graph indexes —
    while still skipping the generated layer. Callers asking about *references*
    want it, and two were silently getting no answer: `check` link- and
    scope-checked no index, and `inbound` could not see a citation from one.
    The second defeats `task retire`, which exists to refuse on inbound
    references and cannot refuse on one it cannot see."""
    skip = {".git", "node_modules"}
    gen = generated(root, cfg) if meta else set()
    for p in sorted(root.rglob("*.md")):
        parts = p.relative_to(root).parts
        if any(s in parts for s in skip):
            continue
        if cfg["meta"] in parts and (not meta or p.resolve() in gen):
            continue
        yield p


def inbound(root, cfg, target):
    """What cites `target`. Reports everything, and labels the scope.

    Deliberately not filtered. The scope rule governs which edges may be *stored*
    and what a root reader is shown in a *rendered view* — not what an explicit
    impact query may answer. "What breaks if this changes?" is the question the
    operation exists for, and for a shared node the answer is mostly personal."""
    target = target.resolve()
    hits = []
    for p in walk(root, cfg, meta=True):
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
    if kind is not None:
        ordered["compiled"] = attrs.pop("compiled", str(datetime.date.today()))
    ordered.update(attrs)
    attrs = {k: v for k, v in ordered.items() if v is not None}
    doc = {"attributes": attrs} if kind is None else {"kind": kind,
                                                       "attributes": attrs}
    errs = validate(cfg, doc, args.path)
    if errs:
        raise Refused("\n".join(errs))
    # A node outside every declared graph is raw: it belongs to no scope, so it
    # has no index to appear in and nothing to be checked against. That is not a
    # gap — an index is a map of claims, and a raw node makes none. Refusing to
    # write one here would force the raw layer to be a graph, which would then
    # warn about every fresh capture having no inbound link.
    try:
        gdir = graph_of(root, cfg, path)[0]
    except Refused:
        gdir = None
    if gdir is None and kind is not None:
        raise Refused(f"{args.path} is outside every graph, so it cannot carry a "
                      f"kind — qualifying a claim is what a graph is for. Drop "
                      f"--kind to write it raw, or put it inside a graph.")
    path.parent.mkdir(parents=True, exist_ok=True)
    if not body.strip() and attrs.get("title"):
        body = f"\n# {attrs['title']}\n"
    write(path, doc, body)
    print(f"wrote {path.relative_to(root)}")
    if gdir is not None:
        index_add(root, cfg, gdir, path.relative_to(gdir), attrs["title"])
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
    # Which kinds have versions is practice, declared per kind as `versioned`.
    # It was hardcoded to `decision` on the argument that a fact is corrected in
    # place while a choice has a history — a real argument, and one a different
    # methodology may answer differently.
    kinds = practice(cfg).get("kinds") or {}
    versioned = [k for k, s in kinds.items() if s.get("versioned")]
    if doc.get("kind") not in versioned:
        raise Refused(
            f"refused — {args.path} is a {doc.get('kind') or 'raw node'}, and "
            f"{'|'.join(versioned) or 'nothing'} carries versions in this "
            f"repository's practice.\n\n  Supersession inserts into a chain of "
            f"states. Something corrected in place has no chain — git holds that "
            f"history.\n  Change `versioned` in .kg.json if that is wrong here.")
    patch = json.loads(args.set) if args.set else {}
    if args.title:
        patch["title"] = args.title
    if "kind" not in doc:
        raise Refused("this node is unqualified — nothing has been decided about "
                      "it, so there is no version of it to keep. Supersession "
                      "inserts into a chain of judgements; make one first.")

    # Which fields a new version must restate is practice, declared per kind as
    # `renews`. It was hardcoded to `revisit-when` on a decision-specific
    # argument: the trigger names the event that would unmake the choice, so if
    # you are superseding, that event either fired or was wrong and carrying it
    # forward would be a lie. True of decisions; not of every versioned thing.
    for k in (practice(cfg).get("kinds") or {}).get(doc["kind"], {}).get("renews") or []:
        if not patch.get(k):
            raise Refused(
                f"refused — a new version of a {doc['kind']} needs its own {k} "
                f"in --set. It is never carried forward.")

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
    errs = validate(cfg, snap, str(archive.relative_to(root)))
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
    errs = validate(cfg, doc, args.path)
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
    errs = (validate_task if is_task else validate)(cfg, doc, args.ref)
    if errs:
        raise Refused("refused — the result would be invalid:\n" + "\n".join(errs))
    write(path, doc, body)
    print(f"updated {path.relative_to(root)}")


def op_link(root, cfg, args):
    path, is_task = resolve_ref(root, cfg, args.frm)
    doc, body = read(path)
    if not doc:
        raise Refused(f"{args.frm} has no frontmatter")
    # A raw node belongs to no graph, so it has no scope and the citation rule
    # cannot apply to it in either direction. That is not a loophole: the rule
    # constrains what a *claim* may rest on, and a raw node makes no claim. The
    # extraction edge — a qualified node pointing at what it was drawn from — is
    # the whole reason the boundary has to be crossable.
    src_space = None if is_task else space_of(root, cfg, path)
    tgt = pathlib.Path(args.to)
    resolved = (root / tgt).resolve()
    if not resolved.exists():
        raise Refused(f"relation target does not resolve: {args.to} "
                      f"(a relation's `to` is relative to the repository root, so it "
                      f"can name a node in another graph without ../ escapes)")
    # One rule, and it generalises to any number of spaces: a citation is
    # allowed only where the target's frame CONTAINS the source's. Shared
    # contains everything, so it is always citable. A personal space contains
    # only itself — which makes two sibling products disjoint, and a claim in
    # one resting on a claim in the other is the same violation as shared citing
    # personal, turned sideways. A raw node has no frame at all and is exempt.
    #
    # The boolean this replaced could not see that: two personal spaces both
    # read False, so the sideways case passed. `move_closure` was bounded by
    # space when it was written; this is the same correction to the rule.
    tgt_space = space_of(root, cfg, resolved)
    if (src_space is not None and tgt_space is not None
            and not is_shared(root, cfg, resolved) and tgt_space != src_space):
        raise Refused(
            f"refused — {graph_of(root, cfg, path)[1]} may not cite into "
            f"{graph_of(root, cfg, resolved)[1]}. A claim's frame must contain "
            f"the frames it depends on, and these two spaces are disjoint.\n\n"
            f"  If the target claim really holds for both, it is shared: move it "
            f"up and cite it there.")
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
    errs = (validate_task if is_task else validate)(cfg, doc, args.frm)
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

    A space is bounded, not merely ordered. Two sibling product spaces are both
    personal and are still different spaces, so a closure computed on scope alone
    would drag one product's nodes through another's."""
    try:
        return graph_of(root, cfg, path)[0].resolve()
    except Refused:
        return None


def is_shared(root, cfg, path):
    """True for shared, False for personal, None for anything outside a graph.

    The tristate matters: None is *unknown*, not personal. A caller treating
    it as falsy exempts every file living outside a declared graph."""
    try:
        return graph_of(root, cfg, path)[2]
    except Refused:
        return None


def check_move_scope(root, cfg, old, new):
    """A move between spaces can break the citation rule in both directions.

    Promoting carries the node's own downward edges up with it; demoting leaves
    every citation from above pointing down. `check` finds both at commit time —
    this finds them at the moment of the act, which is where they can still be
    reconsidered rather than merely repaired."""
    was, now = is_shared(root, cfg, old), is_shared(root, cfg, new)
    if was == now or now is None:
        return []
    bad = []
    doc, _ = read(old)
    if now:  # sharing: what this node cites must be shared too
        for kind, raw, res in refs(root, cfg, old):
            if res.exists() and is_shared(root, cfg, res) is False:
                bad.append(f"  it cites {raw} — which stays personal")
    else:    # demoted: what cites it from above may no longer
        for p, kind, _ in inbound(root, cfg, old):
            if is_shared(root, cfg, root / p):
                bad.append(f"  {p} cites it from shared knowledge")
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
                        and is_shared(root, cfg, res) is False):
                    bad.append(f"  {node.relative_to(root)}\n      cites {raw}"
                               f" — another space's node, which stays personal")
        else:
            for pth, _, _ in inbound(root, cfg, node):
                res = (root / pth).resolve()
                if res not in mapping and is_shared(root, cfg, res):
                    bad.append(f"  {pth} cites {node.relative_to(root)} "
                               f"from shared knowledge, and is not moving")
    return bad


def move_closure(root, cfg, old, new):
    """Everything that must move with `old` for the citation rule to hold.

    Promoting: whatever it rests on that stays behind. Demoting: whatever rests
    on it from above. Both computed transitively, because the same rule applies
    to each node dragged in.

    The closure is a **test as much as an operation**. If promoting one node
    requires promoting six obviously product-specific ones, the node was not
    shared — seeing the cost is usually the answer."""
    src, dst = space_of(root, cfg, old), space_of(root, cfg, new)
    if src == dst or dst is None or src is None:
        return {}
    promoting = is_shared(root, cfg, new) and not is_shared(root, cfg, old)
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
        promoting = is_shared(root, cfg, new) and not is_shared(root, cfg, old)
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

    bad = check_move_scope(root, cfg, old, new)
    if bad and not args.force:
        raise Refused(
            f"this move crosses a space boundary and would break the citation "
            f"rule in {len(bad)} place(s):\n" + "\n".join(bad[:8])
            + (f"\n  … and {len(bad)-8} more" if len(bad) > 8 else "")
            + "\n\n  A space inherits downward only: shared knowledge may not rest "
              "on personal knowledge,\n  because its frame must contain the frames "
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
    errs = (validate_task if is_task else validate)(cfg, doc, args.frm)
    if errs:
        raise Refused("\n".join(errs))
    write(path, doc, body)
    print(f"removed {len(rels) - len(keep)} relation(s) to {args.to}")


# ── tasks ─────────────────────────────────────────────────────────────────────
# A second entity, not a node kind. It drains, and it is the only thing that can
# be deleted.



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


def validate_task(cfg, doc, where):
    pr = practice(cfg)
    errs, a = [], doc.get("attributes") or {}
    for k in ((pr.get("task") or {}).get("requires") or []):
        if not a.get(k):
            errs.append(f"{where}: a task requires attributes.{k}")
    errs += _enum_errs(pr, a, where)
    errs += _conditional_errs(pr, a, where)
    errs += _date_errs(pr, a, where)
    # A task holds edges without becoming a node. It makes no claim — no kind, no
    # frame, no confidence — but the relations it has are real.
    errs += _relation_errs(pr, doc, where)
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
    errs = validate_task(cfg, doc, str(path.relative_to(root)))
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
        # Anything with frontmatter participates. A task has an id and no kind;
        # a raw node has neither, and its edges are just as real — the edge from
        # a qualified claim to what it was drawn from is the whole point of the
        # raw layer, and dropping it here made that layer invisible to every
        # read operation while `inbound` (which walks files) still found it.
        if not doc:
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
        state[rel] = (a.get("status") or a.get("confidence")
                      or doc.get("kind") or "raw",
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
    the list carries enough — trust level, hop distance, edge type — to choose."""
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
    was relative to the *graph* root, so a cross-scope edge needed ../ escapes out
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
            if not doc:
                continue
            if "kind" not in doc:
                # Unqualified, and deliberately not listed. live_nodes feeds the
                # map and the census-by-kind, both of which are projections of
                # the *qualified* graph. Raw nodes are counted separately rather
                # than being absent — see census["raw"] in check.
                continue
            a = doc.get("attributes") or {}
            if a.get("status") == "superseded":
                continue
            kind = doc["kind"]
            state = (a.get("status") if kind == "decision"
                     else "thesis" if kind == "thesis"
                     else _derived_state(doc) if kind == "use-case"
                     else a.get("confidence", "?"))
            out.append((p, label, kind, state, a))
    return out


def _derived_state(doc):
    """A use case's state, computed from its edges rather than stored.

    Its kind FORBIDS `status` for this reason: whether a scenario works is a fact
    about what still blocks it, and a stored label would drift from that the
    moment a blocker cleared. So the answer is read off the graph every time.

    `ready` means nothing pending stands in front of it — NOT that it is built.
    Nothing here can know that; the code lives in another repository and no
    relative path crosses that boundary.
    """
    blockers = [r for r in (doc.get("relations") or []) if r.get("rel") == "blocked-by"]
    return "blocked" if blockers else "ready"


def render_queue(root, cfg):
    cap = practice(cfg).get("queue-cap", 4)
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
           f"conversation. At most **{cap}** items are surfaced; the rest are held.",
           "", "**Order.** Open decisions first, then everything `due: now` before",
           "anything `deferred`, then by `cost-if-wrong`, then oldest first.", "",
           f"## Surfaced — {min(cap, len(items))} of {len(items)}", "",
           *head, *rows(items[:cap])]
    if items[cap:]:
        out += ["", f"## Held — {len(items[cap:])}", "", *head, *rows(items[cap:])]
    return "\n".join(out) + "\n"


def pending_review(root, cfg):
    """Which nodes have changed since the settle watermark, and when.

    **Derived, never stored.** A `reviewed:` field would be typed by hand, so it
    could claim a node was read that nobody opened — the rubber stamp the
    watermark already has, multiplied by node count. And `STRUCTURE.md` settled
    the shape of the record: settle passes commit with the `settle:` prefix so
    that git history IS the log and no second file is needed.

    **Not "appears in a settle commit".** That was the first attempt and it was
    wrong: a pass that reads a node and finds it correct leaves no commit
    touching that file, so the measure reported *edited* while claiming *read* —
    and called 73 of 80 nodes unread on a graph that had just been reviewed.

    `reconciled: <sha>` already means "everything up to here has been read". So a
    node is pending exactly when it changed AFTER the watermark. Same query
    `kg check` runs repo-wide, per path.

    One `git log` for the whole range, not one per node.

    Measures **attention, not correctness**: a node inside the watermark can
    still be wrong. The same limit `reconciled:` declares about itself.
    """
    m = root / cfg["meta"] / "MAP.md"
    if not m.exists():
        return {}
    w = WATERMARK.search(m.read_text())
    if not w:
        return {}

    out = git("log", f"{w.group(1)}..HEAD", "--format=%x00%cs", "--name-only",
              cwd=root)
    if not out:
        return {}

    changed, date = {}, None
    for line in out.splitlines():
        if line.startswith("\x00"):
            date = line[1:].strip()
        elif line.strip() and date:
            # Newest first, so the first sighting is the most recent change.
            changed.setdefault(line.strip(), date)
    return changed


def render_map_blocks(root, cfg):
    nodes, excluded, overdue = live_nodes(root, cfg), 0, 0
    today = str(datetime.date.today())
    pending, unread = pending_review(root, cfg), 0
    for gdir, _, _ in graphs(root, cfg):
        for p in gdir.rglob("*.md"):
            if cfg["meta"] in p.relative_to(root).parts:
                continue
            doc, _ = read(p)
            if doc and (doc.get("attributes") or {}).get("status") == "superseded":
                excluded += 1
    by_graph = {}
    for p, label, kind, state, a in nodes:
        rel = str(p.relative_to(root))
        r = a.get("recheck")
        stale = " STALE" if r and str(r) < today else ""
        if stale:
            overdue += 1
        # Inside the watermark means a settle pass has covered it. Outside means
        # it changed since, and the date is when — which is the useful half: a
        # node written this morning SHOULD be pending, and one pending for a
        # month is the signal.
        since = pending.get(rel)
        if since:
            unread += 1
        by_graph.setdefault(label, []).append(
            (rel, f"{state}{stale}", a.get("title", p.stem),
             f"changed {since}" if since else "reviewed"))
    total = len(nodes)
    budget = practice(cfg).get("map-budget", 1400)
    degrade = total * 14 > budget
    listing = []
    for label in sorted(by_graph, key=lambda l: (l.count("/"), l)):
        items = sorted(by_graph[label])
        if degrade:
            listing.append(f"{label}/  {len(items)} nodes")
            continue
        listing.append(f"### {label}/")
        listing += [f"- `{rel}` · {st} · {rd} · {ti}" for rel, st, ti, rd in items]
        listing.append("")
    if degrade:
        listing += ["", f"*Listing degraded to counts: the node list would exceed "
                    f"the {budget}-token budget. Read each graph's "
                    f"`meta/INDEX.md` to drill.*"]
    pressure = [f"- budget    {total * 14} of {budget} tokens"
                f"{' — DEGRADED' if degrade else ''}",
                f"- nodes     {total} listed, {excluded} excluded (superseded)",
                f"- recheck   {overdue} overdue",
                # Counted, never judged — the same posture as the census. A node
                # written since the last pass is SUPPOSED to be pending, so this
                # is read against the watermark rather than as a fault.
                f"- pending   {unread} of {total} changed since the watermark"]
    return {"listing": "\n".join(listing).rstrip() + "\n",
            "pressure": "\n".join(pressure) + "\n"}


def _h1(path):
    """The task's own heading, so the plan reads as work rather than as paths."""
    for line in path.read_text().splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem


def render_plan(root, cfg):
    """Pending work in DEPENDENCY order — what can be started, and what cannot.

    **The queue cannot answer this and was never meant to.** It orders by
    `cost-if-wrong`, then readiness, then age, so it surfaces what matters most —
    which is not the same as what can be picked up. That gap is not theoretical:
    `settle-pricing-and-capacity` says in its own words that it is "blocked on
    that in substance even though both are due now", and the queue surfaced it
    while holding the very task it waits for.

    Blocked means a `blocked-by` edge whose target still exists. A task retiring
    is therefore what unblocks its dependents — no state to update, and no way to
    forget, because the container's disappearance IS the signal.

    Cycles are reported rather than resolved. Two tasks each waiting on the other
    is a real thing to discover about a plan, and picking one to break would hide
    it.
    """
    tasks, blocks = {}, {}
    for d in task_dirs(root, cfg):
        for f in sorted(d.rglob("*.md")):
            doc, _ = read(f)
            if not doc or "id" not in doc:
                continue
            rel = str(f.relative_to(root))
            a = doc.get("attributes") or {}
            tasks[rel] = {"id": doc["id"], "path": rel, "due": a.get("due"),
                          "cost": a.get("cost-if-wrong"), "queued": str(a.get("queued")),
                          "title": _h1(f)}
            blocks[rel] = [r.get("to") for r in (doc.get("relations") or [])
                           if r.get("rel") == "blocked-by"]

    # Only edges pointing at a task that is still here count. An edge to a
    # retired task is a blocker that resolved.
    live = {k: [b for b in v if b in tasks] for k, v in blocks.items()}

    cycles = []
    for start in live:
        seen, stack = set(), [(start, [start])]
        while stack:
            node, path = stack.pop()
            for nxt in live.get(node, []):
                if nxt == start:
                    cycles.append(path + [nxt])
                elif nxt not in seen:
                    seen.add(nxt)
                    stack.append((nxt, path + [nxt]))

    order = {"high": 0, "medium": 1, "low": 2}
    def rank(rel):
        q = tasks[rel]
        return (0 if q["due"] == "now" else 1, order.get(q["cost"], 9), q["queued"], rel)

    ready = sorted([r for r in tasks if not live[r]], key=rank)
    stuck = sorted([r for r in tasks if live[r]], key=rank)

    def line(rel):
        q = tasks[rel]
        return f"| {q['id']} | {q['cost']} | {q['due']} | {q['title']} | `{rel}` |"

    out = ["# Plan", "",
           "**Generated by `kg build`. Do not edit** — add a `blocked-by` relation",
           "and rebuild.", "",
           "`meta/QUEUE.md` orders by consequence: what matters most, surfaced four",
           "at a time. This orders by **dependency**: what can actually be started.",
           "The two disagree, and the disagreement is the point — a task can be the",
           "highest-cost thing pending and still be unstartable.", "",
           "A blocker resolves by its task being **retired**. Nothing is marked done",
           "here, because nothing is stored here.", ""]

    if cycles:
        out += ["## Cycles", "",
                "**Reported, not resolved.** Two tasks each waiting on the other is a",
                "fact about the plan; choosing one to break would hide it.", ""]
        for c in cycles:
            out.append("- " + " → ".join(f"`{x}`" for x in c))
        out.append("")

    head = ["| ID | Cost | Due | Task | File |", "|----|------|-----|------|------|"]

    out += [f"## Ready — {len(ready)}", "",
            "Nothing pending is waiting on anything else. Ordered as the queue",
            "orders: `due: now` first, then cost, then oldest.", "",
            *head, *[line(r) for r in ready]]

    if stuck:
        # Its own header: this table carries a column the ready one does not, and
        # patching the shared one by index is how the rows got overwritten once.
        out += ["", f"## Blocked — {len(stuck)}", "",
                "Each waits on a task that still exists. Retiring the blocker is what",
                "clears it — there is no state to update and nothing to remember.", "",
                "| ID | Cost | Due | Task | Waits on | File |",
                "|----|------|-----|------|----------|------|"]
        for r in stuck:
            q, names = tasks[r], ", ".join(str(tasks[b]["id"]) for b in live[r])
            out.append(f"| {q['id']} | {q['cost']} | {q['due']} | {q['title']} | "
                       f"{names} | `{r}` |")

    return "\n".join(out) + "\n"


# Settled states, and the rest. A node in the second group is load-bearing and
# NOT finished — `provisional` says "expected to be revisited", `open` says
# unresolved, `partial` says core claims checked and details marked inline.
# Collapsing them into one figure per layer is the only column here that is a
# judgement rather than a count, and it is the one worth reading.
UNSETTLED = {"provisional", "open", "partial"}


def render_actors(root, cfg):
    """Use cases grouped by the actor facet.

    **The second axis, and the reason it is a facet rather than a folder.**
    `collect-an-order` has two actors — the buyer gives a name, the stand-holder
    hands the goods over — so a folder would force one parent and the scenario
    would vanish from whichever half you asked about. A facet puts it under both,
    once.

    Blocked/ready is derived from `blocked-by` edges, so this table says what an
    actor can do and what still stands in front of it. It does NOT say what is
    built; nothing here can know that.
    """
    rows = {}
    for path, label, kind, state, a in live_nodes(root, cfg):
        if kind != "use-case":
            continue
        for who in (a.get("actor") or ["—"]):
            rows.setdefault(who, []).append((a.get("title", path.stem), state, path))

    if not rows:
        return ""

    order = {"buyer": 0, "staff": 1, "vendor": 2, "operator": 3}
    out = ["", "## By actor", "",
           "The same eight scenarios under the `actor` facet. A scenario with two",
           "actors appears under both and exists once — which is why this is a",
           "facet and not a folder.", "",
           "`ready` means nothing pending stands in front of it, **not** that it is",
           "built.", "",
           "| Actor | Scenarios | Ready | Blocked |",
           "|---|---:|---:|---:|"]

    for who in sorted(rows, key=lambda w: (order.get(w, 9), w)):
        items = rows[who]
        ready = sum(1 for _, s, _ in items if s == "ready")
        out.append(f"| **{who}** | {len(items)} | {ready or '·'} | {len(items) - ready or '·'} |")

    out += ["", "| Actor | Scenario | State |", "|---|---|---|"]
    for who in sorted(rows, key=lambda w: (order.get(w, 9), w)):
        for title, state, path in sorted(rows[who]):
            out.append(f"| {who} | {title} | {state} |")

    return "\n".join(out) + "\n"


def render_layers(root, cfg):
    """Every graph resolved into a table by scope and layer.

    **Layer is the folder**, which is already the one axis the graph commits to:
    `KNOWLEDGE.md` makes the path carry a node's primary domain and forbids it
    carrying anything else — not `kind`, not jurisdiction, not vendor. So this
    view invents no dimension. It counts along the one that exists.

    There is deliberately NO feature axis. `topics` is an open vocabulary and
    behaves like one — 156 distinct values across 80 nodes, 87 of them used
    exactly once — so grouping by it would produce tables of one row. A feature
    axis needs a CLOSED vocabulary the validator can enforce, and that is a
    separate decision rather than something to infer from tags.

    Columns are the states actually present, not a fixed set: a scope holding
    only facts should not render four empty decision columns.
    """
    by = {}
    for path, label, kind, state, a in live_nodes(root, cfg):
        # `knowledge` is the shared graph; `products/<name>/knowledge` is that
        # product's. The middle segment is the only useful name for the latter.
        parts = label.split("/")
        scope = "shared" if len(parts) == 1 else parts[1]
        layer = path.parent.name
        by.setdefault((scope, layer), []).append(state)

    present = []
    for order in ("decided", "provisional", "open", "verified", "partial",
                  "attested", "thesis"):
        if any(order in v for v in by.values()):
            present.append(order)
    # Anything the vocabulary above does not name, rather than dropping it.
    other = sorted({s for v in by.values() for s in v} - set(present))
    present += other

    head = ["| Scope | Layer | Nodes | Unsettled | " + " | ".join(present) + " |",
            "|---|---|---:|---:|" + "|".join("---:" for _ in present) + "|"]

    rows, totals = [], {s: 0 for s in present}
    total_nodes = total_unsettled = 0
    for (scope, layer) in sorted(by):
        states = by[(scope, layer)]
        n = len(states)
        unsettled = sum(1 for s in states if s in UNSETTLED)
        total_nodes += n
        total_unsettled += unsettled
        cells = []
        for s in present:
            c = states.count(s)
            totals[s] += c
            cells.append(str(c) if c else "·")
        rows.append(f"| {scope} | `{layer}/` | {n} | "
                    f"{unsettled if unsettled else '·'} | " + " | ".join(cells) + " |")

    rows.append("| **all** | | **" + str(total_nodes) + "** | **"
                + str(total_unsettled) + "** | "
                + " | ".join(f"**{totals[s]}**" if totals[s] else "·" for s in present)
                + " |")

    return "\n".join([
        "# Layers", "",
        "**Generated by `kg build`. Do not edit** — move a node between folders",
        "and rebuild.", "",
        "The graph counted along the one axis its paths already carry: the",
        "**domain folder**. `KNOWLEDGE.md` makes the path record a node's primary",
        "domain and nothing else, so this view adds no dimension — it only counts.",
        "",
        "**Unsettled** is `provisional` + `open` + `partial`: load-bearing and not",
        "finished. It is the only judgement in the table; every other column is a",
        "tally.", "",
        "**No feature column, and not by oversight.** `topics` is an open",
        "vocabulary and behaves like one — 156 distinct values across 80 nodes,",
        "87 used exactly once. Grouping by it yields tables of a single row. A",
        "feature axis needs a closed vocabulary the validator enforces, which is a",
        "decision to take rather than a tag to infer.", "",
        *head, *rows]) + "\n" + render_actors(root, cfg)


def op_build(root, cfg, args):
    stale = []
    q = root / cfg["meta"] / "QUEUE.md"
    want = render_queue(root, cfg)
    if not q.exists() or q.read_text() != want:
        stale.append(q)
        if not args.check:
            q.parent.mkdir(parents=True, exist_ok=True)
            q.write_text(want)

    ly = root / cfg["meta"] / "LAYERS.md"
    want_layers = render_layers(root, cfg)
    if not ly.exists() or ly.read_text() != want_layers:
        stale.append(ly)
        if not args.check:
            ly.parent.mkdir(parents=True, exist_ok=True)
            ly.write_text(want_layers)

    pl = root / cfg["meta"] / "PLAN.md"
    want_plan = render_plan(root, cfg)
    if not pl.exists() or pl.read_text() != want_plan:
        stale.append(pl)
        if not args.check:
            pl.parent.mkdir(parents=True, exist_ok=True)
            pl.write_text(want_plan)

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
    for p in walk(root, cfg, meta=True):
        rel = p.relative_to(root)
        try:
            _, _, src_shared = graph_of(root, cfg, p)
        except Refused:
            src_shared = None
        src_space = space_of(root, cfg, p)
        for kind, raw, resolved in refs(root, cfg, p):
            if not resolved.exists():
                errs.append(f"{rel}: broken {kind} link -> {raw}")
                continue
            # Same containment rule as `link`. Keyed on space rather than on a
            # shared/personal boolean, so a citation between two sibling
            # personal spaces is caught rather than reading as same-tier.
            if src_space is not None:
                tgt_space = space_of(root, cfg, resolved)
                if (tgt_space is not None and tgt_space != src_space
                        and not is_shared(root, cfg, resolved)):
                    errs.append(f"{rel}: cites into the disjoint space "
                                f"{graph_of(root, cfg, resolved)[1]} -> {raw}")
        if src_shared:
            doc, body = read(p)
            for n, line in enumerate((body or "").split("\n"), 1):
                if line.lstrip().startswith(">"):
                    continue
                clean = re.sub(r'"[^"\n]*"', "", re.sub(r"https?://\S+", "", line))
                m = re.search(r"\b(we|us|our|ours)\b", clean, re.I)
                if m and m.group(0) != "US":
                    warns.append(f"{rel}:{n}: first person plural in shared knowledge "
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

        # `verified` and `partial` both MEAN "checked against a cited source", so
        # a node carrying either while citing nothing contradicts its own label.
        # That is syntactic and therefore checkable — the same trick as the
        # first-person-plural check, which enforces a semantic rule through the
        # one marker it leaves in the text.
        #
        # What this CANNOT see: whether the URL says what the node claims, or
        # whether it was invented. Provenance is not machine-readable, and a
        # clean pass here is not verification. `attested` is exempt by
        # definition — it means no source exists.
        if a.get("confidence") in ("verified", "partial"):
            doc2, body2 = read(path)
            if not SOURCE_URL.search(body2 or ""):
                warns.append(f"{rel}: confidence {a['confidence']} with no source "
                             f"cited — the label claims a check that left no trace")
    census["tasks"] = sum(1 for _ in tasks(root, cfg))

    # Raw captures are not in any graph and make no claims, so nothing above
    # counts them. Count them here anyway: capture rate against acceptance rate
    # is the one number that shows the practice failing, and an uncounted inbox
    # is how it fails unnoticed.
    rawdir = root / cfg.get("raw", "sources")
    census["raw"] = sum(1 for p in rawdir.rglob("*.md")
                        if (d := read(p)[0]) and "kind" not in d) \
        if rawdir.is_dir() else 0

    # The watermark cannot show the map's commentary is right. It proves nobody
    # has looked at the graph changes since it was written.

    m = root / cfg["meta"] / "MAP.md"
    if m.exists():
        w = WATERMARK.search(m.read_text())
        if not w:
            warns.append(f"{m.relative_to(root)}: no `reconciled: <sha>` line")
        else:
            # Expand the globs before handing them to git. A wildcard pathspec
            # is matched against the WHOLE path, so `products/*/knowledge`
            # selects that directory and nothing beneath it — the count came
            # back 1 over a range where the real figure was 24. Every other
            # operation expands first; this one passed the pattern through.
            #
            # A warning that fires with a believable number is worse than one
            # that does not fire: the failure this watermark exists to prevent
            # is advancing it without a pass, and `1 commit` invites a glance
            # where `24 commits` forces a read.
            #
            # Tasks count, deliberately. A settle pass reads task drift — what
            # drained, which blockers cleared — and QUEUE.md is generated from
            # them, so a range touching only tasks is still one this page has
            # not been reconciled against.
            paths = [str(d.relative_to(root)) for d, _, _ in graphs(root, cfg)]
            paths += [str(d.relative_to(root)) for d in task_dirs(root, cfg)]
            since = git("log", "--oneline", f"{w.group(1)}..HEAD", "--", *paths,
                        cwd=root)
            n = len(since.splitlines())
            if n:
                warns.append(
                    f"{m.relative_to(root)}: commentary reconciled at "
                    f"{w.group(1)[:7]}; {n} commit(s) have touched a graph or a "
                    f"task since")

    for w in warns:
        print(f"warn  {w}")
    for e in errs:
        print(f"ERROR {e}")
    kinds = " · ".join(f"{n} {k}" for k, n in sorted(census["kinds"].items()))
    st = " · ".join(f"{n} {s}" for s, n in sorted(census["status"].items(),
                                                  key=lambda kv: -kv[1]))
    print(f"\n{sum(census['kinds'].values())} nodes, {len(errs)} errors, "
          f"{len(warns)} warnings")
    raw = f" | raw {census['raw']}" if census["raw"] else ""
    print(f"census  {kinds} | decisions {st} | tasks {census['tasks']}{raw}")
    return 1 if errs else 0


def op_init(root, cfg, args):
    raise Refused("unreachable — init runs before a config exists")


def do_init(args):
    root = pathlib.Path.cwd()
    cfgp = root / CONFIG
    if cfgp.exists():
        print(f"{CONFIG} already exists"); return 1
    cfg = {"graphs": [{"path": g, "scope": "shared" if i == 0 else "personal"}
                      for i, g in enumerate(args.graphs)],
           "tasks": args.tasks, "meta": args.meta, "next-id": 1}
    # The practice is written INTO the repository, not referenced from the
    # plugin. It is the methodology this graph holds itself to, so it belongs
    # beside the graph, versioned with it, and editable without a release.
    default = pathlib.Path(__file__).parent / "practice.default.json"
    if default.is_file():
        cfg["practice"] = json.loads(default.read_text())
    cfgp.write_text(json.dumps(cfg, indent=2) + "\n")
    for g in args.graphs:
        if "*" not in g:
            (root / g / args.meta).mkdir(parents=True, exist_ok=True)
    for d in args.tasks:
        if "*" not in d:
            (root / d).mkdir(parents=True, exist_ok=True)
    print(f"wrote {CONFIG}")

    # Ship the hooks rather than documenting them. The staging step in pre-commit
    # is subtle and load-bearing: `build` rewrites the derived layer, and not
    # staging what it wrote commits a stale queue and an unbumped next-id, which
    # is how two tasks come to share an id. Every prose instruction to "wire
    # build && check into a pre-commit hook" reproduces that bug exactly.
    src = pathlib.Path(__file__).parent / "hooks"
    dst = root / ".githooks"
    written = []
    if src.is_dir():
        dst.mkdir(exist_ok=True)
        for h in sorted(src.iterdir()):
            target = dst / h.name
            if target.exists():
                print(f"  kept existing .githooks/{h.name}")
                continue
            target.write_text(h.read_text())
            target.chmod(0o755)
            written.append(h.name)
    if written:
        print(f"wrote .githooks/{', .githooks/'.join(written)}")

    # hooksPath is local config, so it is set here and still absent from every
    # future clone. Saying so is the only thing that travels.
    # git() returns "" on failure and "" on a successful set, so the write tells
    # us nothing. Read it back; that is the only thing that distinguishes them.
    git("config", "core.hooksPath", ".githooks", cwd=root)
    if git("config", "core.hooksPath", cwd=root) == ".githooks":
        print("set core.hooksPath = .githooks")
    else:
        print("could NOT set core.hooksPath — run: git config core.hooksPath .githooks")
    print("\nThat setting is local config and does NOT travel with a clone. "
          "In a fresh one:\n\n    git config core.hooksPath .githooks\n")
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
    p.add_argument("--rel", required=True)
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
    p.add_argument("slug"); p.add_argument("--cost", required=True)
    p.add_argument("--due", required=True)
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
