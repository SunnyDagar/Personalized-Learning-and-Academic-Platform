"""
End-to-end pipeline CLI — Surender (Sunny) Dagar (slides 6–9).

Runs the whole retrieval pipeline over a file, in one command, so the stages can be seen working
together rather than in isolation:

    extract -> chunk -> embed (cached) -> retrieve -> grounding decision

    python3 ingest_cli.py notes.md
    python3 ingest_cli.py notes.md --query "what stops a recursion?"
    python3 ingest_cli.py notes.md --dry-run          # no API key needed

--dry-run substitutes a deterministic local vectoriser for the embedding call, so the pipeline is
demonstrable offline. Real runs need GEMINI_API_KEY in the environment.
"""
import argparse
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path[:0] = [str(ROOT / p) for p in ("extraction", "chunking", "embedding", "retrieval")]

from extract import extract                     # noqa: E402
from chunk import chunk_sentences, describe     # noqa: E402
from search import retrieve, cosine, MIN_SIM    # noqa: E402


# --dry-run is a LEXICAL stand-in (shared words), not a semantic model, so its scores are
# naturally lower than real embeddings. It gets its own threshold; the production gate is 0.62.
DRY_RUN_THRESHOLD = 0.25

STOPWORDS = {"a", "an", "the", "is", "are", "was", "were", "of", "to", "in", "on", "for",
             "and", "or", "it", "its", "what", "which", "who", "how", "why", "does", "do"}


def offline_vector(text: str, dims: int = 64) -> list[float]:
    """
    Deterministic stand-in for --dry-run: a normalised bag-of-words vector.

    Punctuation is stripped and stopwords dropped, otherwise "recursion?" and "recursion."
    hash to different buckets and an obviously on-topic query scores near zero.
    """
    vec = [0.0] * dims
    for word in re.findall(r"[a-z0-9]+", text.lower()):
        if word in STOPWORDS or len(word) < 3:
            continue
        h = int(hashlib.md5(word.encode()).hexdigest(), 16)
        vec[h % dims] += 1.0
    norm = sum(v * v for v in vec) ** 0.5
    return [v / norm for v in vec] if norm else vec


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the retrieval pipeline over a file.")
    ap.add_argument("file")
    ap.add_argument("--query", help="ask a question against the ingested file")
    ap.add_argument("--dry-run", action="store_true", help="use a local vectoriser, no API key")
    ap.add_argument("--size", type=int, default=400)
    ap.add_argument("--overlap", type=int, default=50)
    args = ap.parse_args()

    if not Path(args.file).exists():
        print(f"no such file: {args.file}"); return 1

    print(f"1. extract   {args.file}")
    text = extract(args.file)
    print(f"             {len(text.split())} words after cleaning")

    print("2. chunk")
    chunks = chunk_sentences(text, args.size, args.overlap)
    print(f"             {describe(chunks)}")

    print("3. embed" + ("     (dry run — local vectoriser)" if args.dry_run else ""))
    if args.dry_run:
        vectors = [offline_vector(c) for c in chunks]
    else:
        from embed import embed_batch, MODEL
        print(f"             model {MODEL}")
        vectors = embed_batch(chunks, on_progress=lambda i, n: print(f"\r             {i}/{n}", end=""))
        print()
    store = list(zip(chunks, vectors))
    print(f"             {len(store)} chunks indexed")

    if not args.query:
        print("\nIndexed. Pass --query to ask a question.")
        return 0

    print(f"\n4. retrieve  {args.query!r}")
    qv = offline_vector(args.query) if args.dry_run else __import__("embed").embed(args.query)
    threshold = DRY_RUN_THRESHOLD if args.dry_run else MIN_SIM
    hits = retrieve(qv, store, k=3, min_sim=threshold)

    if not hits:
        top = max((cosine(qv, v) for _, v in store), default=0.0)
        print(f"             best score {top:.3f} < {threshold} threshold")
        print("\n5. decision  REFUSE — outside the course material.")
        print("             The language model is never called.")
        return 0

    print("5. decision  ANSWER — grounded in:")
    for text_, score in hits:
        print(f"             {score:.3f}  {text_[:70]}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
