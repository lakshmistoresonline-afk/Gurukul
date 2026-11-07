# GURUKUL AI — PROXY & BACKEND CONFIGURATION
**Date**: November 3, 2026  

---

## 1. Environment-Configured Proxy URL

- **URL Configuration**: `FASTAPI_TUTOR_URL = process.env.FASTAPI_TUTOR_URL || 'http://127.0.0.1:8001/api/v1/tutor/chat'`.
- **Single Request Flow**: Student UI ➔ Next.js Proxy (`/api/tutor/chat`) ➔ FastAPI Backend (`FASTAPI_TUTOR_URL`) ➔ Ollama / Ollama Cloud ➔ Student UI.
- **Controlled Failure**: Returns `503 Service Unavailable` when FastAPI backend is unreachable.
