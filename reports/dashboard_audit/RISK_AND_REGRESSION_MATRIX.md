# GURUKUL AI — RISK AND REGRESSION MATRIX REPORT

This document evaluates regression risks and rollback strategies for the dashboard.

---

## Risk Evaluation Matrix

| Area / Component | Risk Level | Potential Impact | Prevention & Mitigation Strategy | Test & Verification Required |
|---|---|---|---|---|
| **Firebase Auth Sync** | Low | Unauthenticated fallback to guest state | Keep `onAuthStateChanged` listener intact with dual Firestore/LocalStorage sync. | Log in with test account; verify streak & progress load correctly. |
| **Curriculum Hierarchy API** | Low | Offline fallback to static subject array | Maintain fallback array in `rawSubjects` if API endpoint fails. | Disconnect network; verify dashboard renders static fallback. |
| **Resume Link Navigation** | Low | Broken URL redirect | Use `buildCurriculumUrl()` helper function ensuring 6 identity dimensions. | Click "Resume Chapter" and verify `/curriculum` loads correct chapter. |
| **Subject Realm Cards** | Low | Styling or layout overflow | Maintain Tailwind flex-wrap and responsive grid classes (`grid-cols-1 md:grid-cols-2`). | Test at 360px, 390px, 768px, 1366px, 1920px viewports. |

---

## Rollback Plan
In the event of an unapproved regression:
1. Revert to baseline Git commit `0db32d1291a0c3a1e9ca9c26d62d393968d69e04`.
2. Run `npm run build --prefix frontend-nextjs` to confirm static export build compilation.
