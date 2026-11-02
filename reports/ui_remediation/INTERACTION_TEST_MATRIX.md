# GURUKUL AI — INTERACTION TEST MATRIX
**Date**: November 2, 2026  

---

| Interaction Test Case | Tested Component | Input / Trigger | Expected Behavior | Verification Status |
|---|---|---|---|---|
| **Class Switching (Sidebar)** | `StudentNavigation.tsx` | Click `Class 6` button | Updates `selectedGrade` to `'6'`, saves preference, dispatches `gradeChanged` event | **VERIFIED PASS** |
| **Class Switching (Dashboard Modal)** | `app/page.tsx` | Click `Class 5 • Change class` | Opens Grade Selector Modal; selecting Class 7 updates state to Class 7 | **VERIFIED PASS** |
| **Continue Chapter Click** | `app/page.tsx` | Click `Continue chapter ➔` | Opens exact `lastActivity` chapter workspace with full identity parameters | **VERIFIED PASS** |
| **Flashcard Flip (Pointer)** | `app/page.tsx` | Click flashcard container | Flips card to reveal `back` explanation; records review event | **VERIFIED PASS** |
| **Flashcard Flip (Keyboard)** | `app/page.tsx` | Press `Space` or `Enter` | Flips card to reveal `back` explanation | **VERIFIED PASS** |
| **Flashcard Navigation** | `app/page.tsx` | Press `ArrowRight` / `ArrowLeft` | Navigates to next/previous flashcard item without index out-of-bounds | **VERIFIED PASS** |
| **Subject Chapter Select** | `app/subjects/page.tsx` | Click chapter title button | Opens exact canonical chapter in workspace | **VERIFIED PASS** |
| **Learning Journey Stage** | `app/journey/page.tsx` | Click `Start Stage` | Opens active chapter with exact `content_type` (`overview`, `notes`, `foundational`, etc.) | **VERIFIED PASS** |
| **Mobile Menu Drawer** | `StudentNavigation.tsx` | Tap `More` on mobile nav | Opens slide-up menu drawer displaying all destinations and grade selector | **VERIFIED PASS** |
