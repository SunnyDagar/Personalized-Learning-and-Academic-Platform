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
