"""
Embeddings — Surender (Sunny) Dagar (slides 6–9).

Stage 3. Turns each chunk into a 3072-dimension vector with Google's gemini-embedding-001, so
similarity becomes arithmetic rather than keyword matching.

The API key is read from the environment and never stored in this repository.

    export GEMINI_API_KEY=...        # your own key
    python3 embed.py "some text"
"""
import os
import sys

MODEL = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001")
DIMS = 3072


def embed(text: str) -> list[float]:
    """One chunk -> one vector. Raises if the key is missing rather than failing silently."""
    if not text or not text.strip():
        raise ValueError("cannot embed empty text")
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set in the environment")

    import google.generativeai as genai
    genai.configure(api_key=key)
    return genai.embed_content(model=MODEL, content=text)["embedding"]


def embed_batch(chunks: list[str], on_progress=None) -> list[list[float]]:
    """
    Embed a list of chunks, reporting progress.

    Kept deliberately simple and sequential: a course is tens to a few hundred chunks, so the
    added complexity of concurrency is not justified, and sequential calls stay inside rate limits.
    """
    out = []
    for i, c in enumerate(chunks, 1):
        out.append(embed(c))
        if on_progress:
            on_progress(i, len(chunks))
    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    v = embed(" ".join(sys.argv[1:]))
    print(f"model: {MODEL}\ndimensions: {len(v)}\nfirst 5: {[round(x, 4) for x in v[:5]]}")
