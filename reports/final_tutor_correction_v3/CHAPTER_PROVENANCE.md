# GURUKUL AI V3 — CHAPTER-SCOPED PROVENANCE REPORT
**Date**: November 3, 2026  

---

## 1. Chapter-Scoped Source Record Verification

- **Elimination of Whole-File Fallbacks**: Removed line 212 whole-file fallback in `backend/src/curriculum/api/tutor.py`.
- **Exact Chapter Isolation**: Parses source JSON (`07-Overview.json`), isolates the specific chapter record matching `chapter_id`, and verifies `norm_passage in norm_record_content` for that chapter record only.
- **Verification Statuses**:
  - `VERIFIED_PASSAGE`: Passage text verified inside isolated chapter record on disk.
  - `FILE_EXISTS_PASSAGE_UNVERIFIED`: Source file exists, but passage text match in chapter record failed.
  - `UNVERIFIED`: Source file does not exist.
  - `NO_EVIDENCE`: Score < 2.
