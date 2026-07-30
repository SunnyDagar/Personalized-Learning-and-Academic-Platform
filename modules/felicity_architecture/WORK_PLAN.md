# Félicité Gamgne Domgue — 5-day work plan (30 Jul → 4 Aug 2026)

Module: `modules/felicity_architecture/` · Slides 13–16 · **Final push: Monday 4 August**

Aim for **at least one commit a day**, made on the day the work is actually done.
Work only inside this folder so we don't collide.

```bash
cd Personalized-Learning-and-Academic-Platform
git pull                                  # always first
# ... make the change, run it ...
git add . && git commit -m "Félicité: <what changed>" && git push
```

---

## Day 1 — Wed 30 Jul · Read and run everything
You joined last — start by getting the app running and seeing your monitor work.

| # | Add | Where |
|---|---|---|
| 1 | Run the app, then `php -r 'require "backend/observability.php"; print_r(obs_report());'` | — |
| 2 | Note anything unclear in the architecture doc | `architecture.md` |

## Day 2 — Thu 31 Jul · Sharpen the SLO definitions
Make the targets specific and defensible in your slides.

| # | Add | Where |
|---|---|---|
| 1 | Add the measurement window and what counts as an error | `observability.md` |
| 2 | Add an `obs_slo_status()` helper returning pass/fail per objective | `backend/observability.php` |

## Day 3 — Fri 1 Aug · Architecture diagram
Slides 13–16 need a picture, not just prose.

| # | Add | Where |
|---|---|---|
| 1 | ASCII or image diagram of client → edge → hosted API | `architecture.md` |
| 2 | Label exactly what ships vs what stays on the server | `architecture.md` |

## Day 4 — Sat 2 Aug · Chart robustness
Your chart should behave with awkward data.

| # | Add | Where |
|---|---|---|
| 1 | Handle empty data, a single bucket, and very large counts | `ui/distribution-chart.component.ts` |
| 2 | Note the reasoning for hand-drawn SVG over a charting library | `README.md` |

## Day 5 — Mon 4 Aug · Docs + FINAL PUSH ✅
Tie it together for your video.

| # | Add | Where |
|---|---|---|
| 1 | Write up the SLI results you measured | `README.md` |
| 2 | Run everything once more, final commit | — |

---

## Rules
- Commit on the **day the work happens** — no backdating.
- **Run your code before every push** — the instructor may execute it.
- Never commit secrets. The repository is **public**.
- Don't touch `backend/observability.php` without telling Sunny — it is wired into the running app
  (`server-edge/gateway.php` loads it), so a mistake there breaks the whole demo.

## After 4 August
- Your **own individual repo** — the brief says individual code cannot be the same as the group code.
  If your contribution was PM/documentation rather than code, that is explicitly fine (Note 3).
- Your **8–12 minute video** — demo steps are in
  `capstone_project/Individual Deliverables/Team_Video_Demo_Guide.pdf`.
