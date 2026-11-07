# GURUKUL AI — TUTOR HARDENING BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This baseline report documents the full-stack architecture of the GURUKUL AI Contextual AI Tutor, Next.js server proxy route, evidence provenance validation pipeline, and credential security controls prior to executing the Phase 1–11 tutor hardening pass.

---

## 2. Baseline Architecture Inspection Findings

1. **Frontend-to-Backend Proxy Pipeline**:
   `Student UI (app/tutor/page.tsx)` ➔ `Next.js API Proxy (app/api/tutor/chat/route.ts)` ➔ `FastAPI Backend (POST /api/v1/tutor/chat)` ➔ `Curriculum Identity & ProcessedContentResolver` ➔ `Ollama / Ollama Cloud (gemma4:31b)` ➔ `Student UI`.

2. **Secret Credential Hygiene**:
   - `frontend-nextjs/src/app/api/tutor/chat/route.ts`: Uses `process.env.OLLAMA_API_KEY`.
   - `backend/src/curriculum/api/tutor.py`: Uses `os.getenv("OLLAMA_API_KEY")`.
   - `reports/contextual_tutor/BASELINE_AUDIT.md`: Redacted secret key strings to `[REDACTED_SECRET_KEY]`.

3. **Curriculum Identity & Passage-Level Provenance**:
   - `backend/src/curriculum/api/tutor.py`: Requires explicit passage-level verification statuses (`VERIFIED_PASSAGE`, `FILE_EXISTS_PASSAGE_UNVERIFIED`, `UNVERIFIED`, `NO_EVIDENCE`).

---

## 3. Baseline Test Verification

- **Next.js Static & Dynamic Build**: 13/13 routes compiled 100% cleanly (`npm run build`).
- **Backend Test Automation Suite**: 151/151 tests passing (`pytest backend/tests/`).
