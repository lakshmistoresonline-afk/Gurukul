# GURUKUL AI — NCERT PROVENANCE AUDIT
**Date**: November 3, 2026  

---

## 1. Provenance Verification Contract

- **Passage Validation**: `retrieve_authoritative_ncert_evidence` in `backend/src/curriculum/api/tutor.py` validates that source overview files (`07-Overview.json`) exist on disk before assigning `"provenance_validation_status": "VERIFIED_SOURCE_PROVENANCE"`.
- **Grade Enforcement**: Enforces `str(node.get("grade")) == str(grade)` during retrieval.
- **Cross-Subject Distinction**: Queries matching a different subject (e.g. Photosynthesis in Science during an English session) are tagged as `NCERT_CROSS_SUBJECT` or `GENERAL_KNOWLEDGE`.
