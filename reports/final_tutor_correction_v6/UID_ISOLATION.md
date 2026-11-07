# GURUKUL AI V6 — UID ISOLATION REPORT
**Date**: November 3, 2026  

---

## 1. Learner Scope & UID Isolation

- **Verified Token Origin**: Learner UID derived strictly from verified Firebase Admin ID tokens.
- **Request Overrides Ignored**: Client-supplied UIDs in request body or headers are ignored.
- **Storage Scope**: Progress and events ledger saved under `users/{uid}/progress/current`.
