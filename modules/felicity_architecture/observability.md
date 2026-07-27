# Observability — SLIs / SLOs

| SLI | SLO |
|---|---|
| API availability (`/api/health` 200) | ≥ 99.5% monthly |
| Chat p95 latency | < 6 s |
| Embedding/ingest success rate | ≥ 99% |
| Auth error rate (5xx) | < 0.5% |

Logging: request + activity logs to DB (`activity_log`); alert on health-check failure and 5xx spikes.
