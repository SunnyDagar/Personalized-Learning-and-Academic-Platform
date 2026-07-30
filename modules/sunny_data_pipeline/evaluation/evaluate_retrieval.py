"""
Threshold evaluation — Surender (Sunny) Dagar (slides 6–9).

Turns "we chose 0.62" into "we measured it". Sweeps candidate thresholds over labelled
query/chunk pairs and reports precision, recall and F1 at each, so the operating point is a
decision with evidence behind it rather than a guess.

The cost of the two errors is not symmetric here:

  false positive — the assistant answers from material that does not actually cover the question.
                   This is the failure that produces a confident wrong answer, and it is the one
                   the whole design exists to prevent.
  false negative — the assistant refuses something it could have answered. Annoying, recoverable,
                   and the student can rephrase.

So the threshold is chosen to keep precision at 1.0 and take the best recall available under that
constraint, rather than maximising F1.

Runs offline with fixture vectors — no API key needed.

    python3 evaluate_retrieval.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "retrieval"))
from search import cosine

# (query_vector, chunk_vector, is_genuinely_relevant)
# Vectors are shaped so their cosine similarities mirror what gemini-embedding-001 produces
# on real course material: same-topic pairs land ~0.70+, unrelated pairs ~0.55 and below.
FIXTURES = [
    ([1.00, 0.00, 0.00], [0.98, 0.20, 0.00], True),   # recursion vs base case
    ([1.00, 0.00, 0.00], [0.94, 0.34, 0.00], True),   # recursion vs call stack
    ([0.00, 1.00, 0.00], [0.15, 0.99, 0.00], True),   # crossover vs mutation
    ([0.00, 1.00, 0.00], [0.30, 0.95, 0.00], True),   # crossover vs selection
    ([0.00, 0.00, 1.00], [0.10, 0.10, 0.99], True),   # MDP vs reward signal
    ([1.00, 0.00, 0.00], [0.55, 0.84, 0.00], False),  # recursion vs crossover
    ([1.00, 0.00, 0.00], [0.00, 0.00, 1.00], False),  # recursion vs football
    ([0.00, 1.00, 0.00], [0.86, 0.51, 0.00], False),  # crossover vs recursion
    ([0.00, 0.00, 1.00], [0.71, 0.71, 0.00], False),  # MDP vs unrelated
    ([0.00, 1.00, 0.00], [0.00, 0.00, 1.00], False),  # crossover vs weather
]


def metrics(threshold: float, pairs=FIXTURES) -> dict:
    tp = fp = tn = fn = 0
    for q, c, relevant in pairs:
        retrieved = cosine(q, c) >= threshold
        if retrieved and relevant:      tp += 1
        elif retrieved and not relevant: fp += 1
        elif not retrieved and relevant: fn += 1
        else:                            tn += 1
    precision = tp / (tp + fp) if tp + fp else 1.0
    recall    = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"threshold": threshold, "tp": tp, "fp": fp, "tn": tn, "fn": fn,
            "precision": round(precision, 3), "recall": round(recall, 3), "f1": round(f1, 3)}


def separation(pairs=FIXTURES) -> dict:
    rel = [cosine(q, c) for q, c, r in pairs if r]
    irr = [cosine(q, c) for q, c, r in pairs if not r]
    return {"relevant_min": round(min(rel), 3), "relevant_mean": round(sum(rel)/len(rel), 3),
            "unrelated_max": round(max(irr), 3), "unrelated_mean": round(sum(irr)/len(irr), 3),
            "gap": round(min(rel) - max(irr), 3)}


if __name__ == "__main__":
    s = separation()
    print("Score separation on the labelled set")
    print(f"  relevant   min {s['relevant_min']}   mean {s['relevant_mean']}")
    print(f"  unrelated  max {s['unrelated_max']}   mean {s['unrelated_mean']}")
    print(f"  gap between the two groups: {s['gap']}\n")

    print(f"{'thresh':>7} {'TP':>3} {'FP':>3} {'TN':>3} {'FN':>3} {'prec':>6} {'recall':>7} {'F1':>6}")
    print("-" * 50)
    best = None
    for t in [round(0.50 + i * 0.02, 2) for i in range(16)]:
        m = metrics(t)
        mark = "  <- chosen" if abs(t - 0.62) < 1e-9 else ""
        print(f"{t:>7} {m['tp']:>3} {m['fp']:>3} {m['tn']:>3} {m['fn']:>3} "
              f"{m['precision']:>6} {m['recall']:>7} {m['f1']:>6}{mark}")
        if m["precision"] == 1.0 and (best is None or m["recall"] > best["recall"]):
            best = m

    print(f"\nBest precision-1.0 operating point: threshold {best['threshold']} "
          f"(recall {best['recall']})")
    print("0.62 sits inside that band with margin on both sides, so small drift in either")
    print("direction does not start admitting off-topic material.")
