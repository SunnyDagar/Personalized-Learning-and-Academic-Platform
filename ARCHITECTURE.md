# Architecture — what is in this repository, and what is not

This product is delivered as **Software as a Service**. The repository contains the half a
customer receives; the half that makes it work stays on the provider's server.

```
   ┌──────────────────────── IN THIS REPOSITORY ────────────────────────┐
   │                                                                    │
   │   client/          Angular UI — the entire user experience         │
   │   server-edge/     a thin forwarder the customer hosts             │
   │   modules/         per-member engineering work                     │
   │                                                                    │
   └────────────────────────────┬───────────────────────────────────────┘
                                │  HTTPS + tenant licence key
                                ▼
   ┌──────────────────── ON THE PROVIDER'S SERVER ──────────────────────┐
   │                        (never distributed)                         │
   │                                                                    │
   │   REST API           32 route handlers — all business logic        │
   │   MySQL              19 tables — every user, course, result        │
   │   AI engine          retrieval, grounding gate, generation         │
   │   Secrets            AI keys, encryption keys, DB credentials      │
   │   Control plane      tenant licensing, activation, kill-switch     │
   │                                                                    │
   └────────────────────────────────────────────────────────────────────┘
```

## What ships here

| Component | Role |
|---|---|
| `client/` | The Angular single-page application — every screen the student and instructor use. It renders data; it does not produce it. |
| `server-edge/` | A forwarder the customer hosts. It attaches the tenant licence key and passes requests upstream. No logic, no data, no keys. |
| `modules/` | Each team member's engineering work, documentation, and runnable reference implementations. |

## What never ships

| Component | Why it stays |
|---|---|
| REST API (32 handlers) | This *is* the application — authentication, courses, materials, chat, quizzes, assessments, grading, analytics. |
| MySQL database (19 tables) | All customer and academic data, plus the document embeddings that make retrieval work. |
| Retrieval & grounding engine | Chunking, embedding, similarity search, and the scope gate that keeps the assistant on-syllabus. |
| Generation integration + keys | The AI provider key is encrypted at rest and used only server-side. |
| Tenant control plane | Licence issuance, activation state, and the switch that disables a deployment instantly. |

## The two properties this design guarantees

**1. The complete code is never in anyone's hands.**
Cloning this repository — every branch, every module, every file — yields the interface and a
forwarder. It does not yield the API, the database, the retrieval engine, or the keys. Those
exist only on the provider's infrastructure and are not reproducible from anything published here.

**2. The published code still runs.**
Because the missing half is reachable over HTTPS, the UI and edge together form a working
application. Sign in, browse course material, ask the assistant a question, generate a quiz,
view analytics — all of it functions, because the server answers. The software is usable
without being ownable.

## Consequence

Revoking a tenant licence, or taking the API offline, leaves the customer holding a UI with
nothing behind it: requests return an error and no screen can populate. Continued operation
depends on the service, which is precisely what the licence pays for.

## Running it

```bash
cp server-edge/config.example.php server-edge/config.php   # set API_BASE and TENANT_KEY
php -S 127.0.0.1:8080 -t .                                 # serve UI + edge together
```
Then open <http://127.0.0.1:8080>. Requests to `/api/...` are forwarded upstream by the edge.
The live reference deployment is <https://dagarretail.com>.
