# Core Overview & API Bootstrap — Sanchit Chhabra (Slides 1–5)

Vision, problem statement, and the foundational API bootstrap.

- **Problem:** generic study resources, no visibility into weak topics, slow feedback, limited
  instructor communication.
- **Vision:** one institutional platform — grounded AI tutoring for students + real analytics for staff.
- **Core foundation:** a PHP REST API front controller with a licence/activation gate (SaaS kill-switch).

`config.example.php` is a safe template — real secrets live in `.env` on the server (git-ignored).
