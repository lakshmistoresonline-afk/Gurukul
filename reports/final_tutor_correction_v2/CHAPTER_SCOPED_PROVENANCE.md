# GURUKUL AI — CHAPTER-SCOPED PROVENANCE VERIFICATION
**Date**: November 3, 2026  

---

## 1. Chapter-Scoped Provenance Parsing (`tutor.py`)

- **JSON Record Isolation**: Parses the raw source JSON file on disk (`07-Overview.json`), locates the specific chapter record matching `chapter_id`, and extracts text from that chapter record only.
- **Normalized Passage Comparison**: Normalizes whitespace and verifies `norm_passage in norm_chapter_record_content` before assigning `VERIFIED_PASSAGE`.
- **Status Assignment**:
  - `VERIFIED_PASSAGE`: File exists AND passage text is verified inside the isolated chapter record on disk.
  - `FILE_EXISTS_PASSAGE_UNVERIFIED`: Source file exists, but passage text match in chapter record failed.
  - `UNVERIFIED`: Source file does not exist on disk.
  - `NO_EVIDENCE`: Token overlap score < 2.
