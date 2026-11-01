# GURUKUL AI — DASHBOARD COMPONENT MAP REPORT

This document maps every visible dashboard element to its rendering component, file path, line numbers, data source, and state type.

---

## Component Inventory

| Visible Element | Rendering Component | File Path | Data Source | Data State | Destination Route / Action |
|---|---|---|---|---|---|
| **Header Navigation & Sidebar** | Root Layout Sidebar | `app/layout.tsx` | App Routes | Static / Active Link | `/`, `/subjects`, `/journey`, `/tutor`, `/discovery`, `/practice`, `/achievements`, `/library` |
| **Welcome Banner** | `StudentDashboard` | `app/page.tsx#L160-200` | Firebase Auth & Firestore | Live (`currentUser`, `progress`) | Continue to active chapter via `buildCurriculumUrl` |
| **Gamified Level & XP Bar** | `StudentDashboard` | `app/page.tsx#L170-188` | Calculated from `completedChapters`, `quizScores`, `streakDays` | Derived Live | Displays level progression |
| **Daily 3-Mission Quests** | `StudentDashboard` | `app/page.tsx#L205-245` | `progress` state | Derived Live | Tracks daily learning tasks |
| **Learning Streak Metric** | `StudentDashboard` | `app/page.tsx#L250-260` | `progress.streakDays` | Live Firestore / LocalStorage | Stat display |
| **Chapters Mastered Metric**| `StudentDashboard` | `app/page.tsx#L262-272` | `progress.completedChapters` | Live Firestore / LocalStorage | Stat display |
| **Quiz Accuracy Metric** | `StudentDashboard` | `app/page.tsx#L274-284` | `progress.quizScores` | Derived Live | Stat display |
| **10-Sec Revision Flashcard**| `StudentDashboard` | `app/page.tsx#L295-330` | `sampleFlashcards` array | Client State (`flashcardIdx`, `flashcardFlipped`) | Interactive flip & next card cycle |
| **Subject Realm Cards (x4)** | `StudentDashboard` | `app/page.tsx#L335-410` | `processedSubjects` (derived from `fetchHierarchy()`) | Live Hierarchy API | Navigates to Chapter 1 of selected subject via `buildCurriculumUrl` |
| **Asset Badges** | `StudentDashboard` | `app/page.tsx#L370-385` | Subject metadata | Static / Verified | Displays `Video`, `Diagram`, `Flashcards`, `Quiz` capabilities |

---

## Code References

- Dashboard Page: `frontend-nextjs/src/app/page.tsx`
- Curriculum Client: `frontend-nextjs/src/lib/curriculumClient.ts`
- Student Progress Store: `frontend-nextjs/src/lib/studentProgressStore.ts`
- Firebase Config: `frontend-nextjs/src/lib/firebase.ts`
