# Server Edge

The thin server-side component that ships with the product. It is a **forwarder**, not the application.

| It does | It does NOT |
|---|---|
| Receive requests from the UI | Contain business logic |
| Attach the tenant licence key | Hold any database |
| Forward to the licensed API | Perform retrieval, grounding, or generation |
| Return the response | Store or decrypt any secret |

## Setup
```bash
cp config.example.php config.php     # then fill in API_BASE and TENANT_KEY
```

## Run locally (with the UI)
```bash
php -S 127.0.0.1:8080 -t ..          # serves the UI and this edge together
```

## Why this alone is not the product
Every meaningful operation — authentication, courses, study material, the AI assistant,
quizzes, assessments, grading, analytics — is executed by the upstream API. If the licence
is revoked or the upstream service is unavailable, this edge returns an error and the UI has
nothing to display. See `../ARCHITECTURE.md`.
