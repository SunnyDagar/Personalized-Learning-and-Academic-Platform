# Sanchit Chhabra — 5-day work plan (30 Jul → 4 Aug 2026)

Module: `modules/sanchit_core_overview/` · Slides 1–5 · **Final push: Monday 4 August**

Aim for **at least one commit a day**, made on the day the work is actually done.
Work only inside this folder so we don't collide.

```bash
cd Personalized-Learning-and-Academic-Platform
git pull                                  # always first
# ... make the change, run it ...
git add . && git commit -m "Sanchit: <what changed>" && git push
```

---

## Day 1 — Wed 30 Jul · Expand the auth tests
You have a self-test; turn it into a real suite.

| # | Add | Where |
|---|---|---|
| 1 | Tests: valid token, expired token, tampered signature, missing header | `test_api_bootstrap.py` |
| 2 | Assert the tampered case is rejected, not just falsy | `test_api_bootstrap.py` |

## Day 2 — Thu 31 Jul · Rate-limiter behaviour
Prove the throttle does what the docs claim.

| # | Add | Where |
|---|---|---|
| 1 | Test that the limit triggers and that 0 disables it | `test_session.php` or notes |
| 2 | Document the window and the 429 response | `README.md` |

## Day 3 — Fri 1 Aug · Route guard cases
Your guard protects both portals — cover the branches.

| # | Add | Where |
|---|---|---|
| 1 | Cases: no token, wrong role, correct role | `ui/auth.guard.ts` + notes |
| 2 | Comment why the server remains the real authority | `ui/auth.guard.ts` |

## Day 4 — Sat 2 Aug · Problem & vision write-up
Slides 1–5 are the framing for the whole presentation.

| # | Add | Where |
|---|---|---|
| 1 | Concise problem statement and vision, in your own words | `README.md` |
| 2 | How the core foundations support everything else | `README.md` |

## Day 5 — Mon 4 Aug · Docs + FINAL PUSH ✅
Tie it together for your video.

| # | Add | Where |
|---|---|---|
| 1 | Run the tests, paste the passing output | `README.md` |
| 2 | Final commit | — |

---

## Rules
- Commit on the **day the work happens** — no backdating.
- **Run your code before every push** — the instructor may execute it.
- Never commit secrets. The repository is **public**.
- Don't touch `backend/session.php` without telling Sunny — it is wired into the running app
  (`server-edge/gateway.php` loads it), so a mistake there breaks the whole demo.

## After 4 August
- Your **own individual repo** — the brief says individual code cannot be the same as the group code.
  If your contribution was PM/documentation rather than code, that is explicitly fine (Note 3).
- Your **8–12 minute video** — demo steps are in
  `capstone_project/Individual Deliverables/Team_Video_Demo_Guide.pdf`.
