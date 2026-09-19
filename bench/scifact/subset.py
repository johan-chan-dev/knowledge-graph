#!/usr/bin/env python3
"""A sized corpus, drawn the same way every time.

283 of the 5 183 documents are cited by a dev claim, and the rest are
distractors. Distraction is a variable of the protocol, so the size is an
argument and the draw is seeded — an unseeded draw would make the curve across
sizes noise rather than a measurement.

Emits a run's inputs and a manifest that says what they are, so a result can be
read a year later without the command that produced it.
"""
import argparse, json, random, pathlib, sys

def load(p): return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]

def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("--data", type=pathlib.Path, required=True)
    a.add_argument("--out", type=pathlib.Path, required=True)
    a.add_argument("--size", type=int, required=True, help="documents in the corpus")
    a.add_argument("--claims", type=int, default=0,
                   help="dev claims to ask; 0 is all of them. Fewer claims need "
                        "fewer documents, which is what makes a pilot payable")
    a.add_argument("--seed", type=int, default=16)
    a.add_argument("--config", choices=["A", "B"], required=True)
    args = a.parse_args()

    corpus = load(args.data / "corpus.jsonl")
    dev = load(args.data / "claims_dev.jsonl")
    train = load(args.data / "claims_train.jsonl")

    # Claims first, documents after. Choosing documents and keeping whichever
    # claims survive leaves a claim whose evidence was not ingested, and a
    # question with no reachable answer measures the sampling rather than the
    # system.
    rng = random.Random(args.seed)
    if args.claims and args.claims < len(dev):
        dev = sorted(rng.sample(dev, args.claims), key=lambda c: c["id"])
    cited = {d for c in dev for d in c["cited_doc_ids"]}
    if args.size < len(cited):
        print(f"--size must be at least {len(cited)}: the {len(dev)} claims asked "
              f"need that many documents, or some question has no answer",
              file=sys.stderr)
        return 2

    by_id = {d["doc_id"]: d for d in corpus}
    rest = sorted(set(by_id) - cited)
    rng.shuffle(rest)
    chosen = sorted(cited) + rest[: args.size - len(cited)]
    kept = set(chosen)

    # Configuration B ingests the train claims too — but only those whose
    # evidence is reachable, or the graph holds edges into nothing.
    claims = [c for c in train if kept & set(c["cited_doc_ids"])] if args.config == "B" else []

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "corpus.jsonl").write_text(
        "".join(json.dumps(by_id[i]) + "\n" for i in chosen))
    (args.out / "claims_train.jsonl").write_text(
        "".join(json.dumps(c) + "\n" for c in claims))
    (args.out / "claims_dev.jsonl").write_text(
        "".join(json.dumps(c) + "\n" for c in dev))

    relations = sum(len(e) for c in claims for e in c["evidence"].values())
    manifest = {
        "config": args.config, "size": args.size, "seed": args.seed,
        "documents": len(chosen), "cited_by_dev": len(cited),
        "distractors": len(chosen) - len(cited),
        "train_claims_ingested": len(claims), "annotated_relations": relations,
        "dev_claims_asked": len(dev),
        "estimated_ingest_usd": round(len(chosen) * 1.97, 2),
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
