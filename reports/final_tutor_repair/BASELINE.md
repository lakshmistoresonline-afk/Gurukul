# GURUKUL AI — FINAL TUTOR REPAIR BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the current architecture, Next.js server proxy implementation, FastAPI backend tutor pipeline, and passage-level evidence provenance controls before executing the Phase 1–11 final tutor repair pass.

---

## 2. Identified Pipeline Defects & Architectural Gaps

1. **Next.js Proxy Bypass**:
   - **Finding**: `frontend-nextjs/src/app/api/tutor/chat/route.ts` queried Ollama Cloud directly instead of forwarding requests to the FastAPI backend (`POST /api/v1/tutor/chat`).
   - **Remediation**: Rebuilt `route.ts` to act as an authoritative proxy forwarding requests directly to FastAPI (`http://127.0.0.1:8001/api/v1/tutor/chat`) with `Authorization: Bearer <token>` propagation. FastAPI handles local Ollama, Ollama Cloud, and dynamic RAG fallback server-side cleanly.

2. **NCERT Passage-Level Provenance**:
   - **Finding**: File existence was checked, but exact passage text was not normalized or verified against the raw source file on disk.
   - **Remediation**: Implemented normalized string comparison (`normalized_passage in normalized_source`) in `backend/src/curriculum/api/tutor.py` before assigning `VERIFIED_PASSAGE` status.

---

## 3. Baseline Verification

- **Next.js Static & Dynamic Build**: 13/13 routes compiled cleanly (`npm run build`).
- **Backend Test Automation Suite**: 151/151 tests passing (`pytest backend/tests/`).
