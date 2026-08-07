# Sanchit Core Overview Module

## Project Vision & Problem Statement
- **Problem Statement:** Traditional learning platforms lack real-time adaptability, forcing a one-size-fits-all approach that fails to target individual student knowledge gaps or provide secure role-based isolation at scale.
- **Vision:** To build an adaptive, secure, AI-driven academic platform utilizing Retrieval-Augmented Generation (RAG) and Deep Knowledge Tracing (DKT) to dynamically tailor educational pathways.
- **Core Foundations:** The infrastructure relies on robust JWT authentication protocols, edge-level session rate-limiting, and strict client-backend role segregation to ensure secure, scalable telemetry and interaction processing.

## Rate Limiter Configuration
- **Window Size:** 60 seconds rolling window.
- **Threshold:** Max 60 requests per IP/token combination.
- **Response:** Exceeding the limit returns an HTTP `429 Too Many Requests` header and payload. Setting the limit parameter to `0` completely disables throttling for administrative testing.


