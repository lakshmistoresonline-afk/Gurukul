# GURUKUL AI V5 — CHAPTER PROVENANCE REPORT
**Date**: November 3, 2026  

---

## 1. Unambiguous Chapter Record Matching

- **Chapter Record Isolation**: `retrieve_authoritative_ncert_evidence` parses source JSON (`07-Overview.json`), isolates the specific chapter record matching `str(item.get('chapter_id')).strip().lower() == ch_id.lower()`, and extracts text from that chapter record only.
- **Removed Ambiguous Matching**: Removed matching by `chapter_number` alone. Removed whole-file fallback.
- **Statuses**: `VERIFIED_PASSAGE`, `FILE_EXISTS_PASSAGE_UNVERIFIED`, `UNVERIFIED`, `NO_EVIDENCE`.
