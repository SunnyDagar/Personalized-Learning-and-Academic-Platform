# Data & RAG Pipeline + Grounding — Surender (Sunny) Dagar (Slides 6–9)

**Role:** AI Lead / Project Manager. My part of the product is the retrieval pipeline that powers
the AI study assistant, quizzes, and flashcards — and the **grounding layer** that keeps the assistant
strictly on the professor's material (no hallucinations).

## What's here (real, runnable, secrets-free)
| File | What it does |
|---|---|
| `ingest_embed.py` | The pipeline: **ingest → clean → chunk (~400 words, 50 overlap) → Gemini embeddings → store → cosine retrieval** |
| `grounding.py` | The **strict course-scope gate**: retrieve, and if nothing scores above the similarity threshold, **refuse in code** — the LLM is never invoked for off-syllabus questions |
| `requirements.txt` | `google-generativeai`, `numpy` |

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=...        # your own key — never committed
python ingest_embed.py sample.txt
python grounding.py              # shows the threshold gate
```

## My contribution to the product (maps to the group codebase)
- **Data pipeline:** document ingestion, text cleaning, chunking, and **Gemini `gemini-embedding-001`**
  embeddings (3072-dim), stored as JSON for cosine retrieval. *(Production: `lib/rag.php`, `lib/gemini.php`.)*
- **Grounding / anti-hallucination:** the `MIN_SIM = 0.62` scope gate + grounded system prompt, so the
  assistant answers **only** from retrieved course material. *(Production: `routes/chat.php`.)*
- **AI generation hooks:** grounded quiz/flashcard/assessment generation reuse the same retrieval context.
  *(Production: `lib/aigen.php`.)*
- **SaaS + PM:** per-tenant gateway design (activation kill-switch) and overall project management.

## Why it matters
The pipeline is what makes the assistant *trustworthy for a course*: it can only teach what the
professor uploaded, and it refuses everything else in code rather than guessing. Live demo:
https://dagarretail.com (log in as a student and ask an off-topic question — it refuses).

> Secrets (`.env`, API keys, the SaaS gateway blob) live only on the server, never in this repo.

### Front-end
| File | What it does |
|---|---|
| `ui/chat-sources.component.ts` | Source citation strip — shows which course chunks grounded an answer (empty when the scope gate refuses) |

Angular 17 standalone component — drop into the client app under `client/src/app/`.

