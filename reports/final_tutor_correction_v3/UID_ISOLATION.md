# GURUKUL AI V3 — UID ISOLATION REPORT
**Date**: November 3, 2026  

---

## 1. Learner Scope & UID Isolation

- **Verified Token Origin**: Learner UID is derived strictly from verified Firebase Admin ID tokens.
- **Request Overrides Rejected**: Client-supplied UIDs in request body or headers are ignored.
- **Storage Isolation**: Progress and events ledger saved under `users/{uid}/progress/current` or local cache key `gurukul_student_progress_v4_{uid}`.
