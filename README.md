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
| Sanchit Chhabra (`chhabra0521`) | `modules/sanchit_core_overview` | Slides 1–5 | App shell, routing, auth screens | API bootstrap, JWT verification, health |
| Surender “Sunny” Dagar (`SunnyDagar`) | `modules/sunny_data_pipeline` | Slides 6–9 | Assistant chat surface, source display | Ingestion, embeddings, retrieval, grounding gate |
| Arnold Babu (`ArnoldBabu`) | `modules/arnold_portals` | Slides 10–12 | Student & instructor portals, dashboards, flashcards | Portal endpoint contracts |
| Félicité Gamgne Domgue (`Felicite-gamgne`) | `modules/felicity_architecture` | Slides 13–16 | Analytics visualisations | Architecture, deployment, SLI/SLO monitoring |
| Hafsa Shabbeer (`hafsashabbeer`) | `modules/hafsa_business_engine` | Slides 17+ | Licensing / branding configuration surface | Business model, unit economics, risk & cost |

## Run it

```bash
php -S 127.0.0.1:8080 -t .
```
Open <http://127.0.0.1:8080>. No configuration needed — a time-limited evaluation licence is
included in `server-edge/config.example.php`. `/api/...` calls are forwarded upstream by the edge
to the hosted service, which holds the data, the AI and the keys.

**The licence expires on 30 September 2026**, and is revocable before then. After that this
software no longer functions: the server declines every request, and nothing in this repository
can replace the half that is missing. That is the product model, not a limitation of the demo.

Run the tests (no licence, no network, no dependencies):
```bash
cd modules/sunny_data_pipeline/evaluation && python3 -m unittest discover -p 'test_*.py'
```

Each module is also independently runnable — see its own `README.md`.

## Team

The five official contributors are listed in `CONTRIBUTORS.md`.

## Contributing

Work in **your** module, commit under **your own** account with real dates, and open a pull request
to `main`. See `CONTRIBUTING.md` and `SETUP_FOR_TEAMMATES.md`.

**Never commit secrets.** This repository is public. Tenant keys and API credentials belong in
`server-edge/config.php`, which is git-ignored.

## Licence

Proprietary — evaluation and coursework use only. See `LICENSE` and `TERMS_OF_USE.md`.
The server-side components are not included and not licensed. Access to the hosted service is
per-tenant and revocable.

<!-- maintained by the Group 1 team -->
