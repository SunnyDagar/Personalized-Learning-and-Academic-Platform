# Hafsa Shabbeer — 5-day work plan (30 Jul → 4 Aug 2026)

Module: `modules/hafsa_business_engine/` · Slides 17–end · **Final push: Monday 4 August**

Aim for **at least one commit a day**, made on the day the work is actually done.
Work only inside this folder so we don't collide.

```bash
cd Personalized-Learning-and-Academic-Platform
git pull                                  # always first
# ... make the change, run it ...
git add . && git commit -m "Hafsa: <what changed>" && git push
```

---

## Day 1 — Wed 30 Jul · Tests for the calculators
Four calculators, no tests yet — the rubric scores *well tested*.

| # | Add | Where |
|---|---|---|
| 1 | Tests for margin, break-even and LTV, including divide-by-zero | `test_business_engine.py` |
| 2 | Guard against negative or zero inputs | `unit_economics.py`, `risk_cost.py` |

## Day 2 — Thu 31 Jul · Sensitivity analysis
Shows the model isn't just one hopeful number.

| # | Add | Where |
|---|---|---|
| 1 | What happens to break-even at ±20% price and ±20% cost | `sensitivity.py` |
| 2 | Print it as a small table | `sensitivity.py` |

## Day 3 — Fri 1 Aug · Competitor comparison
Strengthens the business-model section of your slides.

| # | Add | Where |
|---|---|---|
| 1 | Structured comparison: LMS vs consumer AI tutors vs us | `competitors.md` |
| 2 | One line on where each one leaves a gap | `competitors.md` |

## Day 4 — Sat 2 Aug · Licence states
Your edge component is the commercial control point — make its behaviour explicit.

| # | Add | Where |
|---|---|---|
| 1 | Document every licence state and the message an admin sees | `README.md` |
| 2 | Tests for the key-format and missing-key paths | `test_licence.php` or notes |

## Day 5 — Mon 4 Aug · Docs + FINAL PUSH ✅
Tie it together for your video.

| # | Add | Where |
|---|---|---|
| 1 | Summary of the numbers your scripts produce | `README.md` |
| 2 | Run all four scripts once more, final commit | — |

---

## Rules
- Commit on the **day the work happens** — no backdating.
- **Run your code before every push** — the instructor may execute it.
- Never commit secrets. The repository is **public**.
- Don't touch `backend/licence.php` without telling Sunny — it is wired into the running app
  (`server-edge/gateway.php` loads it), so a mistake there breaks the whole demo.

## After 4 August
- Your **own individual repo** — the brief says individual code cannot be the same as the group code.
  If your contribution was PM/documentation rather than code, that is explicitly fine (Note 3).
- Your **8–12 minute video** — demo steps are in
  `capstone_project/Individual Deliverables/Team_Video_Demo_Guide.pdf`.
