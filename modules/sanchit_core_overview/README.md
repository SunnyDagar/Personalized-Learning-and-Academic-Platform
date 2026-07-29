# Core Overview & API Bootstrap — Sanchit Chhabra (Slides 1–5)

Vision, problem statement, and the foundational API bootstrap.

- **Problem:** generic study resources, no visibility into weak topics, slow feedback, limited
  instructor communication.
- **Vision:** one institutional platform — grounded AI tutoring for students + real analytics for staff.
- **Core foundation:** a PHP REST API front controller with a licence/activation gate (SaaS kill-switch).

Configuration for the shipped half lives in `../../server-edge/config.example.php`. Server-side
configuration (database, AI credentials, activation) is not part of this repository.

### Front-end
| File | What it does |
|---|---|
| `ui/auth.guard.ts` | Route guard for the student/professor portals — checks session token and role before entry |

Angular 17 standalone component — drop into the client app under `client/src/app/`.
