# GURUKUL AI — FINAL TUTOR CORRECTION BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline audit documents the initial findings, request pipelines, and specific code locations requiring correction across authentication token propagation, Next.js proxy design, passage-level NCERT provenance validation, and curriculum identity resolution.

---

## 2. Identified Code Defects & Corrections Needed

1. **Mock Authentication Fallback in Proxy (`frontend-nextjs/src/app/api/tutor/chat/route.ts`)**:
   - **Finding**: Line 38 previously defaulted to `'Bearer mock-token-user-a'` when `authorization` header was missing.
   - **Correction**: Removed all mock token fallbacks. Requests without valid `Authorization` header are rejected with `401 Unauthorized`.

2. **Next.js Proxy Generation Bypass (`frontend-nextjs/src/app/api/tutor/chat/route.ts`)**:
   - **Finding**: The proxy attempted direct Ollama Cloud generation instead of strictly forwarding requests through the FastAPI backend (`POST /api/v1/tutor/chat`).
   - **Correction**: Rebuilt `route.ts` as a pure authoritative proxy forwarding all tutor requests to FastAPI. All model orchestration and evidence verification occurs in FastAPI.

3. **Passage-Level Provenance Match Verification (`backend/src/curriculum/api/tutor.py`)**:
   - **Finding**: Evidence retrieval checked `summary in full_passage` where `full_passage` was constructed from `summary`.
   - **Correction**: Reads the actual raw source file on disk (`07-Overview.json`) and performs normalized string matching against raw file content on disk before assigning `VERIFIED_PASSAGE` status.
