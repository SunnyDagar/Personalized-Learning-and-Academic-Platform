# Personalized Learning & Academic Support Platform

AIDI Capstone II — Group 1. An **institutional SaaS** platform: a course-grounded AI study
assistant plus instructor analytics, delivered to colleges under a per-tenant licence.

**Live reference deployment:** <https://dagarretail.com>
**Stack:** Angular 17 · PHP 8.3 · MySQL · Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`)

---

## ⚠️ Read `ARCHITECTURE.md` first

This repository holds **the customer half** of the product. The API, database, retrieval engine,
AI keys, and tenant control plane run on the provider's server and are **not distributed**.

The result is deliberate: **the code here runs, but it is not the whole product.** Combine every
file in this repository and you get a working application — because the missing half answers over
HTTPS. You do not get the missing half.

## Layout

```
client/         Angular UI — every screen (the entire user experience)
server-edge/    thin forwarder the customer hosts (no logic, no data, no keys)
modules/        per-member engineering work
ARCHITECTURE.md what ships vs. what stays on the server
```

## Module ownership

Each member owns a slice of the **UI** and a slice of the **edge / server-facing** work, mapped to
their presentation section.

| Member | Module | Presentation | Client-side focus | Server-facing focus |
|---|---|---|---|---|
| Sanchit Chhabra | `modules/sanchit_core_overview` | Slides 1–5 | App shell, routing, auth screens | API bootstrap, JWT verification, health |
| Surender “Sunny” Dagar | `modules/sunny_data_pipeline` | Slides 6–9 | Assistant chat surface, source display | Ingestion, embeddings, retrieval, grounding gate |
| Arnold Babu | `modules/arnold_portals` | Slides 10–12 | Student & instructor portals, dashboards, flashcards | Portal endpoint contracts |
| Félicité Gamgne Domgue | `modules/felicity_architecture` | Slides 13–16 | Analytics visualisations | Architecture, deployment, SLI/SLO monitoring |
| Hafsa Shabbeer | `modules/hafsa_business_engine` | Slides 17+ | Licensing / branding configuration surface | Business model, unit economics, risk & cost |

## Run it

```bash
cp server-edge/config.example.php server-edge/config.php   # set API_BASE and TENANT_KEY
php -S 127.0.0.1:8080 -t .
```
Open <http://127.0.0.1:8080>. `/api/...` calls are forwarded upstream by the edge.

Each module is also independently runnable — see its own `README.md`.

## Contributing

Work in **your** module, commit under **your own** account with real dates, and open a pull request
to `main`. See `CONTRIBUTING.md` and `SETUP_FOR_TEAMMATES.md`.

**Never commit secrets.** This repository is public. Tenant keys and API credentials belong in
`server-edge/config.php`, which is git-ignored.
