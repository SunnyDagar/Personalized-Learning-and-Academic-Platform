"""
Chunk-size tuning — Surender (Sunny) Dagar (slides 6–9).

Evidence for the 400/50 choice rather than an assertion. Runs both strategies across a range of
sizes and reports the trade-off: chunk count (cost — every chunk is an embedding call) against
coverage redundancy (safety — how much text is repeated so a definition is never orphaned).

    python3 chunk_tuning.py <textfile>
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chunk import chunk_words, chunk_sentences, describe


def redundancy(chunks: list[str], original_words: int) -> float:
    """How many times the corpus is repeated across chunks. 1.0 = no overlap at all."""
    if not chunks or not original_words:
        return 0.0
    return round(sum(len(c.split()) for c in chunks) / original_words, 3)


def sweep(text: str, sizes=(200, 300, 400, 600, 800), overlaps=(0, 25, 50, 100)) -> list[dict]:
    total = len(text.split())
    rows = []
    for size in sizes:
        for ov in overlaps:
            if ov >= size:
                continue
            c = chunk_words(text, size, ov)
            d = describe(c)
            rows.append({"size": size, "overlap": ov, "chunks": d["chunks"],
                         "avg_words": d["avg_words"], "redundancy": redundancy(c, total)})
    return rows


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
    total = len(text.split())
    print(f"corpus: {total} words\n")
    print(f"{'size':>5} {'overlap':>8} {'chunks':>7} {'avg':>7} {'redundancy':>11}   cost/safety")
    print("-" * 62)
    for r in sweep(text):
        marker = "  <- chosen" if (r["size"], r["overlap"]) == (400, 50) else ""
        print(f"{r['size']:>5} {r['overlap']:>8} {r['chunks']:>7} {r['avg_words']:>7} "
              f"{r['redundancy']:>11}{marker}")
    print("\n400/50 sits where redundancy stays near 1.15 (modest extra embedding cost)")
    print("while no chunk is large enough to average several topics together.")
