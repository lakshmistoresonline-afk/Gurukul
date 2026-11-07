# GURUKUL AI V3 — BROWSER UAT REPORT
**Date**: November 3, 2026  

---

## 1. Browser UAT Verification Matrix

| Test Scenario | Component | Action / Output | Status |
|---|---|---|---|
| **Class 5 Active Chapter Query** | `app/tutor/page.tsx` | Grounded NCERT chapter answer | **PASS — EXECUTED** |
| **Class 6 Cross-Subject Query** | `app/tutor/page.tsx` | Science explanation in English session | **PASS — EXECUTED** |
| **Class 7 Math Solution** | `app/tutor/page.tsx` | Universal Math Solver evaluating `2+3*2*9-15/3 = 51` | **PASS — EXECUTED** |
| **Grade Switching** | Sidebar & Top Switcher | Class 5 ➔ 6 ➔ 7 active grade sync | **PASS — EXECUTED** |
| **Unauthenticated Request** | Next.js Proxy `/api/tutor/chat` | Rejected with `401 Unauthorized` | **PASS — EXECUTED** |
