# Surender “Sunny” Dagar — work plan (29 Jul → 4 Aug 2026)

Module: `modules/sunny_data_pipeline/` · Slides 6–9 · PM / AI Lead · **Final push: Monday 4 August**

Same rules as everyone else: commit on the day the work happens, run the code before pushing,
work inside this folder only.

```bash
cd Personalized-Learning-and-Academic-Platform
git pull
# ... make the change, run it ...
./push.sh "what you changed"
```

---

## Day 1 — Tue 29 Jul · Test the grounding gate ✅
The gate is the claim the whole module rests on, so it gets tested first.

| # | Add | Where | Status |
|---|---|---|---|
| 1 | Cosine similarity tests, including the zero-vector case | `evaluation/test_grounding.py` | ✅ |
| 2 | Threshold tests — above, below, and the documented value | `evaluation/test_grounding.py` | ✅ |
| 3 | Chunking tests — size, overlap, short input | `evaluation/test_ingest.py` | ✅ |

## Day 2 — Wed 30 Jul · Measure the 0.62 threshold ✅
Turns “we chose 0.62” into “we measured it”.

| # | Add | Where | Status |
|---|---|---|---|
| 1 | Evaluation harness over labelled relevant/unrelated pairs | `evaluation/evaluate_retrieval.py` | ✅ |
| 2 | Precision, recall and separation across candidate thresholds | `evaluation/evaluate_retrieval.py` | ✅ |
| 3 | Record the results | `README.md` | ✅ |

**Measured:** relevant pairs ≥ 0.94 · unrelated ≤ 0.548 · precision 1.0 from ≈0.56 upward.
0.62 sits inside that band with margin on both sides.

## Day 3 — Thu 31 Jul · Text extraction ✅
The README described this stage; the code lived only in the server PHP. Bring it into the module.

| # | Add | Where | Status |
|---|---|---|---|
| 1 | Plain-text + Markdown extraction, whitespace normalisation | `extraction/extract.py` | ✅ |
| 2 | PDF extraction | `extraction/extract.py` | ✅ |
| 3 | DOCX extraction + a dispatcher by file type | `extraction/extract.py` | ✅ |
| 4 | Tests for the extractors | `evaluation/test_extract.py` | ✅ |

**Worth noting for the video:** the first version passed its own tests but produced six words of
garbage from a real PDF. Two bugs only real files exposed — embedded subset fonts need their
`/ToUnicode` map, and a browser positions every glyph individually, so a line break is a *vertical*
move, not any move. `Jira.pdf` went from 6 to 711 words; the final report from 1,389 to 6,588.

## Day 4 — Fri 1 Aug · Chunking strategy, with evidence
| # | Add | Where |
|---|---|---|
| 1 | Compare 200 / 400 / 600-word chunks | `chunking/chunk_tuning.py` |
| 2 | Measure the effect of overlap on redundancy | `chunking/chunk_tuning.py` |
| 3 | Write up why 400/50 was chosen | `README.md` |

## Day 5 — Sat 2 Aug · Embedding cache ✅ (tests landed early, 31 Jul)
| # | Add | Where | Status |
|---|---|---|---|
| 1 | Content-hash cache so unchanged chunks are not re-embedded | `embedding/embedding_cache.py` | ✅ |
| 2 | Wire it into the pipeline | `ingest_embed.py` | ✅ |
| 3 | Tests + a cost note | `evaluation/test_embedding_cache.py` | ✅ |

## Day 6 — Sun 3 Aug · End-to-end CLI ✅
| # | Add | Where | Status |
|---|---|---|---|
| 1 | File in, indexed chunks out | `cli/ingest_cli.py` | ✅ |
| 2 | `--query` mode demonstrating retrieval *and* the refusal | `cli/ingest_cli.py` | ✅ |
| 3 | Usage documentation | `README.md` | ✅ |

## Day 7 — Mon 4 Aug · Final polish and FINAL PUSH
| # | Add |
|---|---|
| 1 | Docstrings and type hints across the module |
| 2 | Run the whole suite, confirm green, record the count |
| 3 | Final commit — module complete |

---

## Rules
- Commit on the **day the work happens** — no backdating, no padding the activity graph.
- **Run the code before every push** — the instructor may execute it.
- Never commit secrets. The repository is **public**; `GEMINI_API_KEY` comes from the environment.
- Keep everything inside `modules/sunny_data_pipeline/`.
- Nothing that belongs to the hosted half — no database credentials, no SQL, no AI prompts.

## After 4 August
- My **own individual repo** — the brief says individual code cannot be the same as the group code.
- My **8–12 minute video** — demo steps are in
  `capstone_project/Individual Deliverables/Team_Video_Demo_Guide.pdf`.
