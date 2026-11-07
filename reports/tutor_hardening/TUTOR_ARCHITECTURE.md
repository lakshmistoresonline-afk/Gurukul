# GURUKUL AI — AUTHORITATIVE TUTOR PIPELINE ARCHITECTURE
**Date**: November 3, 2026  

---

## 1. Single Authoritative Request-Response Pipeline

```
Student UI (app/tutor/page.tsx)
    │
    ▼
Next.js Server API Proxy (/api/tutor/chat/route.ts)
    │
    ▼
FastAPI Tutor Endpoint (POST /api/v1/tutor/chat)
    │
    ▼
Curriculum Identity & ProcessedContentResolver
    │
    ▼
Authoritative NCERT Evidence Retrieval (retrieve_authoritative_ncert_evidence)
    │
    ▼
Ollama / Ollama Cloud (gemma4:31b) AI Generation
    │
    ▼
Response Validation & Media Attachment Guard
    │
    ▼
Student UI Message List
```

---

## 2. Pipeline Controls & Safeguards

- **Strict Validation**: Rejects invalid grade numbers or missing identity parameters before querying LLM.
- **Race Protection**: Client utilizes request tokens (`reqIdRef`) to discard out-of-order responses.
- **Media Relevance Guard**: Diagrams and videos attached ONLY when mode is `NCERT_CHAPTER` and topic matches.
