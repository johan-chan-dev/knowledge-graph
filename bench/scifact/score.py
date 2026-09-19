#!/usr/bin/env python3
"""Mechanical scoring. No model anywhere — set operations against annotations
written by people, which is the whole reason this benchmark was chosen.

Their two metrics are implemented as they define them, so a number here can be
put beside a published one. Ours is added beside them, because the question is
not whether a ranking wins but whether what went in comes back:

  **rationale recall** — of the sentences an annotator marked, how many did the
  system surface.

**And there are two readings, which must be named.** A (claim, abstract) pair
often carries several gold sets, and they are *alternatives* — one complete set
is a whole justification. Measured on the release: 41% of dev pairs and 48% of
train pairs carry more than one. Against their union, an answer giving exactly
one correct set scores about 0.6, so `union` answers *did the marked sentences
come back* while `best_set` answers *was a justification restituted*.

**And it is never read alone.** Measured while validating this file: offering
every sentence of the right abstract scores a rationale recall of 1.0, having
restituted nothing — it declined to choose. Their sentence precision catches it
at 0.18, and their abstract level catches it harder at 0.22, because only the
first three sentences offered are looked at. That cap is what makes an answer a
*choice*, so recall is reported beside precision or it can be bought by dumping.

Predictions are one JSON object per line, in SciFact's own shape — and NOINFO is
an empty `evidence`, said by absence rather than by a third label:

  {"id": 5, "evidence": {"13734012": {"label": "SUPPORT", "sentences": [4]}}}

`rung` is ours and optional: which step of the ladder produced the answer. It
cannot be reconstructed afterwards, which is why it is asked for at the time.
"""
import argparse, json, pathlib, collections

def load(p): return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
def f1(p, r): return 0.0 if p + r == 0 else 2 * p * r / (p + r)

def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("--gold", type=pathlib.Path, required=True)
    a.add_argument("--predictions", type=pathlib.Path, required=True)
    args = a.parse_args()

    gold = {c["id"]: c for c in load(args.gold)}
    preds = {p["id"]: p for p in load(args.predictions)}

    ab_hit = ab_pred = ab_gold = 0
    sn_hit = sn_pred = sn_gold = 0
    verdict_hit = 0
    rungs: collections.Counter = collections.Counter()
    surfaced = wanted = 0
    best_of = 0.0
    pairs = 0

    for cid, g in gold.items():
        p = preds.get(cid, {"evidence": {}})
        pe, ge = p.get("evidence", {}), g["evidence"]
        if (rung := p.get("rung")) is not None:
            rungs[str(rung)] += 1

        # Their abstract level: the label matches and one whole gold set sits
        # inside the first three sentences offered. Extras beyond that are
        # ignored, which is what makes offering the whole abstract a non-answer.
        ab_gold += len(ge)
        ab_pred += len(pe)
        for doc, got in pe.items():
            sets = ge.get(str(doc)) or ge.get(int(doc)) if isinstance(ge, dict) else None
            if not sets or got.get("label") != sets[0]["label"]:
                continue
            first3 = set(got.get("sentences", [])[:3])
            if any(set(s["sentences"]) <= first3 for s in sets):
                ab_hit += 1

        # Their sentence level: a sentence counts only when every other sentence
        # of its set was offered too — a set is one justification, not a bag.
        for doc, got in pe.items():
            sets = ge.get(str(doc)) or []
            offered = set(got.get("sentences", []))
            sn_pred += len(offered)
            if not sets or got.get("label") != sets[0]["label"]:
                continue
            for s in offered:
                if any(s in set(gs["sentences"]) and set(gs["sentences"]) <= offered
                       for gs in sets):
                    sn_hit += 1
        sn_gold += sum(len(s["sentences"]) for sets in ge.values() for s in sets)

        # Ours, two readings, because the annotators supply **alternative**
        # justifications: a pair can carry several sets and one whole set is
        # enough. Unioning them asks for every alternative at once, which no
        # correct answer gives — measured, a perfect one caps near 0.6.
        for doc, sets in ge.items():
            got = set((pe.get(str(doc)) or {}).get("sentences", []))
            union = {x for s in sets for x in s["sentences"]}
            wanted += len(union)
            surfaced += len(union & got)
            best_of += max(len(set(s["sentences"]) & got) / len(s["sentences"])
                           for s in sets)
            pairs += 1

        # The verdict, including NOINFO — which is an empty evidence on both
        # sides, so it is scored by absence exactly as it is expressed.
        want_label = next((s[0]["label"] for s in ge.values()), None)
        got_label = next((v.get("label") for v in pe.values()), None)
        verdict_hit += want_label == got_label

    n = len(gold)
    out = {
        "claims": n,
        "answered": len(preds),
        "verdict_accuracy": round(verdict_hit / n, 4) if n else 0.0,
        # Say which reading, always. Against the union a perfect answer scores
        # about 0.6, so a figure reported without its reading invites being
        # compared to 1.0 and read as a 40% failure.
        "rationale_recall_union": round(surfaced / wanted, 4) if wanted else 0.0,
        "rationale_recall_best_set": round(best_of / pairs, 4) if pairs else 0.0,
        "abstract": {
            "precision": round(ab_hit / ab_pred, 4) if ab_pred else 0.0,
            "recall": round(ab_hit / ab_gold, 4) if ab_gold else 0.0,
        },
        "sentence": {
            "precision": round(sn_hit / sn_pred, 4) if sn_pred else 0.0,
            "recall": round(sn_hit / sn_gold, 4) if sn_gold else 0.0,
        },
        "rungs": dict(sorted(rungs.items())),
    }
    for k in ("abstract", "sentence"):
        out[k]["f1"] = round(f1(out[k]["precision"], out[k]["recall"]), 4)
    print(json.dumps(out, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
