# GURUKUL AI — DEFECTS FOUND & REMEDIATION LOG
**Date**: November 3, 2026  

---

## 1. Identified Defects & Remediation Log

1. **Mock Token Fallback in Next.js Proxy (`route.ts`)**:
   - **Defect**: Proxy substituted `'Bearer mock-token-user-a'` when incoming request header was missing.
   - **Remediation**: Removed mock token fallback. Unauthenticated requests are rejected with `401 Unauthorized`.

2. **Next.js Direct Generation Bypass (`route.ts`)**:
   - **Defect**: Next.js proxy attempted direct Ollama Cloud generation instead of forwarding requests to FastAPI backend.
   - **Remediation**: Rebuilt `route.ts` as a pure proxy forwarding requests directly to FastAPI (`FASTAPI_TUTOR_URL`).

3. **Passage-Level Provenance Match (`tutor.py`)**:
   - **Defect**: Evidence retrieval checked `summary in full_passage` where `full_passage` was constructed from `summary`.
   - **Remediation**: Opened the raw source file on disk (`07-Overview.json`) and verified `normalized_passage in normalized_file_content` before assigning `VERIFIED_PASSAGE`.
