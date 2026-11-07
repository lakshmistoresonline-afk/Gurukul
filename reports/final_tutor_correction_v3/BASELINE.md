# GURUKUL AI — FINAL TUTOR CORRECTION V3 BASELINE REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This baseline report documents the current status, source file differences, and specific technical corrections required in `app/tutor/page.tsx`, `route.ts`, and `tutor.py` for the V3 remediation pass.

---

## 2. Identified V3 Pipeline Repairs Required

1. **Fix Tutor UI Selected Book & Unit Resolution (`app/tutor/page.tsx`)**:
   - **Defect**: `app/tutor/page.tsx` used `books[0]` and `units[0]` instead of allowing the user to select the active book, part, and unit explicitly.
   - **Correction**: Rebuilt selection state in `app/tutor/page.tsx` so that all 7 dimensions (`grade`, `subject`, `book`, `part`, `unit`, `chapter_id`, `content_type`) are derived directly from the active curriculum manifest.

2. **Remove Whole-File Fallback in Provenance Validation (`tutor.py`)**:
   - **Defect**: Line 212 in `tutor.py` contained `if not chapter_record_text: chapter_record_text = json.dumps(src_json, ensure_ascii=False)`. If the chapter record was missing, it searched the entire file as a fallback.
   - **Correction**: Removed the whole-file fallback completely. `VERIFIED_PASSAGE` is assigned ONLY when the exact chapter record matching `chapter_id` is found in the JSON document and the passage is matched inside that isolated record.

3. **Strict 7-Dimension Identity Validation in Proxy (`route.ts`)**:
   - **Defect**: Next.js proxy `/api/tutor/chat` requires all 7 identity dimensions (`grade`, `subject`, `book`, `part`, `unit`, `chapter_id`, `content_type`) without any silent defaults, returning `400 Bad Request` if any parameter is missing or empty.
