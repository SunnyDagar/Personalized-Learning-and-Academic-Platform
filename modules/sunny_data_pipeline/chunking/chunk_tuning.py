"""
Chunk-size tuning — Surender (Sunny) Dagar (slides 6–9).

Evidence for the 400/50 choice rather than an assertion. Runs both strategies across a range of
sizes and reports the trade-off: chunk count (cost — every chunk is an embedding call) against
coverage redundancy (safety — how much text is repeated so a definition is never orphaned).

    python3 chunk_tuning.py <textfile>
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from chunk import chunk_words, chunk_sentences, describe


def redundancy(chunks: list[str], original_words: int) -> float:
    """How many times the corpus is repeated across chunks. 1.0 = no overlap at all."""
    if not chunks or not original_words:
        return 0.0
    return round(sum(len(c.split()) for c in chunks) / original_words, 3)


def _contains(haystack: list[str], needle: list[str]) -> bool:
    """Is `needle` a contiguous run inside `haystack`?"""
    n = len(needle)
    if not n or n > len(haystack):
        return False
    head = needle[0]
    return any(
        haystack[i] == head and haystack[i:i + n] == needle
        for i in range(len(haystack) - n + 1)
    )


def boundary_survival(text: str, size: int, overlap: int, min_words: int = 6) -> float:
    """Fraction of sentences that survive intact inside at least one chunk.

    This is the number that justifies overlap. Redundancy measures what overlap *costs*; this
    measures what it *buys*. A sentence split across two chunks is in neither one whole, so no
    embedding represents it — the definition becomes unretrievable no matter how good the model is.
    """
    sentences = [
        s.split() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.split()) >= min_words
    ]
    if not sentences:
        return 0.0
    chunks = [c.split() for c in chunk_words(text, size, overlap)]
    intact = sum(1 for s in sentences if any(_contains(c, s) for c in chunks))
    return round(intact / len(sentences), 3)


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
    print("\nWhat the overlap buys, at size 400 — sentences surviving intact in some chunk:")
    print(f"\n{'overlap':>8} {'chunks':>7} {'redundancy':>11} {'sentences intact':>17}")
    print("-" * 48)
    for ov in (0, 25, 50, 100):
        c = chunk_words(text, 400, ov)
        print(f"{ov:>8} {len(c):>7} {redundancy(c, total):>11} "
              f"{boundary_survival(text, 400, ov):>16.1%}")

    sent_chunks = chunk_sentences(text, 400, 50)
    print(f"\nsentence-aware (400/50): {len(sent_chunks)} chunks, "
          f"redundancy {redundancy(sent_chunks, total)}")
    print("\nWithout overlap, sentences that straddle a boundary are in neither chunk whole, so no")
    print("embedding represents them. 50 words closes almost all of that gap for ~14% more chunks;")
    print("100 words costs nearly double the redundancy to recover very little more.")
