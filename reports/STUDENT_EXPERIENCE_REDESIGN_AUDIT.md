# GURUKUL AI — COMPLETE STUDENT EXPERIENCE REDESIGN AUDIT REPORT

**Date**: October 31, 2026  
**Auditor**: Principal Product Architect, Lead Next.js/React & Android Engineer  
**Scope**: Complete Student Experience Redesign & Class 5 Content Processing Pipeline Integration  

---

## 1. Route & Screen Inventory

Current Next.js application routes in `frontend-nextjs/src/app/`:
- **`app/page.tsx`**: Current home page containing a basic grade/subject selection grid.
- **`app/curriculum/page.tsx`**: Renders `CatchAllChapterClient.tsx` for chapter workspace view (`/curriculum?grade=5&subject=english&book=english&part=main&unit=U01&chapter_id=G5-ENG-U01-C01`).

### Target Navigation Structure to Implement:
1. **My Learning (Dashboard)**: Data-driven dashboard (`/` or `/dashboard`).
2. **Subjects**: Authoritative subject explorer (`/subjects`).
3. **Learning Journey**: 7-stage interactive pathway (`/journey`).
4. **Chapter Workspace**: Upgraded chapter page (`/curriculum`) maintaining all existing 8 tabs and notes sub-navigation.
5. **Discovery Lab**: Interactive diagrams, mindmaps, and media studio (`/discovery`).
6. **Practice Arena**: Quizzes, question papers, and assessment items (`/practice`).
7. **My Achievements**: Gamification, streaks, and badges (`/achievements`).
8. **My Library**: Bookmarks, marked-for-practice items, and offline cache (`/library`).

---

## 2. Current Features & Component Inventory

### Working Capabilities (To Preserve 100%):
- **`CatchAllChapterClient.tsx`**: Renders chapter title, breadcrumb (`grade → subject → book → part → unit → chapter_id`), bookmarking button, practice marker, AI tutor quick actions, and 8 content tabs (`Overview`, `Notes`, `Master`, `Foundational`, `Flashcards`, `Mindmaps`, `Quiz`, `Question Papers`).
- **`AudioReaderToolbar.tsx`**: Ambient audio player with speech speed control (0.75x–1.5x) and background ambience sounds.
- **`AmbientAtmosphereOverlay.tsx`**: Visual atmosphere backdrop.
- **`ReadingComfortControl.tsx`**: Font size, line height, contrast, and theme controls.
- **`RendererRegistry.tsx`**: Dynamic module renderer mapping `OverviewComponent`, `NotesComponent`, `MasterComponent`, `FoundationalComponent`, `FlashcardsComponent`, `MindmapComponent`, `QuizComponent`, `QuestionPapersComponent`.
- **`CommandPalette.tsx`**: Global shortcut palette (`Ctrl+K`).
- **`DailyQuestWidget.tsx` & `FocusTimerWidget.tsx`**: Utility widgets on main view.

---

## 3. Code, API & Data Contracts

- **Curriculum API Client (`frontend-nextjs/src/lib/curriculumClient.ts`)**:
  - `getCurriculumHierarchy()` -> `GET /api/v1/curriculum/hierarchy`
  - `getChapterSource(chapterId, grade, subject, book, part, unit)` -> `GET /api/v1/chapters/{chapter_id}/source`
  - `resolveCurriculumNode(...)` -> `GET /api/v1/curriculum/resolve`
- **Identity Dimension Contract**: All routes and components must strictly pass and preserve `grade`, `subject`, `book`, `part`, `unit`, `chapter_id`, `content_type`.

---

## 4. Class 5 Source Inventory & CSV Reconciliation

Source Root: `D:\GURUKUL\Contents\Class 5\`

### Subject Audit:
1. **English**:
   - `Source Files/`: Contains all 10 required JSON data modules (`01-media_directory.json`, `12-studio_video_links.json`, `13-Overview.json`, `14-Notes.json`, `15-Mindmaps.json`, `16-Flashcards.json`, `17-Quiz.json`, `18-Question_Papers.json`, `19-Foundational.json`, `20-Master.json`).
   - `Images/`: Contains 10 16:9 interactive diagram PNG maps (`ch01_` to `ch10_`).
   - `Videos/`: Contains 11 studio MP4 video lessons (`01-Santoor Grade 5 Bridge.mp4` through `11-Papa's Spectacles.mp4`).
   - `source-artifact-map.csv`: Reconciled 100% against actual disk files.
2. **Hindi**: 10 JSON modules, 13 diagram PNGs, 13 studio MP4 videos.
3. **Maths**: 10 JSON modules, 15 diagram PNGs, 17 studio MP4 videos.
4. **Science**: 10 JSON modules, 10 diagram PNGs, 11 studio MP4 videos.

---

## 5. Identified Gaps & Redesign Requirements

1. **Lack of Global Navigation**: The user needs a persistent responsive sidebar/topbar navigation across all 8 target screens.
2. **Missing Student Dashboard**: The current `/` route displays a simple grade grid instead of a data-driven student dashboard with Continue Learning, streak counters, Subject Cards, and daily quests.
3. **Missing Subject & Journey Views**: Need a dedicated `/subjects` page and `/journey` page mapping the 7-stage learning journey (Discover → Learn → Understand → Explore → Practise → Challenge → Master).
4. **Mobile Responsiveness**: Needs single-column layout adaptors for mobile screens.
5. **Accessibility**: Needs enhanced semantic landmarks, visible focus states, and keyboard navigation.

---

## 6. Implementation Plan & File-Level Matrix

### Phase 1: Shared Navigation & Design Tokens
- Modify `frontend-nextjs/src/components/AppShell.tsx` [NEW]
- Modify `frontend-nextjs/src/components/StudentNavigation.tsx` [NEW]
- Modify `frontend-nextjs/src/styles/globals.css` [UPDATE design tokens]

### Phase 2: Student Dashboard & Subject Explorer
- Modify `frontend-nextjs/src/app/page.tsx` [TRANSFORM into Student Dashboard]
- Create `frontend-nextjs/src/app/subjects/page.tsx` [NEW Subject Explorer]
- Create `frontend-nextjs/src/app/journey/page.tsx` [NEW Learning Journey]
- Create `frontend-nextjs/src/app/discovery/page.tsx` [NEW Discovery Lab]
- Create `frontend-nextjs/src/app/practice/page.tsx` [NEW Practice Arena]
- Create `frontend-nextjs/src/app/achievements/page.tsx` [NEW Achievements]
- Create `frontend-nextjs/src/app/library/page.tsx` [NEW Library]

### Phase 3: Chapter Workspace & Interactive Enhancements
- Modify `frontend-nextjs/src/components/CatchAllChapterClient.tsx` [Upgrade workspace, preserve all existing tabs and actions]
- Upgrade `FlashcardsComponent.tsx` [3D flip card + SM-2 spaced repetition]
- Upgrade `InteractiveDiagramMap.tsx` [16:9 diagram vectors + percentage hotspots]

### Phase 4: Verification & Reports
- Generate `D:\GURUKUL\reports\STUDENT_EXPERIENCE_IMPLEMENTATION_REPORT.md`
- Generate `D:\GURUKUL\reports\CLASS5_CONTENT_INTEGRATION_REPORT.md`
