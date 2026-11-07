# GURUKUL AI V4 — UNAMBIGUOUS CHAPTER PROVENANCE REPORT
**Date**: November 3, 2026  

---

## 1. Chapter-Scoped Source Record Matching

- **Unambiguous Chapter ID Match**: In `retrieve_authoritative_ncert_evidence()` (`tutor.py`), exact chapter records are located using ONLY non-empty canonical `chapter_id` matching `ch_id.lower()`. Removed ambiguous matching by `chapter_number` alone.
- **No Whole-File Fallback**: `chapter_record_text` remains empty if the chapter ID is not found in `items`.
- **Passage-Level Verification**: Performs normalized string comparison (`norm_passage in norm_record_content`) inside the isolated chapter record before assigning `VERIFIED_PASSAGE`.
