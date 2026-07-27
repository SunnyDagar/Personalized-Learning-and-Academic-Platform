# Personalized Learning & Academic Support Platform

AIDI Capstone II — Group 1. An **institutional SaaS** learning platform: a thin client UI backed by
our own API, database, and AI. Live demo: https://dagarretail.com

**Real stack:** Angular 17 (client) · PHP 8.3 REST API · MySQL · Google Gemini
(`gemini-2.5-flash` + `gemini-embedding-001`) · retrieval via PHP cosine similarity.
Program: *AI Analysis, Design & Implementation*.

## Repository layout
Work is split into one module per team member (mapped to the presentation sections):

| Module | Owner | Slides | Focus |
|---|---|---|---|
| `modules/sanchit_core_overview` | Sanchit Chhabra | 1–5 | Vision, problem, core foundations, API bootstrap |
| `modules/sunny_data_pipeline`  | Sunny (Surender) Dagar | 6–9 | Ingestion, embeddings, RAG data pipeline |
| `modules/arnold_portals`       | Arnold Babu | 10–12 | Student/Professor portals, flashcards/tests, dashboards |
| `modules/felicity_architecture`| Félicité Domgue | 13–16 | Architecture, DB/infra, observability (SLI/SLO) |
| `modules/hafsa_business_engine`| Hafsa Shabbeer | 17+ | Business model, unit economics, financial forecast |

## How to contribute (honest, real commits)
Each member works in **their own module** and commits **their own real work** under **their own GitHub
account** (see `CONTRIBUTING.md`). No shared logins, no backdated history — the contribution graph
reflects what actually happened.

> Secrets (`.env`, API keys, the SaaS gateway source) live only on the server and are git-ignored here.
