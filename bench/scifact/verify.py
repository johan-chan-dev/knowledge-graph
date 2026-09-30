#!/usr/bin/env python3
"""What an ingestion left behind, measured without assuming its shape.

The first version of this measurement counted edges between documents and
reported zero on a graph that held five cross-document observations. They were
there, written as prose inside properties, naming node uuids in the middle of a
sentence. A metric that presupposes the slot measures conformance to the slot,
not the phenomenon — so every count here is taken over both.

Reads a run directory: <run>/space/.kg and, when present, <run>/inputs/corpus.jsonl.
"""

import argparse
import json
import os
import re
import sys
from collections import defaultdict

import yaml

UUID = re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b")
# An empty node is `---\n---\n`, so the block may hold nothing at all — a
# pattern demanding one line of it reads the whole file as a body.
FRONTMATTER = re.compile(r"\A---\n(.*?)^---[ \t]*\n?", re.S | re.M)


def load_nodes(kg):
    nodes = {}
    d = os.path.join(kg, "nodes")
    for name in sorted(os.listdir(d)):
        path = os.path.join(d, name)
        if not os.path.isfile(path) or not name.endswith(".md"):
            continue
        text = open(path, encoding="utf-8", errors="replace").read()
        m = FRONTMATTER.match(text)
        props = (yaml.safe_load(m.group(1)) or {}) if m else {}
        body = text[m.end():] if m else text
        nodes[name[:-3]] = {"props": props, "body": body}
    return nodes


def load_links(kg):
    links = {}
    d = os.path.join(kg, "links")
    if not os.path.isdir(d):
        return links
    for name in sorted(os.listdir(d)):
        if not name.endswith(".yaml"):
            continue
        rec = yaml.safe_load(open(os.path.join(d, name), encoding="utf-8")) or {}
        links[name[:-5]] = rec
    return links


def strings(value):
    """Every string anywhere inside a property value."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from strings(v)


def own_doc(props):
    v = props.get("doc_id")
    return str(v) if v is not None else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", required=True)
    ap.add_argument("--hops", type=int, default=2,
                    help="radius within which a node is said to join two documents")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    kg = os.path.join(args.run, "space", ".kg")
    if not os.path.isdir(kg):
        sys.exit(f"no space at {kg}")
    nodes, links = load_nodes(kg), load_links(kg)

    # --- adjacency, from the link records: a node's own `links` list holds the
    # record's uuid, never the far endpoint, so the records are the only source.
    near = defaultdict(set)
    for rec in links.values():
        a, b = str(rec.get("from")), str(rec.get("to"))
        if a in nodes and b in nodes:
            near[a].add(b)
            near[b].add(a)

    docs = {i: own_doc(n["props"]) for i, n in nodes.items()}
    known = {d for d in docs.values() if d}

    # --- 1. connection, counted over both slots ------------------------------
    edges_between = [
        (i, rec) for i, rec in links.items()
        if docs.get(str(rec.get("from"))) and docs.get(str(rec.get("to")))
        and docs[str(rec["from"])] != docs[str(rec["to"])]
    ]

    def reached(start):
        seen, frontier = {start}, {start}
        for _ in range(args.hops):
            frontier = {n for f in frontier for n in near[f]} - seen
            seen |= frontier
        return {docs[n] for n in seen if docs.get(n)}

    # A node that carries a document of its own is *joined*, not joining: only
    # a node standing between documents is the convergence being counted, and
    # including its neighbours would inflate every junction into three.
    junctions = {
        i: r for i in nodes
        if not docs.get(i) and len(r := reached(i)) > 1
    }

    # A uuid inside a property value is a connection somebody wrote where no
    # traversal can follow it. Counted, because it is the finding, not noise.
    in_property = []
    for holder, kind, props in (
        [(i, "node", n["props"]) for i, n in nodes.items()]
        + [(i, "link", {k: v for k, v in r.items() if k not in ("from", "to", "type")})
           for i, r in links.items()]
    ):
        # Where the holder itself sits: its own document, or failing that the
        # documents its immediate neighbours carry. Anything further would let a
        # holder that spans two documents swallow the crossing it is recording.
        home = ({docs[holder]} if docs.get(holder)
                else {docs[n] for n in near[holder] if docs.get(n)})
        for key, value in (props or {}).items():
            if key in ("labels", "links"):
                continue
            for s in strings(value):
                for ref in UUID.findall(s):
                    if ref in nodes and ref != holder:
                        in_property.append(
                            {"holder": holder, "kind": kind, "property": key,
                             "refers_to": ref, "its_doc": docs.get(ref),
                             "crossing": bool(docs.get(ref)) and docs[ref] not in home})

    # --- 2. reachable, per docs/design/absence.md ----------------------------
    unreachable = [
        i for i, n in nodes.items()
        if not (n["props"] or {}).get("labels") and not (n["props"] or {}).get("links")
    ]

    # --- 3. the anchor: does a lifted quote still equal the sentence it cites?
    corpus_path = os.path.join(args.run, "inputs", "corpus.jsonl")
    anchors = {"checked": 0, "exact": 0, "mismatch": [], "out_of_range": []}
    if os.path.isfile(corpus_path):
        corpus = {}
        for line in open(corpus_path, encoding="utf-8"):
            if line.strip():
                rec = json.loads(line)
                corpus[str(rec["doc_id"])] = rec.get("abstract", [])
        for i, n in nodes.items():
            p = n["props"] or {}
            doc, idx, text = own_doc(p), p.get("index"), p.get("text")
            if doc is None or idx is None or not isinstance(text, str):
                continue
            sentences = corpus.get(doc)
            if sentences is None:
                continue
            anchors["checked"] += 1
            try:
                want = sentences[int(idx)]
            except (ValueError, IndexError):
                anchors["out_of_range"].append({"node": i, "doc": doc, "index": idx})
                continue
            if text.strip() == want.strip():
                anchors["exact"] += 1
            else:
                anchors["mismatch"].append({"node": i, "doc": doc, "index": idx})

    # --- 4. where the raw went, and whether it is duplicated -----------------
    bodies = sum(1 for n in nodes.values() if n["body"].strip())
    arrays = {i: p for i, n in nodes.items()
              if isinstance((p := (n["props"] or {}).get("abstract")), list)}
    duplicated = 0
    for i, sentences in arrays.items():
        doc = docs.get(i)
        joined = "\n".join(s for s in sentences if isinstance(s, str))
        for j, n in nodes.items():
            p = n["props"] or {}
            if j != i and docs.get(j) == doc and isinstance(p.get("text"), str):
                if p["text"].strip()[:60] in joined:
                    duplicated += 1

    # --- 5. the vocabulary, and its extension at either end ------------------
    extension = defaultdict(int)
    for n in nodes.values():
        for w in (n["props"] or {}).get("labels") or []:
            extension[str(w)] += 1
    types = defaultdict(int)
    for rec in links.values():
        types[str(rec.get("type"))] += 1

    report = {
        "nodes": len(nodes), "links": len(links), "documents": len(known),
        "connection": {
            "edges_between_documents": len(edges_between),
            "nodes_joining_documents": len(junctions),
            "written_in_a_property": len(in_property),
            "written_in_a_property_crossing": sum(1 for r in in_property if r["crossing"]),
            "samples": in_property[:5],
        },
        "unreachable": unreachable,
        "anchors": anchors,
        "raw": {"non_empty_bodies": bodies, "abstract_arrays": len(arrays),
                "array_entries_duplicating_a_lifted_node": duplicated},
        "vocabulary": {"labels": dict(sorted(extension.items())),
                       "types": dict(sorted(types.items()))},
    }

    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
        return

    c = report["connection"]
    print(f"{report['nodes']} nodes · {report['links']} links · {report['documents']} documents")
    print("\nconnection — counted over both slots")
    print(f"  edges between two documents      {c['edges_between_documents']}")
    print(f"  nodes joining two (≤{args.hops} hops)       {c['nodes_joining_documents']}")
    print(f"  written in a property instead    {c['written_in_a_property']}"
          f"  ({c['written_in_a_property_crossing']} of them crossing)")
    for s in c["samples"]:
        print(f"    {s['kind']} {s['holder'][:8]} .{s['property']} -> {s['refers_to'][:8]} (doc {s['its_doc']})")
    print(f"\nunreachable (no label, no link)    {len(unreachable)}")
    for i in unreachable[:5]:
        print(f"    {i}")
    a = report["anchors"]
    if a["checked"]:
        print(f"\nanchors  {a['exact']}/{a['checked']} quotes equal the sentence they cite"
              f" · {len(a['mismatch'])} differ · {len(a['out_of_range'])} out of range")
    r = report["raw"]
    print(f"\nraw      {r['non_empty_bodies']} non-empty bodies · {r['abstract_arrays']} abstract arrays"
          f" · {r['array_entries_duplicating_a_lifted_node']} entries duplicating a lifted node")
    print("\nvocabulary")
    for w, k in sorted(extension.items(), key=lambda kv: -kv[1]):
        flag = "  <- grouped nothing" if k == 1 else ("  <- refused nothing" if k == len(nodes) else "")
        print(f"  {k:4}  {w}{flag}")
    for w, k in sorted(types.items(), key=lambda kv: -kv[1]):
        print(f"  {k:4}  [{w}]")


if __name__ == "__main__":
    main()
