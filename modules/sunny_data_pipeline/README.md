# Data & RAG Pipeline — Sunny (Surender) Dagar (Slides 6–9)

The retrieval pipeline that powers the AI assistant, quizzes, and flashcards:
**ingest → clean → chunk → embed (Gemini) → store (MySQL) → cosine retrieval.**

`ingest_embed.py` is a runnable reference implementation of that pipeline (the production version is in
PHP on the server). Set `GEMINI_API_KEY` in your environment to run it.

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=...   # your own key
python ingest_embed.py sample.txt
```
