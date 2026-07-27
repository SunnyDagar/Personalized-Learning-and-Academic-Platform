# System architecture

```
Client UI (Angular)  →  gw.php (encrypted, on client host)  →  /api (owner)  →  MySQL + Gemini
```
- Opaque per-tenant gateway with op-codes; per-tenant licensing + activation kill-switch.
- Secrets AES-256-GCM encrypted in DB; JWT auth; strict course-scope RAG gate.
