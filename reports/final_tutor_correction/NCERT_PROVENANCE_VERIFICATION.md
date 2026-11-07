# GURUKUL AI — NCERT PASSAGE-LEVEL PROVENANCE VERIFICATION
**Date**: November 3, 2026  

---

## 1. Passage-Level Provenance Verification

- **Disk Source Verification**: `retrieve_authoritative_ncert_evidence` reads raw file contents on disk (`Class {grade}/{subj.title()}/Source Files/07-Overview.json`).
- **Normalized String Matching**: Normalizes whitespace and verifies `norm_passage in norm_file_content` before assigning `VERIFIED_PASSAGE`.
- **Status Assignment**:
  - `VERIFIED_PASSAGE`: File exists AND passage text is verified inside raw source file on disk.
  - `FILE_EXISTS_PASSAGE_UNVERIFIED`: Source file exists, but passage text match failed.
  - `UNVERIFIED`: Source file does not exist on disk.
  - `NO_EVIDENCE`: Score < 2.
