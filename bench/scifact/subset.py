#!/usr/bin/env python3
"""A sized corpus, drawn the same way every time.

283 of the 5 183 documents are cited by a dev claim, and the rest are
distractors. Distraction is a variable of the protocol, so the size is an
argument and the draw is seeded — an unseeded draw would make the curve across
sizes noise rather than a measurement.

Emits a run's inputs and a manifest that says what they are, so a result can be
read a year later without the command that produced it — which means the ids,
not only the counts. A manifest holding `size: 35, seed: 16` reproduces nothing
once the corpus file it drew from is gone, and a /tmp sweep proved that is not
hypothetical. `--from-manifest` rebuilds the inputs from one, and `--select`
records a deliberate choice of claims as a run rather than a hand assembly with
nothing behind it.
"""
import argparse, json, random, pathlib, sys

def load(p): return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]

def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("--data", type=pathlib.Path, required=True)
    a.add_argument("--out", type=pathlib.Path, required=True)
    a.add_argument("--size", type=int, help="documents in the corpus")
    a.add_argument("--claims", type=int, default=0,
                   help="dev claims to ask; 0 is all of them. Fewer claims need "
                        "fewer documents, which is what makes a pilot payable")
    a.add_argument("--seed", type=int, default=16)
    a.add_argument("--config", choices=["A", "B"])
    a.add_argument("--select", help="dev claim ids, comma-separated — a deliberate "
                                    "choice instead of a draw")
    a.add_argument("--from-manifest", type=pathlib.Path,
                   help="rebuild exactly the inputs a committed manifest names")
    args = a.parse_args()
    if not args.from_manifest and (args.config is None or args.size is None):
        a.error("--config and --size are required unless --from-manifest is given")

    corpus = load(args.data / "corpus.jsonl")
    dev = load(args.data / "claims_dev.jsonl")
    train = load(args.data / "claims_train.jsonl")

    # Claims first, documents after. Choosing documents and keeping whichever
    # claims survive leaves a claim whose evidence was not ingested, and a
    # question with no reachable answer measures the sampling rather than the
    # system.
    by_id = {d["doc_id"]: d for d in corpus}

    # Rebuilding names every id, so nothing is drawn and nothing may be missing:
    # a corpus that no longer holds one of them is a different corpus, and a run
    # quietly one document short is worse than a run that refused to start.
    if args.from_manifest:
        manifest = json.loads(args.from_manifest.read_text())
        chosen = [int(i) for i in manifest["document_ids"]]
        want_dev = {int(i) for i in manifest["dev_claim_ids"]}
        want_train = {int(i) for i in manifest.get("train_claim_ids", [])}
        missing = [i for i in chosen if i not in by_id]
        if missing:
            print(f"corpus lacks {len(missing)} of the manifest's documents: "
                  f"{missing[:5]}", file=sys.stderr)
            return 2
        dev = [c for c in dev if c["id"] in want_dev]
        claims = [c for c in train if c["id"] in want_train]
        if len(dev) != len(want_dev) or len(claims) != len(want_train):
            print("claims files lack some of the manifest's claims", file=sys.stderr)
            return 2
        return write(args.out, by_id, chosen, dev, claims, manifest)

    rng = random.Random(args.seed)
    if args.select:
        want = {int(i) for i in args.select.split(",")}
        dev = sorted((c for c in dev if c["id"] in want), key=lambda c: c["id"])
        if len(dev) != len(want):
            print(f"no such dev claim: {sorted(want - {c['id'] for c in dev})}",
                  file=sys.stderr)
            return 2
    elif args.claims and args.claims < len(dev):
        dev = sorted(rng.sample(dev, args.claims), key=lambda c: c["id"])
    cited = {d for c in dev for d in c["cited_doc_ids"]}
    if args.size < len(cited):
        print(f"--size must be at least {len(cited)}: the {len(dev)} claims asked "
              f"need that many documents, or some question has no answer",
              file=sys.stderr)
        return 2

    rest = sorted(set(by_id) - cited)
    rng.shuffle(rest)
    chosen = sorted(cited) + rest[: args.size - len(cited)]
    kept = set(chosen)

    # Configuration B ingests the train claims too — but only those whose
    # evidence is reachable, or the graph holds edges into nothing.
    claims = [c for c in train if kept & set(c["cited_doc_ids"])] if args.config == "B" else []

    relations = sum(len(e) for c in claims for e in c["evidence"].values())
    manifest = {
        "config": args.config, "size": args.size, "seed": args.seed,
        "selected": bool(args.select),
        "documents": len(chosen), "cited_by_dev": len(cited),
        "distractors": len(chosen) - len(cited),
        "train_claims_ingested": len(claims), "annotated_relations": relations,
        "dev_claims_asked": len(dev),
        "estimated_ingest_usd": round(len(chosen) * 1.97, 2),
        # The ids are the run. Everything above them is a summary of these.
        "dev_claim_ids": [c["id"] for c in dev],
        "train_claim_ids": [c["id"] for c in claims],
        "document_ids": chosen,
    }
    return write(args.out, by_id, chosen, dev, claims, manifest)


def write(out, by_id, chosen, dev, claims, manifest):
    out.mkdir(parents=True, exist_ok=True)
    (out / "corpus.jsonl").write_text(
        "".join(json.dumps(by_id[i]) + "\n" for i in chosen))
    (out / "claims_train.jsonl").write_text(
        "".join(json.dumps(c) + "\n" for c in claims))
    (out / "claims_dev.jsonl").write_text(
        "".join(json.dumps(c) + "\n" for c in dev))
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({k: v for k, v in manifest.items()
                      if not k.endswith("_ids")}, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
