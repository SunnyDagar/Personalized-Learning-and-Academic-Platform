"""
Embedding cache — Surender (Sunny) Dagar (slides 6–9).

Embedding is the expensive step: one API call per chunk, billed per token, and re-running a
document that has not changed pays for it again. This caches by content hash, so a chunk is
embedded once no matter how many times the document is re-ingested.

Content-addressed on purpose: if a professor edits one paragraph, only the chunks that actually
changed are re-embedded — the rest hit the cache.

    python3 embedding_cache.py       # demonstrates a hit and a miss
"""
import hashlib
import json
from pathlib import Path

CACHE_DIR = Path.home() / ".cache" / "learnify_embeddings"


def _key(text: str, model: str) -> str:
    """Hash the content AND the model — changing model must invalidate every entry."""
    return hashlib.sha256(f"{model}\x00{text}".encode("utf-8")).hexdigest()


def get(text: str, model: str) -> list[float] | None:
    p = CACHE_DIR / f"{_key(text, model)}.json"
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except (json.JSONDecodeError, OSError):
        return None          # a corrupt entry is a miss, never a crash


def put(text: str, model: str, vector: list[float]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    (CACHE_DIR / f"{_key(text, model)}.json").write_text(json.dumps(vector))


def embed_cached(text: str, model: str, embed_fn) -> tuple[list[float], bool]:
    """Return (vector, was_cached). embed_fn is injected so this stays testable offline."""
    hit = get(text, model)
    if hit is not None:
        return hit, True
    vec = embed_fn(text)
    put(text, model, vec)
    return vec, False


def stats() -> dict:
    if not CACHE_DIR.exists():
        return {"entries": 0, "bytes": 0}
    files = list(CACHE_DIR.glob("*.json"))
    return {"entries": len(files), "bytes": sum(f.stat().st_size for f in files)}


if __name__ == "__main__":
    calls = {"n": 0}

    def fake_embed(t: str) -> list[float]:      # stand-in so the demo needs no API key
        calls["n"] += 1
        return [float(len(t)), 0.5, 0.25]

    text, model = "A base case stops the recursion.", "demo-model"
    v1, c1 = embed_cached(text, model, fake_embed)
    v2, c2 = embed_cached(text, model, fake_embed)

    print(f"first call  -> cached={c1}  (API calls so far: {calls['n']})")
    print(f"second call -> cached={c2}  (API calls so far: {calls['n']})")
    print(f"vectors identical: {v1 == v2}")
    print(f"cache: {stats()}")
