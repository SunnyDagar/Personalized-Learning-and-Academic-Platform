# Arnold Babu — 5-day work plan (30 Jul → 4 Aug 2026)

Module: `modules/arnold_portals/` · Slides 10–12 · **Final push: Monday 4 August**

Aim for **at least one commit a day**, made on the day the work is actually done.
Work only inside this folder so we don't collide.

```bash
cd Personalized-Learning-and-Academic-Platform
git pull                                  # always first
# ... make the change, run it ...
git add . && git commit -m "Arnold: <what changed>" && git push
```

---

## Day 1 — Wed 30 Jul · Flashcard engine — tests
The rubric scores *well tested*; this module has no tests yet.

| # | Add | Where |
|---|---|---|
| 1 | Unit tests for flip / shuffle / empty deck | `tests/flashcard_engine.test.ts` or `test_flashcards.py` |
| 2 | Guard against an empty or malformed card list | `flashcard_engine.ts` |

## Day 2 — Thu 31 Jul · Progress dashboard — edge cases
Make the calculations robust for a brand-new student with no data.

| # | Add | Where |
|---|---|---|
| 1 | Handle zero quizzes, single topic, all-equal scores | `progress_dashboard.py` |
| 2 | Tests covering those cases | `test_progress_dashboard.py` |

## Day 3 — Fri 1 Aug · Portal route coverage
Prove the edge allow-list matches what the portals actually call.

| # | Add | Where |
|---|---|---|
| 1 | Cross-check every path in `portal_endpoints.md` against `backend/routes.php` | both files |
| 2 | Add any missing route; add a test that unlisted paths are rejected | `test_routes.php` / notes |

## Day 4 — Sat 2 Aug · Mastery card polish
Small UI quality pass on your component.

| # | Add | Where |
|---|---|---|
| 1 | Accessible labels + a no-data state | `ui/mastery-card.component.ts` |
| 2 | Document the colour thresholds and why they match the professor view | `README.md` |

## Day 5 — Mon 4 Aug · Docs + FINAL PUSH ✅
Tie it together for your video.

| # | Add | Where |
|---|---|---|
| 1 | Screenshots or a short flow description of both portals | `README.md` |
| 2 | Run everything once more, confirm it works, final commit | — |

---

## Rules
- Commit on the **day the work happens** — no backdating.
- **Run your code before every push** — the instructor may execute it.
- Never commit secrets. The repository is **public**.
- Don't touch `backend/routes.php` without telling Sunny — it is wired into the running app
  (`server-edge/gateway.php` loads it), so a mistake there breaks the whole demo.

## After 4 August
- Your **own individual repo** — the brief says individual code cannot be the same as the group code.
  If your contribution was PM/documentation rather than code, that is explicitly fine (Note 3).
- Your **8–12 minute video** — demo steps are in
  `capstone_project/Individual Deliverables/Team_Video_Demo_Guide.pdf`.
