# GURUKUL AI — NCERT PASSAGE PROVENANCE AUDIT
**Date**: November 3, 2026  

---

## 1. Passage-Level Provenance Contract

- **`VERIFIED_PASSAGE`**: Assigned only when the source overview file exists on disk AND contains non-empty passage text.
- **`FILE_EXISTS_PASSAGE_UNVERIFIED`**: Assigned when source file exists but passage text is missing.
- **`UNVERIFIED`**: Assigned when source file does not exist on disk.
- **`NO_EVIDENCE`**: Assigned when token overlap score < 2.
- **Code Fix**: Fixed undefined variable reference (`exact_passage`) on line 192 in `tutor.py`.
