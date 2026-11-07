# GURUKUL AI V5 — PROXY CONFIGURATION REPORT
**Date**: November 3, 2026  

---

## 1. Environment-Configured Proxy URL

- **URL Configuration**:
  - Development: `http://127.0.0.1:8001/api/v1/tutor/chat`
  - Production (`NODE_ENV === 'production'`): Requires `FASTAPI_TUTOR_URL` environment variable; returns `500 Server Configuration Error` if unconfigured.
- **Pure Forwarding Proxy**: Student UI ➔ Next.js Proxy (`/api/tutor/chat`) ➔ FastAPI Backend (`FASTAPI_TUTOR_URL`).
- **503 Handling**: Returns `503 Service Unavailable` when FastAPI backend is offline.
