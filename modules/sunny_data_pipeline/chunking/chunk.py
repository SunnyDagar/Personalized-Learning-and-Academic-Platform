"""
Chunking — Surender (Sunny) Dagar (slides 6–9).

Stage 2 of the pipeline. An embedding represents one passage, so how a document is split decides
what can be retrieved at all. Two failure modes bracket the choice:

  too small — the answer spans several chunks and none of them scores well on its own
  too large — one embedding averages several topics and stops matching any of them strongly

We use ~400 words with 50 words of overlap. The overlap is the important part: it stops a
definition being cut in half at a boundary, because the sentence appears at the end of one chunk
and the start of the next.

Standard library only.

    python3 chunk.py <textfile>
"""
import re
import sys
from pathlib import Path

DEFAULT_SIZE = 400
DEFAULT_OVERLAP = 50


def chunk_words(text: str, size: int = DEFAULT_SIZE, overlap: int = DEFAULT_OVERLAP) -> list[str]:
    """Fixed-width word windows with overlap — predictable and cheap to reason about."""
    if size <= 0:
        raise ValueError("size must be positive")
    if overlap >= size:
        raise ValueError("overlap must be smaller than size, or the window never advances")

    words = text.split()
    if not words:
        return []

    chunks, i, step = [], 0, size - overlap
    while i < len(words):
        chunks.append(" ".join(words[i:i + size]))
        if i + size >= len(words):
            break
        i += step
    return chunks


def chunk_sentences(text: str, size: int = DEFAULT_SIZE, overlap: int = DEFAULT_OVERLAP) -> list[str]:
    """
    Sentence-aware variant: fill up to `size` words but never cut mid-sentence.

    Slightly uneven chunks in exchange for never splitting a definition — and course material is
    largely definitions. Falls back to word windows when there are no sentence boundaries.
    """
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    if len(sentences) <= 1:
        return chunk_words(text, size, overlap)

    chunks: list[str] = []
    current: list[str] = []
    count = 0

    for sent in sentences:
        n = len(sent.split())
        if count + n > size and current:
            chunks.append(" ".join(current))
            tail, kept = [], 0
            for s in reversed(current):          # carry a tail back as the overlap
                w = len(s.split())
                if kept + w > overlap:
                    break
                tail.insert(0, s); kept += w
            current, count = tail, kept
        current.append(sent)
        count += n

    if current:
        chunks.append(" ".join(current))
    return chunks


def describe(chunks: list[str]) -> dict:
    """Summary stats — used by chunk_tuning.py to compare strategies."""
    if not chunks:
        return {"chunks": 0}
    lens = [len(c.split()) for c in chunks]
    return {"chunks": len(chunks), "min_words": min(lens), "max_words": max(lens),
            "avg_words": round(sum(lens) / len(lens), 1), "total_words": sum(lens)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
    for label, fn in (("word-window", chunk_words), ("sentence-aware", chunk_sentences)):
        print(f"{label:16} {describe(fn(text))}")
