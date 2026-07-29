# Business Engine — Hafsa Shabbeer (Slides 17+)

Business model, unit economics, and financial forecasting for the **institutional SaaS** model

`unit_economics.py` is a runnable calculator: given per-institution pricing and costs, it projects
revenue, gross margin, and a simple 12-month forecast.

```bash
python unit_economics.py
```

### Front-end
| File | What it does |
|---|---|
| `ui/brand-config.component.ts` | White-label brand bar per tenant; renders the locked state when a licence is inactive |

Angular 17 standalone component — drop into the client app under `client/src/app/`.
