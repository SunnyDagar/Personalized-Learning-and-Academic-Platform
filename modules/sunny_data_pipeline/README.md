# Data & Retrieval Pipeline — Surender “Sunny” Dagar

**Slides 6–9** · Project Manager / AI Lead · GitHub `SunnyDagar`

The retrieval layer behind the AI study assistant, the practice quizzes and the flashcards — and
the **grounding gate** that keeps the assistant on the professor's material.

---

## The pipeline

```
  file (PDF / DOCX / MD / TXT)
        │
        ▼
  ┌───────────────┐   normalise · repair hyphenation · drop page headers
  │  extraction/  │   extract.py
  └───────┬───────┘
          ▼
  ┌───────────────┐   ~400 words, 50-word overlap, never mid-sentence
  │  chunking/    │   chunk.py · chunk_tuning.py
  └───────┬───────┘
          ▼
  ┌───────────────┐   gemini-embedding-001 → 3072-dim vectors, cached by content hash
  │  embedding/   │   embed.py · embedding_cache.py
  └───────┬───────┘
          ▼
  ┌───────────────┐   cosine similarity, ranked
  │  retrieval/   │   search.py
  └───────┬───────┘
          ▼
     score ≥ 0.62 ?
      │         │
     yes        no
      │         │
      ▼         ▼
  grounded    REFUSE — the language model is never called
   answer
```

## What each stage does

| Folder | File | Purpose |
|---|---|---|
| `extraction/` | `extract.py` | Text out of PDF/DOCX/MD/TXT; repairs words split across line breaks, drops repeated page headers, normalises whitespace |
| `chunking/` | `chunk.py` | Word-window and sentence-aware splitting with overlap |
| | `chunk_tuning.py` | Sweeps sizes and overlaps — the evidence for 400/50 |
| `embedding/` | `embed.py` | Gemini embeddings (key from the environment, never committed) |
| | `embedding_cache.py` | Content-hash cache — a chunk is embedded once, even across re-ingests |
| `retrieval/` | `search.py` | Cosine similarity, ranking, and the `MIN_SIM = 0.62` gate |
| `evaluation/` | `evaluate_retrieval.py` | Precision/recall sweep that justifies the threshold |
| | `test_grounding.py` | Unit tests for the similarity maths and chunking |
| | `test_extract.py` | Extractor tests — builds real PDF and DOCX files on the fly |
| | `test_ingest.py` | Chunking tests — sentences stay intact, no words lost |
| | `test_embedding_cache.py` | Cache tests — a hit must never reach the API |
| `cli/` | `ingest_cli.py` | The whole pipeline in one command |
| `ui/` | `chat-sources.component.ts` | Shows which chunks grounded an answer |
| `backend/` | `edge_cache.php` | Per-user response cache at the edge *(wired into the live app)* |

## Run it

```bash
# whole pipeline, no API key needed
python3 cli/ingest_cli.py notes.md --dry-run --query "what stops a recursion?"

# with real embeddings
export GEMINI_API_KEY=...
python3 cli/ingest_cli.py notes.md --query "what stops a recursion?"

# the evidence behind the threshold
python3 evaluation/evaluate_retrieval.py

# text out of any supported file
python3 extraction/extract.py "Final Report.pdf"

# tests — 103, no network, no API key, no third-party libraries
cd evaluation && python3 -m unittest discover -p 'test_*.py'
```

## Why the gate matters

A general chatbot answers anything, including things a course never covered — confidently and
sometimes wrongly. This assistant retrieves first, and **if nothing clears 0.62 it refuses in
code, before the model is called.** It cannot hallucinate an answer it was never asked to produce.

The threshold is measured, not guessed. `evaluation/evaluate_retrieval.py` sweeps candidate values
over labelled pairs: relevant pairs score ~0.94+, unrelated pairs ~0.55 and below, and precision
reaches 1.0 from about 0.56 upward. 0.62 sits inside that band with margin on both sides, so
ordinary drift does not start admitting off-topic material.

The trade-off is deliberately asymmetric. A false positive means answering from material that does
not cover the question — the failure this whole design exists to prevent. A false negative just
means the student rephrases.

## Extraction, and why it is harder than it looks

Extraction is where damage happens silently — nothing raises, the text is simply worse, and
retrieval quality drops for reasons no error message explains. Three real cases this handles:

- **A word split across a line break.** `recur-\nsion` never matches a query for *recursion*, so
  the hyphenation is repaired before anything else runs.
- **Glyph codes are not characters.** A PDF exported from a browser or Word embeds a *subset* font
  whose codes are arbitrary; reading them as text yields `% q % V V q`. The font's `/ToUnicode`
  CMap is the translation table, so it is parsed and applied per font.
- **Not every position change is a line break.** Those exporters place almost every glyph with its
  own `Td`/`Tm`. Treating each as a newline turns `PROJECTS` into eight one-letter "words" and
  wrecks the chunking downstream — so a break is emitted only when the *y* coordinate moves.

Both formats are read with the standard library only: a DOCX is a ZIP of XML, and PDF text lives
in Flate-compressed content streams. No third-party dependency, nothing to install.

**Known limit:** a scanned PDF holds images, not text operators. That is detected and reported as
needing OCR rather than silently returning an empty document.

## Why 400 words with 50 of overlap — measured, not assumed

`chunking/chunk_tuning.py` sweeps sizes and overlaps over a real 6,588-word corpus (this project's
own final report, extracted with `extraction/extract.py`). Two numbers matter, and they pull in
opposite directions:

- **redundancy** — total chunk words ÷ corpus words. What overlap *costs*: every chunk is a
  separate embedding call, so 1.14 means paying for 14% more embeddings.
- **sentences intact** — the share of sentences that survive whole inside at least one chunk. What
  overlap *buys*. A sentence split across a boundary is in neither chunk complete, so no embedding
  represents it, and that definition cannot be retrieved however good the model is.

| size / overlap | chunks | redundancy | sentences intact |
|---|---|---|---|
| 400 / 0 | 17 | 1.00 | 93.4% |
| 400 / 25 | 18 | 1.07 | 97.9% |
| **400 / 50** | **19** | **1.14** | **99.6%** |
| 400 / 100 | 22 | 1.32 | 100.0% |

**Overlap 0 loses 6.6% of sentences outright** — roughly one in fifteen definitions unretrievable,
for no error and no warning. 50 words recovers almost all of it for two extra chunks. Going to 100
nearly doubles the redundancy cost to recover the last 0.4%, which is not worth paying on every
document forever.

On **size**, the sweep shows 200 words needs 44 chunks where 400 needs 19 — more than double the
embedding cost — while 800 gives only 9 chunks, each averaging several topics, which is the failure
mode the gate cannot detect: an averaged embedding matches everything weakly and nothing strongly.

Reproduce with `python3 chunking/chunk_tuning.py <textfile>`.

## Design decisions worth defending

- **Sentence-aware chunking** — course material is mostly definitions; cutting one in half hurts
  retrieval more than uneven chunk sizes do.
- **50-word overlap** — a definition on a boundary appears in both neighbours, so whichever chunk
  the query matches, the full statement is present.
- **Cache by content hash, including the model name** — editing one paragraph re-embeds only the
  chunks that changed; changing model invalidates everything, as it must.
- **No vector database** — a course is tens to a few hundred chunks. Similarity scanning is
  negligible next to the model round-trip, so an index would optimise the part that is not the
  bottleneck. Retrieval sits behind one interface, so it can be swapped if that ever changes.

## Relationship to production

These are runnable reference implementations of the pipeline that runs live at
<https://dagarretail.com> (production is PHP: `lib/rag.php`, `lib/gemini.php`, `routes/chat.php`).
`backend/edge_cache.php` and `ui/chat-sources.component.ts` are the two pieces of this module wired
into the shipped application.

> Secrets — `.env`, API keys, the server-side engine — live only on the server, never in this repository.
