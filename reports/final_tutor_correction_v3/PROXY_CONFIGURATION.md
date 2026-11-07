# GURUKUL AI V3 — PROXY CONFIGURATION REPORT
**Date**: November 3, 2026  

---

## 1. Environment-Configured Proxy URL

- **URL Configuration**: `FASTAPI_TUTOR_URL = process.env.FASTAPI_TUTOR_URL || 'http://127.0.0.1:8001/api/v1/tutor/chat'`.
- **Single Request Pipeline**: Student UI ➔ Next.js Proxy (`/api/tutor/chat`) ➔ FastAPI Backend (`FASTAPI_TUTOR_URL`) ➔ Ollama / Ollama Cloud ➔ Student UI.
- **503 Handling**: Returns `503 Service Unavailable` when FastAPI backend is offline.
