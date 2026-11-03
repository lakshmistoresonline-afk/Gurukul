# GURUKUL AI — TUTOR UI QA CHECKLIST
**Date**: November 2, 2026  

---

| QA Requirement | Tested Surface | Result | Verification |
|---|---|---|---|
| **No False Textbook Attribution** | AI Tutor Response text | `GENERAL_KNOWLEDGE` mode does not claim to be from English | **PASS** |
| **Subject-Aware Presets** | Preset Question Cards | Cards adapt to selected subject & chapter | **PASS** |
| **Light Theme Styling** | `app/tutor/page.tsx` | Background `#F5F6F8`, white card containers, dark text | **PASS** |
| **Action Toolbar (Copy, Read, Retry, Rating)** | Chat Message Item | All 4 action buttons function cleanly | **PASS** |
| **Responsive Viewports** | 390px, 768px, 1440px | Zero horizontal overflow or control clipping | **PASS** |
| **Keyboard Accessibility** | Input & Send Button | Enter sends query, Shift+Enter inserts newline | **PASS** |
