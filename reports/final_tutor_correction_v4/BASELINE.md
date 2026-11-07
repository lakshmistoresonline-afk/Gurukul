# GURUKUL AI V4 — BASELINE INSPECTION REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This baseline report records the starting source state and specific code updates required for the V4 master remediation pass across UI identity resolution, unambiguous chapter-scoped provenance matching, local Ollama-only inference architecture, and Firebase authentication.

---

## 2. Identified V4 Pipeline Improvements

1. **Strict UI Identity Resolution (`app/tutor/page.tsx`)**:
   - **Correction**: Removed all fallback defaults (`activeBook = activeSubj`, `part = 'main'`, `unit = 'U01'`). The UI resolves exact `book_id`, `part`, `unit`, `chapter_id`, and `content_type` directly from the selected chapter record in the hierarchy before sending requests. If the chapter record is missing, the request is stopped and a user error is displayed.

2. **Unambiguous Chapter-Scoped Provenance (`tutor.py`)**:
   - **Correction**: Removed matching by `chapter_number` alone. In `retrieve_authoritative_ncert_evidence()`, exact chapter records are located using ONLY non-empty canonical `chapter_id` strings matching `ch_id.lower()`. Whole-file fallbacks and ambiguous matches are strictly prohibited.

3. **Local Ollama Only Configuration**:
   - **Correction**: Removed Ollama Cloud fallback from `tutor.py` and `route.ts`. Content generation and tutor chat utilize local Ollama (`http://127.0.0.1:11434`) or dynamic RAG evidence fallback exclusively.
