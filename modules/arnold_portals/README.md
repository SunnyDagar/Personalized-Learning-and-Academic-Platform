# Student & Professor Portals — Arnold Babu (Slides 10–12)

The Angular client: student portal (AI assistant, study material, practice quizzes, flashcards, progress,
appointments) and professor portal (materials, AI test generation, class analytics, grading).

Production source lives in the client app; `portal_endpoints.md` documents the API each portal calls,
and `flashcard_engine.ts` is a starter for the interactive flashcard logic.

### Front-end
| File | What it does |
|---|---|
| `ui/mastery-card.component.ts` | Per-topic mastery bar used on the student dashboard and reused in the professor's class view |

Angular 17 standalone component — drop into the client app under `client/src/app/`.

### Mastery Color Thresholds & Alignment

The `MasteryCardComponent` utilizes standardized visual status signals across both student and professor views:

* **Needs Attention (`< 60%`):** `#d03b3b` (Red) — Highlights topics requiring immediate remediation.
* **Improving (`60% - 79%`):** `#ec835a` (Orange) — Signals progressing mastery needing targeted practice.
* **On Track (`80% - 100%`):** `#0ca30c` (Green) — Indicates solid mastery.

**Professor Alignment:** Using identical thresholds across both portals guarantees that students and instructors see the exact same performance indicators, eliminating ambiguity during office hours and review sessions.