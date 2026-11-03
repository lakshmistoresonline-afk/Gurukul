# GURUKUL AI — CONTEXTUAL TUTOR BASELINE AUDIT REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `173f2c696151c3331a30f64ed43bedbee23c72b3`  

---

## 1. Executive Summary

This baseline audit evaluates the architecture, evidence retrieval pipeline, curriculum identity resolution, and model orchestration for the GURUKUL AI Contextual AI Tutor before executing the Phase 1–11 contextual tutor remediation pass.

---

## 2. Identified Pipeline Defects & Audit Findings

### Defect 1: Grade Mismatch in Tutor Header & Message Attribution
- **Impact**: When Class 6 or Class 7 was active, AI Tutor messages in `app/tutor/page.tsx` occasionally passed hardcoded `grade: '5'` in client request payloads or system prompts.
- **Root Cause**: `frontend-nextjs/src/app/tutor/page.tsx` had residual `grade: '5'` literals in chat history objects.
- **Code Reference**: `frontend-nextjs/src/app/tutor/page.tsx`.

### Defect 2: Evidence Provenance Status Validation
- **Impact**: Evidence contract returned `VERIFIED_SOURCE_PROVENANCE` status before explicitly validating source file existence.
- **Root Cause**: `backend/src/curriculum/api/tutor.py` assigned static `VERIFIED_SOURCE_PROVENANCE` string inside `retrieve_authoritative_ncert_evidence()`.
- **Code Reference**: `backend/src/curriculum/api/tutor.py`.

### Defect 3: Browser CORS Isolation for Ollama Cloud
- **Impact**: Direct browser `fetch('https://ollama.com/api/chat')` from client-side JavaScript was blocked by browser CORS policy when FastAPI backend was offline.
- **Root Cause**: Missing server-side proxy route.
- **Remediation Implemented**: Created Next.js server-side proxy route `/api/tutor/chat` which executes server-side in Node.js without CORS restrictions.
- **Code Reference**: `frontend-nextjs/src/app/api/tutor/chat/route.ts`.

---

## 3. Baseline Verification

- **Next.js Static & Dynamic Build**: 13/13 routes compiled 100% cleanly (`npm run build`).
- **Backend Test Automation Suite**: 151/151 tests passing (`python -m pytest backend/tests/ -v`).
- **Ollama Cloud API Integration**: Tested and operational with model `gemma4:31b` (API Key: `802c7f9425034b1eb58956545b8a74b1.ubyNZxMXhcyz-y8BcRXilLos`).
