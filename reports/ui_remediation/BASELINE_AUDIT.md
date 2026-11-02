# GURUKUL AI — BASELINE AUDIT REPORT
**Date**: November 2, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `499389ba5acac1e3d3dd0a270243b31d257ead38`  

---

## 1. Executive Summary

This baseline audit evaluates the UI, state architecture, and curriculum data contracts for the Gurukul AI learning platform prior to executing the Phase 3 UI Interactivity & Remediations pass.

---

## 2. Identified Defect Catalog & Code References

### Defect 1: Hardcoded Class Selection & Unsynchronized Learner State
- **Impact**: The dashboard banner previously defaulted to `Class 5` when `selectedGrade` was set to Class 6 or Class 7 in `StudentNavigation.tsx`.
- **Root Cause**: `frontend-nextjs/src/app/page.tsx` read `getStudentProgress('guest')` unconditionally instead of passing the authenticated `currentUser?.uid`.
- **Code File**: `frontend-nextjs/src/app/page.tsx` & `frontend-nextjs/src/components/StudentNavigation.tsx`.

### Defect 2: Flashcard Review Event Idempotency & Stale Fetch Protection
- **Impact**: Clicking/flipping a flashcard triggered duplicate event ledger writes.
- **Root Cause**: `recordFlashcardReviewEvent` was triggered on every card flip without an event idempotency key or request sequence token.
- **Code File**: `frontend-nextjs/src/app/page.tsx` & `frontend-nextjs/src/lib/studentProgressStore.ts`.

### Defect 3: Subject Explorer Fallback Metadata
- **Impact**: SubjectExplorer was manually instantiating `defaultSubjects` with hardcoded chapter titles.
- **Root Cause**: Unhandled fallback arrays in `app/subjects/page.tsx`.
- **Code File**: `frontend-nextjs/src/app/subjects/page.tsx`.

---

## 3. Pre-Remediation Verification Baseline

- **Next.js Static Export**: Clean compile across all 12 routes.
- **Backend Pytest Suite**: 151 / 151 test cases passing (100% PASS).
- **Source Files Integrity**: 100% of original PDFs, images, videos, CSVs, and Class 6/7 files preserved in `D:\GURUKUL\Contents`.
