# GURUKUL AI — FRONTEND & BACKEND CONTRACT AUDIT
**Date**: November 3, 2026  

---

## 1. Proxy & API Contract Verification

- **Next.js API Proxy (`/api/tutor/chat/route.ts`)**: Accepts `{ question, grade, subject, chapter_id, engineMode }` payload; proxies server-side to Ollama Cloud when configured.
- **FastAPI Endpoint (`POST /api/v1/tutor/chat`)**: Authenticates via Firebase Admin token (`get_current_user`), enforces rate limits and grade context.
- **Zero Credential Exposure**: Response payloads return `response`, `mode`, `model`, `status`, `media` without leaking secret keys.
