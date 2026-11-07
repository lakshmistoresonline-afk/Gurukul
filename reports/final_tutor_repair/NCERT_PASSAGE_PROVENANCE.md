# GURUKUL AI — NCERT PASSAGE-LEVEL PROVENANCE VALIDATION
**Date**: November 3, 2026  

---

## 1. Passage-Level Provenance Logic (`tutor.py`)

- **Normalized String Matching**: Converts passage and source file text to single-space normalized strings (`" ".join(passage.split()) in " ".join(source.split())`).
- **Status Assignment**:
  - `VERIFIED_PASSAGE`: File exists AND normalized passage text is verified inside the source file.
  - `FILE_EXISTS_PASSAGE_UNVERIFIED`: Source file exists on disk, but passage text match failed.
  - `UNVERIFIED`: Source file does not exist.
  - `NO_EVIDENCE`: Token overlap score < 2.
- **Source Folder Designation**: Accurately distinguishes `Source Files/` vs `Custom Files/` in `source_filename`.
