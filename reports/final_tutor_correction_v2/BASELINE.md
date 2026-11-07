# GURUKUL AI — FINAL TUTOR CORRECTION V2 BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the current architecture, Next.js proxy identity parameter validation, chapter-scoped NCERT evidence provenance parsing, and Firebase token authentication controls prior to executing the Phase 1–8 final tutor correction v2 pass.

---

## 2. Identified Pipeline Gaps & Targeted Corrections

1. **Proxy Identity Parameter Defaults (`route.ts`)**:
   - **Gap**: `route.ts` contained silent fallbacks `book || subject`, `part || 'main'`, `unit || 'U01'`, `content_type || 'overview'`.
   - **Correction**: Removed all silent defaults. The Next.js API proxy and FastAPI endpoint enforce explicit, complete 7-dimension curriculum identity parameters (`grade`, `subject`, `book`, `part`, `unit`, `chapter_id`, `content_type`).

2. **Chapter-Scoped Source Provenance Parsing (`tutor.py`)**:
   - **Gap**: `retrieve_authoritative_ncert_evidence()` checked passage matching against the raw file globally, without parsing the JSON to isolate the exact chapter record matching `chapter_id`.
   - **Correction**: Rebuilt `retrieve_authoritative_ncert_evidence()` to parse the source JSON on disk, locate the specific chapter record matching `chapter_id`, extract text from that chapter record only, and verify normalized passage text inside that specific chapter record before assigning `VERIFIED_PASSAGE`.

---

## 3. Baseline Verification

- **Next.js Static & Dynamic Build**: 13/13 routes compiled 100% cleanly (`npm run build`).
- **Backend Test Automation Suite**: 151/151 test cases passing (`pytest backend/tests/`).
