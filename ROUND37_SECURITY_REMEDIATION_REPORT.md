# GURUKUL AI — ROUND 37 SECURITY REMEDIATION REPORT
**Date**: November 5, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Summary of Source Code Security Fixes & Audit Findings

| Security Defect Remediation | Source File Modified | Specific Fix Implemented | Execution Status |
|---|---|---|---|
| **Authoritative Firestore Role Resolution Guard** | `backend/src/curriculum/security/auth_service.py` | • Enforced that user `role` is derived **exclusively** from Firestore `user_data.get("role")`.<br>• Unprivileged student profiles in Firestore cannot gain administrative privileges even if client-side custom token claims attempt to pass `admin: true`. | **VERIFIED PASS — EXECUTED AND EVIDENCED** |
| **Path Containment & Media Endpoint Security** | `backend/src/curriculum/api/chapters.py` | • Added `user: AuthenticatedUser = Depends(get_current_user)` authentication to `/curriculum/media/stream`.<br>• Enforces `validate_student_class_access(user, effective_grade)` before searching disk.<br>• Verified path containment using `pathlib.Path` parent hierarchy check (`g_dir in full_p.parents`), preventing path traversal (`..`), path injection, and symlink escapes with **`HTTP 400/403`**. | **VERIFIED PASS — EXECUTED AND EVIDENCED** |
| **Eliminated Token-Derived Class Fallbacks & Default Class "7"** | `backend/src/curriculum/security/auth_service.py` | • Removed unverified token claims fallback (`raw_class = decoded_token.get(...)`) and default `class_id = "7"`.<br>• Student identity resolution derives `classId`, `role`, and `accountStatus` **exclusively** from the authoritative Firestore document `users/{uid}` via Firebase Admin SDK. | **VERIFIED PASS — EXECUTED AND EVIDENCED** |
| **Strict Missing Profile & Inactive Account Rejection** | `backend/src/curriculum/security/auth_service.py` | • If Firestore user profile `users/{uid}` does not exist ➔ Fails closed (**`HTTP 403 Forbidden`**: `Access Denied: Authoritative Firestore user profile not found.`).<br>• If `accountStatus` is not explicitly `"active"` (e.g. `pending`, `suspended`, `disabled`, or missing) ➔ Fails closed (**`HTTP 403 Forbidden`**).<br>• If `classId` is missing from Firestore student profile ➔ Fails closed (**`HTTP 403 Forbidden`**). | **VERIFIED PASS — EXECUTED AND EVIDENCED** |
| **AI Tutor Class Isolation** | `backend/src/curriculum/api/tutor.py` | • Enforces `validate_student_class_access(current_user, str(req.grade))` inside `tutor_chat()`.<br>• Prevents students assigned to one class from requesting another class's AI Tutor explanations or NCERT evidence passages. | **VERIFIED PASS — EXECUTED AND EVIDENCED** |

---

## 2. Final Security Verification Output

- **Core API Integration & Hardened Security Tests**: `39 passed in 3.68s` (**100% PASS**)
- **Full Backend Test Suite**: `165 passed in 370.21s` (**100% PASS**)
- **Next.js Production Export Build**: `✓ Generating static pages (13/13)` (**0 warnings, 0 errors**)
- **Frontend ESLint Validation**: `✔ No ESLint warnings or errors`
- **Python Syntax Compilation**: `python -m py_compile` (**Exit code 0**)
