# GURUKUL AI — AUTHORITATIVE TUTOR PIPELINE SPECIFICATION
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
FastAPI Authoritative Tutor Endpoint (POST /api/v1/tutor/chat)
    │
    ▼
Firebase Admin Authentication Verification (get_current_user)
    │
    ▼
7-Dimension Curriculum Identity Validation (CurriculumIdentity)
    │
    ▼
NCERT Evidence Retrieval & Raw Passage Provenance Verification
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
