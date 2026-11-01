# GURUKUL AI — SEVENTH-PASS CURRICULUM GROUNDING TEST RESULTS REPORT

**Date**: November 1, 2026  
**Git Branch**: `feature/gurukul-production-remediation`  
**HEAD Commit SHA**: `92d879cf1`  

---

## Executed Test Suites & Verification Results

1. **Next.js Production Export Build**:
   - Command: `npm run build --prefix frontend-nextjs`
   - Result: **PASS** (`✓ Generating static pages (12/12)`)
   - Routes compiled: `/`, `/_not-found`, `/achievements`, `/curriculum`, `/discovery`, `/journey`, `/library`, `/practice`, `/subjects`, `/tutor`.

2. **Backend Automated Pytest Suite**:
   - Command: `python -m pytest backend/tests/ -v`
   - Result: **PASS** (149/149 test cases passed 100% in 4m 45s).

3. **AI Tutor Cross-Subject Regression Test Suite**:
   - Command: `python -m pytest backend/tests/test_tutor_comprehensive_audit.py -v`
   - Result: **PASS** (10/10 test cases passed 100%).

4. **Photosynthesis Cross-Subject Resolution Scenario**:
   - Active Selection: English (`G5-ENG-U01-C01 — Papa's Spectacles`)
   - Question: *"Explain photosynthesis?"*
   - Result: **PASS** (`mode: "NCERT_CROSS_SUBJECT"`, `resolved_subject: "science"`, `resolved_chapter_id: "G5-SCI-U01-C01"`). Zero attribution or reference to Papa's Spectacles or English.

5. **Protected Content & Immutability**:
   - 100% of original source PDFs, images, videos, CSVs, and Class 6/7 content remain unchanged and fully preserved.
