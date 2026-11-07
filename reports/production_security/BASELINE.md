# GURUKUL AI — PRODUCTION SECURITY BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline audit evaluates security, credential hygiene, Ollama model orchestration, NCERT evidence provenance, and API contracts for the GURUKUL AI platform prior to executing the Phase 1–10 security remediation pass.

---

## 2. Identified Security & Credential Exposure Findings

1. **Secret Exposure in Tracked Files**:
   - **Finding**: An Ollama Cloud API Key literal was hardcoded in `frontend-nextjs/src/app/api/tutor/chat/route.ts`, `frontend-nextjs/src/lib/webLlmClient.ts`, and `backend/src/curriculum/api/tutor.py`.
   - **Risk**: Hardcoded credentials in source files or API proxies pose a high risk of unauthorized usage if exposed publicly.
   - **Remediation Action**: Replaced all hardcoded API key strings with `process.env.OLLAMA_API_KEY` (frontend) and `os.getenv("OLLAMA_API_KEY")` (backend), falling back gracefully to unauthenticated local Ollama / RAG mode when `OLLAMA_API_KEY` is not set.

2. **Git Commit History Secret Exposure**:
   - **Finding**: Commit `173f2c696` and commit `df17fcb69` contained literal API key strings in file additions.
   - **Remediation Plan**: Require user confirmation to revoke/rotate the API key with Ollama Cloud provider.

---

## 3. Baseline Verification

- **Next.js Production Build**: 13/13 static & dynamic routes compile cleanly (`npm run build`).
- **Backend Pytest Suite**: 151/151 test cases passing (`pytest backend/tests/`).
- **Curriculum Integrity**: 416 chapters across Class 5, 6, and 7 verified in `ProcessedContent/`.
