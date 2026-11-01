# GURUKUL AI — DASHBOARD CURRENT STATE AUDIT REPORT

**Date**: November 1, 2026  
**Git Branch**: `feature/gurukul-production-remediation`  
**Git Commit SHA**: `0db32d1291a0c3a1e9ca9c26d62d393968d69e04`  
**Working Tree**: `Clean (0 uncommitted changes)`  
**Scope**: Read-Only Baseline Inspection of Existing Student Dashboard (`app/page.tsx`)

---

## 1. Environment & Architecture Baseline

* **Framework**: Next.js 14.2.5 (App Router, Static Export `output: 'export'`).
* **Styling**: Tailwind CSS with custom theme design tokens (`indigo`, `teal`, `amber`, `emerald`, `rose`, `purple`, `slate`).
* **Icons**: `lucide-react` (icons for navigation, subjects, streaks, badges, media indicators).
* **State Management**: React `useState` & `useEffect` + LocalStorage (`gurukul_canonical_bookmarks`, `gurukul_canonical_need_practice`, `gurukul_student_progress`).
* **Authentication**: Firebase Authentication (`onAuthStateChanged` hook in `auth`).
* **Persistence Layer**: Dual-tier storage: Firestore (`users/{uid}/progress/current`) for authenticated users with automatic fallback to LocalStorage for guest users.
* **Curriculum Data Source**: `CurriculumApiClient.fetchHierarchy()` querying FastAPI backend endpoint (`GET /api/v1/curriculum/hierarchy`).
* **Entry Route**: `/` (`frontend-nextjs/src/app/page.tsx`).

---

## 2. Main Dashboard Layout & Visible Components

The existing dashboard (`/`) renders a structured single-page layout containing 5 primary sections:

1. **Student Welcome & Gamified Level Banner**:
   - Displays student name (`currentUser?.displayName` or email/guest fallback).
   - Displays Level Badge (`Level X Scholar • Y Total XP`).
   - XP Level Progress Bar (`XP to Level X+1`).
   - Action Buttons: `Resume Chapter` / `Start First Lesson` & `View 5-Step Journey`.

2. **Daily 3-Mission Quest Widget**:
   - **Mission 1**: Watch Video (+100 XP).
   - **Mission 2**: Review Flashcard (+100 XP).
   - **Mission 3**: Pass Chapter Quiz (+100 XP).
   - Checkmark indicators reflecting student completion state.

3. **4-Tile Metrics Bar**:
   - **Learning Streak**: Consecutive study days (`progress.streakDays`).
   - **Chapters Mastered**: Mastered vs. total chapters (`completedChapters.length / totalClass5Chapters`).
   - **Quiz Accuracy**: Average percentage across attempts (`quizAccuracy%`).
   - **Achievements**: Unlocked badge status.

4. **Interactive 10-Second Daily Revision Widget**:
   - Interactive flip flashcard card (`word`, `meaning`, `subject`).
   - Click-to-flip state (`flashcardFlipped`).
   - `Next Word` button cycling through Class 5 vocabulary.

5. **Class 5 Interactive Subject Realms Grid**:
   - 4 Themed Subject Realm Cards:
     - 🌴 **Santoor Island** (English)
     - 🌺 **Veena Realm** (Hindi)
     - 📐 **Maths Mela Kingdom** (Mathematics)
     - 🧪 **Wondrous World Lab** (Science)
   - Asset Availability Badges (`[ 📺 Studio Videos ] [ 🗺️ 16:9 Diagrams ] [ ⚡ 3D Flashcards ] [ 🎯 MCQ Quizzes ]`).
   - Progress bar per subject (`completedChapters / totalChapters`).
   - Direct link button to enter each realm (`buildCurriculumUrl(...)`).

---

## 3. Responsive Viewport Performance

- **Wide Desktop (1920×1080)**: 2x2 grid for subject cards, 4-column metrics bar, centered banner.
- **Standard Desktop (1366×768)**: Responsive max-width 7xl container with balanced padding.
- **Tablet (768px)**: 2-column grid for metrics and subject cards; stacked banner controls.
- **Mobile (390px & 360px)**: Single column layout, touch-friendly tap targets (>44px).
