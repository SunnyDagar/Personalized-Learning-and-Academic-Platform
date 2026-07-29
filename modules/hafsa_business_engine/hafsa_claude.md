# Module context — Hafsa Shabbeer (Business Engine)

Working notes for this module. Read before changing anything in `modules/hafsa_business_engine/`.

## Owner
| | |
|---|---|
| Name | Hafsa Shabbeer |
| Role | Backend Lead / Business — DB architecture, deployment, business model &amp; unit economics |
| Presentation | **Slides 17 → end** (Business Model, Financial Forecast, Risk &amp; Cost Analytics) |
| GitHub | `hafsashabbeer` |
| Jira | project **KAN** (accountId in `learning/JIRA_RUNBOOK.md`) |

> ⚠️ **No credentials in this repo.** Contact details and passwords are deliberately not stored here — this
> repository is intended to be made **public** for the capstone submission (the brief requires a
> password-less link), and anything committed to git remains in its history permanently. Each member
> authenticates with their **own** GitHub account (`gh auth login`, or a personal access token they create
> themselves). See the root `CONTRIBUTING.md`.

## What's in this module
| File | Purpose |
|---|---|
| `unit_economics.py` | Per-institution licence economics + a 12-month MRR forecast. Runnable, stdlib only. |
| `risk_cost.py` | Monthly operating cost model, break-even calculator, and risk-weighted value using the professor's "colour-factor" risks. |
| `requirements.txt` | Standard library only — no external dependencies. |
| `README.md` | Module overview. |

```bash
python unit_economics.py     # unit economics + 12-month forecast
python risk_cost.py          # cost model, break-even, risk-weighted value
```

## Business assumptions these scripts encode
- **Client = institutions** (per-tenant annual licence), not student freemium — the decision made in
  response to Prof. Gaertner's feedback.
- Indicative licence **CAD $12,000 / institution / year**; operating cost ≈ **$250 / tenant / month**
  (AI inference + infrastructure + support) → gross margin ≈ **80%**.
- **Break-even ≈ 7 institutions** against a modest fixed-cost base.
- Forecast starts at 2 pilot institutions with 15% month-over-month tenant growth.

If you change a pricing or cost assumption here, also update **Section 1.8** of
`capstone_project/Final Report AIDI CAPSTONE II Summer 2026.html` so the report and the code agree.

## How to contribute
Work only inside this folder, commit under your own name and real dates, and open a pull request to `main`.
No backdated commits and no placeholder files — the instructor may execute this code.
