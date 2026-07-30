"""
Retrieval — Surender (Sunny) Dagar (slides 6–9).

Stage 4. Rank stored chunks against a question by cosine similarity, then apply the scope gate.

Cosine measures the angle between two vectors, so it compares meaning rather than magnitude —
a long chunk is not "more similar" simply for being long.

Standard library only; vectors are passed in, so this is testable without any API key.

    python3 search.py
"""
import math

MIN_SIM = 0.62   # measured: same-topic ~0.70+, unrelated ~0.55-. See evaluation/.


def cosine(a: list[float], b: list[float]) -> float:
    """Similarity in [-1, 1]. Returns 0.0 for a zero vector rather than raising."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def rank(query_vec: list[float], store: list[tuple[str, list[float]]], k: int = 4):
    """Every chunk scored and sorted. No threshold applied — that is the gate's job."""
    scored = [(text, cosine(query_vec, vec)) for text, vec in store]
    scored.sort(key=lambda s: s[1], reverse=True)
    return scored[:k]


def retrieve(query_vec: list[float], store, k: int = 4, min_sim: float = MIN_SIM):
    """Ranked results filtered by the threshold. An empty list means: refuse to answer."""
    return [(t, s) for t, s in rank(query_vec, store, k) if s >= min_sim]


if __name__ == "__main__":
    store = [
        ("A base case stops the recursion.",            [1.0, 0.0, 0.0]),
        ("Recursive functions call themselves.",        [0.9, 0.2, 0.0]),
        ("Crossover mixes two parent solutions.",       [0.0, 1.0, 0.0]),
    ]
    on_topic  = [1.0, 0.05, 0.0]     # a recursion question
    off_topic = [0.0, 0.0, 1.0]      # something the course never covered

    print("on-topic query:")
    for t, s in retrieve(on_topic, store):
        print(f"   {s:.3f}  {t}")
    print("\noff-topic query:")
    hits = retrieve(off_topic, store)
    print("   " + (f"{len(hits)} hits" if hits else "no hits -> the assistant refuses, "
                                                    "and the model is never called"))
