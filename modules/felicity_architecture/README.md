# Architecture, Infrastructure & Observability — Félicité Domgue (Slides 13–16)

System architecture, database/infra specs, and observability (SLIs/SLOs).

- `architecture.md` — the 3-tier SaaS design (client → gateway → owner API + DB + AI).
- `docker-compose.yml` — local dev stack reference.
- `observability.md` — SLIs/SLOs and logging/monitoring plan.

### Front-end
| File | What it does |
|---|---|
| `ui/distribution-chart.component.ts` | Grade distribution chart — hand-drawn SVG, no charting dependency |

Angular 17 standalone component — drop into the client app under `client/src/app/`.
