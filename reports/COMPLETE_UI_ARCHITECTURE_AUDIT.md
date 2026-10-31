# GURUKUL AI — COMPLETE UI ARCHITECTURE AUDIT REPORT

**Date**: October 31, 2026  
**Branch**: `feature/complete-student-ui-redesign`  
**Baseline Commit**: `3f632ee7028d37638554b9b050f8692b19615dcf`  
**Auditor**: Principal Software Architect & Lead Full-Stack Engineer  

---

## 1. Executive Summary

This architecture audit evaluates the complete frontend and backend state of **GURUKUL AI** to prepare for the final student-facing UI transformation, Firebase authentication restoration, authentic data binding, and 3-region workspace layout.

---

## 2. Route & Screen Audit Matrix

| Route | Current File Path | Existing Functionality | Identified Gaps | Required Changes |
|---|---|---|---|---|
| **`/` (Dashboard)** | `frontend-nextjs/src/app/page.tsx` | Welcome banner, streak, subject cards, metrics bar. | Uses fallback subject cards when hierarchy loading is slow; hardcoded goals. | Connect to Firebase Auth user, load subjects dynamically from `/api/v1/curriculum/hierarchy`, read `studentProgressStore` for streak/completed stats. |
| **`/subjects`** | `frontend-nextjs/src/app/subjects/page.tsx` | Static subject cards array. | Hardcoded topics and chapter counts. | Fetch real subjects, books, units, and chapter counts from `/api/v1/curriculum/hierarchy`. |
| **`/journey`** | `frontend-nextjs/src/app/journey/page.tsx` | 7-stage pathway cards. | Cards link to hardcoded English chapter. | Bind stages to active chapter/subject; map stage completion to actual student activity. |
| **`/curriculum`** | `frontend-nextjs/src/app/curriculum/page.tsx` | Renders `CatchAllChapterClient.tsx`. | AI Tutor active link in sidebar highlighted when on `/curriculum`. | Fix sidebar active matching logic; implement 3-region desktop layout (Left: stages, Centre: lesson, Right: AI tutor). |
| **`/discovery`** | `frontend-nextjs/src/app/discovery/page.tsx` | Static cards with hardcoded counts. | Hardcoded counts (48 diagrams, 40 mindmaps, 52 videos). | Fetch actual diagram maps and video metadata from `media_directory.json` and `studio_video_links.json`. |
| **`/practice`** | `frontend-nextjs/src/app/practice/page.tsx` | Arena overview cards. | Quizzes link to static chapter. | Implement dynamic chapter quiz selection, timed practice, hints, and scoring. |
| **`/achievements`** | `frontend-nextjs/src/app/achievements/page.tsx` | Badge cards. | Hardcoded badge unlock dates. | Calculate unlocked badges dynamically from verified student progress events. |
| **`/library`** | `frontend-nextjs/src/app/library/page.tsx` | Bookmarks and practice list. | Sample bookmarked chapter. | Bind directly to `localStorage` / Firebase user bookmarks and practice flags. |
| **`/tutor`** | `frontend-nextjs/src/app/tutor/page.tsx` | Chat interface. | Connected to `/api/v1/tutor/chat` (Ollama backend). | Add loading states, model status indicators, and prompt presets. |

---

## 3. Firebase Authentication & User Isolation Audit (P0)

- **`frontend-nextjs/src/lib/firebase.ts`**: Firebase App and Auth initialization present.
- **`frontend-nextjs/src/components/LoginScreen.tsx`**: Login/Sign-up modal component present.
- **Requirement**: Restore auth state listener in `AppShell` / `StudentNavigation` so authenticated student name, avatar, and role-based student isolation are active across all 8 routes.

---

## 4. Backend API & Curriculum Registry Audit

- **FastAPI Endpoints**:
  - `GET /api/v1/curriculum/hierarchy`: Returns complete 6D hierarchy (`Class -> Subject -> Book -> Part -> Unit -> Chapter`).
  - `GET /api/v1/curriculum/resolve`: Resolves exact chapter content module (`Overview`, `Notes`, `Master`, `Foundational`, `Flashcards`, `Mindmaps`, `Quiz`, `Question Papers`).
  - `POST /api/v1/tutor/chat`: Connects to local Ollama LLM (`gemma:2b` / `qwen:1.8b`) with explicit `OFFLINE` error reporting when port 11434 is closed.

---

## 5. Verification Plan

1. Restore Firebase Auth listener and student profile state.
2. Upgrade `StudentNavigation.tsx` for responsive desktop/mobile layout and exact route matching.
3. Update `page.tsx`, `subjects/page.tsx`, `journey/page.tsx`, `practice/page.tsx`, `discovery/page.tsx`, `achievements/page.tsx`, `library/page.tsx` with 100% dynamic API and progress data bindings.
4. Upgrade `CatchAllChapterClient.tsx` into a genuine 3-region workspace with compact header, 7-stage learning path, and contextual AI Tutor panel.
5. Compile production build (`npm run build`) and run backend test suite (`python -m pytest backend/tests/ -v`).
