# GURUKUL AI — AUTHORITATIVE TUTOR REQUEST PIPELINE
**Date**: November 3, 2026  

---

## 1. Request Pipeline Architecture

```
Student UI (app/tutor/page.tsx)
    │
    ▼
Next.js Server API Proxy (/api/tutor/chat/route.ts)
    │
    ▼
FastAPI Authoritative Tutor Endpoint (POST /api/v1/tutor/chat)
    │
    ▼
Firebase Admin Authentication Verification (get_current_user)
    │
    ▼
7-Dimension Identity & ProcessedContentResolver Validation
    │
    ▼
NCERT Evidence Retrieval & Passage-Level Provenance Scoring
    │
    ▼
Ollama / Ollama Cloud (gemma4:31b) AI Generation
    │
    ▼
Response Metadata Serialization & Media Guard
    │
    ▼
Student UI
```

---

## 2. Key Safeguards

- **Zero Proxy Generation Bypass**: Next.js proxy `/api/tutor/chat` forwards all queries directly to FastAPI `POST /api/v1/tutor/chat`.
- **Server-Side Fallback**: If FastAPI backend is unreachable, Next.js server proxy invokes Ollama Cloud server-side (`gemma4:31b`) without browser CORS errors.
- **Media Relevance Guard**: Images and studio videos are attached ONLY when mode is `NCERT_CHAPTER` and topic matches.
