"""
Grounding & strict course-scope gate — Surender (Sunny) Dagar.

This is the anti-hallucination layer of the AI study assistant: the model is ONLY
allowed to answer from retrieved course material. If retrieval finds nothing relevant
(similarity below a threshold), we refuse in code — the LLM never gets a chance to make
something up. This mirrors the production PHP implementation (routes/chat.php).

Secrets-free and runnable: set GEMINI_API_KEY in your environment to try it.
"""
import os
from ingest_embed import embed, cosine   # reuse the pipeline

# Gemini embeddings: same-topic chunks score ~0.70+, unrelated ~0.55-. 0.62 separates them.
MIN_SIM = 0.62


def retrieve(query, store, k=4):
    """Rank stored (text, vector) chunks by cosine similarity; keep only those above MIN_SIM."""
    qv = embed(query)
    scored = [(c, cosine(qv, v)) for c, v in store]
    scored = [s for s in scored if s[1] >= MIN_SIM]
    scored.sort(key=lambda s: s[1], reverse=True)
    return scored[:k]


def build_grounded_prompt(question, hits, brand="Learnify", first="there"):
    """Construct the grounded system prompt from retrieved material only."""
    material = "\n".join(f"- {c}" for c, _ in hits)
    system = (
        f"You are {brand}, a friendly study assistant speaking with {first}. "
        "Answer PRECISELY using ONLY the COURSE MATERIAL below. Keep it simple and short. "
        "If the material does not contain the answer, say you can only help with course topics.\n\n"
        f"COURSE MATERIAL:\n{material}"
    )
    return system


def answer(question, store, brand="Learnify", first="there"):
    """The full gate: retrieve → refuse-in-code if empty → otherwise return a grounded prompt."""
    hits = retrieve(question, store)
    if not hits:
        # CODE-level refusal — the LLM is never invoked for off-syllabus questions.
        return {"grounded": False,
                "answer": f"That's outside your course study material, {first}. "
                          "I can only help with topics your professor uploaded for this course."}
    return {"grounded": True, "system_prompt": build_grounded_prompt(question, hits, brand, first),
            "sources": [round(score, 3) for _, score in hits]}


if __name__ == "__main__":
    # tiny demo with fake vectors (no API key needed for the gate logic itself)
    demo_store = [("A base case stops recursion.", [1.0, 0.0]),
                  ("Crossover mixes two parents in a genetic algorithm.", [0.0, 1.0])]
    # (in production, vectors come from embed(); here we just show the threshold gate)
    print("MIN_SIM gate =", MIN_SIM)
    print("On-topic  → grounded answer built from retrieved chunks")
    print("Off-topic → refused in code, LLM never called")
