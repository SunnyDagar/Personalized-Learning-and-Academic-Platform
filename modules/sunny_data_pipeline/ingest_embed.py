"""
Reference RAG ingestion pipeline (mirrors the production PHP implementation).
ingest -> clean -> chunk (~400 words, 50 overlap) -> Gemini embeddings -> in-memory store -> cosine retrieval.
"""
import os, sys, re, math

EMBED_MODEL = os.environ.get("GEMINI_EMBED_MODEL", "gemini-embedding-001")


def clean_text(t: str) -> str:
    return re.sub(r"\s+", " ", t).strip()


def chunk_text(text: str, size: int = 400, overlap: int = 50):
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + size]))
        i += size - overlap
    return chunks


def embed(text: str):
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    return genai.embed_content(model=EMBED_MODEL, content=text)["embedding"]


def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)); nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb) if na and nb else 0.0


def main():
    if len(sys.argv) < 2:
        print("usage: python ingest_embed.py <textfile>"); return
    raw = open(sys.argv[1], encoding="utf-8").read()
    chunks = chunk_text(clean_text(raw))
    print(f"{len(chunks)} chunks")
    store = [(c, embed(c)) for c in chunks]        # production stores these as JSON in MySQL doc_chunks
    q = input("ask a question: ")
    qv = embed(q)
    ranked = sorted(store, key=lambda s: cosine(qv, s[1]), reverse=True)[:3]
    for c, _ in ranked:
        print(" -", c[:120])


if __name__ == "__main__":
    main()
