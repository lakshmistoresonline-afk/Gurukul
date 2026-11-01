# GURUKUL AI — UI REDESIGN REFERENCE & ROUTE MAPPING AUDIT REPORT

**Date**: November 1, 2026  
**Design Direction**: "Modern Learning Adventure"  
**Repository Branch**: `feature/gurukul-production-remediation`  

---

## 1. Reference Screenshot Inventory & Next.js App Router Mapping

| Reference Screenshot | Target Next.js App Router Route | Target Component / File Path | Data Source & Binding Policy |
|---|---|---|---|
| **01_My_Learning_Dashboard.png** | `/` | `frontend-nextjs/src/app/page.tsx` | Driven by `getCurriculumHierarchy()` and `studentProgressStore.ts`. |
| **02_Subjects.png** | `/subjects` | `frontend-nextjs/src/app/subjects/page.tsx` | Driven by Class 5 subject metadata and `CurriculumRegistry`. |
| **03_Subject_Dashboard_Mathematics.png** | `/subjects` / Subject View | `frontend-nextjs/src/app/subjects/page.tsx` | Dynamic chapter list with interactive chapter selector buttons. |
| **04_Chapter_Learning_Journey.png** | `/journey` | `frontend-nextjs/src/app/journey/page.tsx` | 5-Step Learning Pathway (`Discover`, `Learn`, `Explore`, `Practice`, `Assess`). |
| **05_Lesson_View.png** | `/curriculum` | `frontend-nextjs/src/components/CatchAllChapterClient.tsx` | 8-Tab workspace with Audio Reader Toolbar and SelectedTextTutor popup. |
| **06_AI_Tutor.png** | `/tutor` | `frontend-nextjs/src/app/tutor/page.tsx` | Contextual AI Tutor with mode badges (`NCERT_CHAPTER`, `GENERAL_KNOWLEDGE`) and message action toolbar. |
| **07_Practice_Arena.png** | `/practice` | `frontend-nextjs/src/app/practice/page.tsx` | Interactive MCQ Quizzes & Assessment Engine. |
| **08_Achievements_and_Progress.png** | `/achievements` | `frontend-nextjs/src/app/achievements/page.tsx` | Badges, Level Progression, Total XP, and Learning Streaks. |
| **09_Discovery_Lab.png** | `/discovery` | `frontend-nextjs/src/app/discovery/page.tsx` | 16:9 Hotspot Diagrams & Studio Video Lessons. |

---

## 2. Design Consistency & Verification

- **Color Palette**: Dark Slate (`bg-slate-950`), Teal-to-Indigo Gradients (`from-teal-500 to-indigo-600`), Vibrant Gold Badges (`text-amber-400`).
- **Data Safety**: All UI components map to real, authoritative application data without hardcoded demonstration text.
- **Responsiveness**: All 9 routes compile 100% cleanly into static export (`npm run build`).
