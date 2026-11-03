# GURUKUL AI — TUTOR REMEDIATION BASELINE REPORT
**Date**: November 2, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  

---

## 1. Baseline Audit Summary

This baseline report documents the initial findings, execution pipeline, and identified defects in the Gurukul AI Contextual AI Tutor prior to the Phase 0–11 remediation pass.

---

## 2. Identified Pipeline Defects & Code Locations

1. **Defect 1: Misleading General Knowledge Fallback Header**:
   - **File**: `frontend-nextjs/src/lib/webLlmClient.ts`
   - **Root Cause**: When the offline fallback engine triggered for unmatched queries in `GENERAL_KNOWLEDGE` mode, it constructed a response string claiming:
     `"🤖 **GURUKUL AI Tutor (${payload.subject.toUpperCase()} - ${payload.chapter_id})**: In NCERT Class 5 ${payload.subject.toUpperCase()}..."`
   - **Impact**: Queries like *"what is photosynthesis?"* displayed `[ 🌐 GENERAL KNOWLEDGE ]` badge but claimed they were from `NCERT Class 5 ENGLISH (G5-ENG-U01-C01)`.

2. **Defect 2: Static Preset Cards**:
   - **File**: `frontend-nextjs/src/app/tutor/page.tsx`
   - **Root Cause**: Preset suggestion cards displayed static Science, Maths, and English queries regardless of selected subject.
   - **Impact**: Displayed Science Inquiry while English was selected.

---

## 3. Baseline Test Verification

- **Next.js Static Export Build**: 12/12 routes compiled cleanly.
- **Backend Test Automation Suite**: 151/151 tests passed (100% PASS).
