# Business Model Canvas — Personalized Learning & Academic Support Platform

Owner: **Hafsa Shabbeer** (slides 17 → end). Supports the calculators in this module
(`unit_economics.py`, `pricing_tiers.py`, `risk_cost.py`) and Section 1.4 of the final report.

**Primary client: INSTITUTIONS** (per-tenant SaaS licence) — the decision made in response to
Prof. Gaertner's "who is your client?" question. Not a student freemium product.

| Block | Our design |
|---|---|
| **Customer segments** | Post-secondary institutions — departments, faculties, whole campuses. End-users are their students and instructors. |
| **Value proposition** | A course-grounded AI tutor **plus** instructor analytics in one governed service the LMS does not provide. The institution keeps its data; the AI never answers outside approved material. |
| **Channels** | Direct institutional sales, departmental pilots, and integration with the existing LMS. |
| **Customer relationships** | Licensed service with onboarding, support, and a per-tenant control plane administrators manage. |
| **Revenue streams** | Annual per-tenant licensing (Department / Campus / Enterprise) + paid add-ons (advanced analytics, AI assessment suite, priority support). |
| **Key resources** | The retrieval/grounding engine, the encrypted API + database, and the AI keys — all retained by us. |
| **Key activities** | Running the API + retrieval pipeline, model/provider management, tenant onboarding, support. |
| **Key partners** | Cloud/hosting providers, the LLM provider (Google), and the institutions themselves. |
| **Cost structure** | AI inference + embeddings, hosting/infrastructure, support. Scales roughly linearly per tenant. |

## Numbers at a glance
| Metric | Value | Source |
|---|---|---|
| Department licence | $12,000 / yr (500 seats → $24/seat) | `pricing_tiers.py` |
| Campus licence | $45,000 / yr (5,000 seats → $9/seat) | `pricing_tiers.py` |
| Enterprise licence | $90,000 / yr (20,000 seats → $4.50/seat) | `pricing_tiers.py` |
| Operating cost | ≈ $250 / tenant / month | `risk_cost.py` |
| Gross margin | ≈ 80% | `unit_economics.py` |
| Break-even | ≈ 7 institutions | `risk_cost.py` |

## Competitive position
| Category | Example | Gap we fill |
|---|---|---|
| LMS platforms | Canvas, Brightspace, Moodle | Store content and grades; little native course-grounded tutoring. We integrate, not compete. |
| Consumer AI tutors | Khanmigo, Duolingo Max | General-purpose; not tied to a specific instructor's material. |
| General assistants | ChatGPT | Will answer anything — including off-syllabus and incorrect content. |

**Our differentiator:** strictly course-scoped grounding (the assistant *refuses* what the professor
didn't upload) + instructor analytics + institution-first delivery with per-tenant licensing and a kill-switch.

## Risks (professor's "colour factors") → mitigations
| Risk | Mitigation |
|---|---|
| LMS overlap | Position as the AI + analytics layer the LMS lacks; LMS/LTI integration on the roadmap. |
| Faculty resistance to AI grading | Human-in-the-loop — AI drafts, the professor approves every mark. |
| Privacy / PII | Consent at sign-up and upload; per-course access control; SOC 2 on the roadmap. |
| High data requirement | MVP retrieves over each course's own material — no large-scale student-data training needed. |
| IP / copyright | Copyright-consent checkbox required before any upload. |

> If any assumption here changes, update Section 1.4/1.8 of
> `capstone_project/Final Report AIDI CAPSTONE II Summer 2026.html` so the report and code agree.
