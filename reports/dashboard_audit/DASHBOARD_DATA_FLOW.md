# GURUKUL AI — DASHBOARD DATA FLOW REPORT

This document traces data from source APIs, Firebase Firestore, and LocalStorage into the rendered dashboard UI.

---

## Data Flow Diagram

```
                             ┌───────────────────────────────────┐
                             │       Firebase Authentication     │
                             └─────────────────┬─────────────────┘
                                               │
                                       onAuthStateChanged
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
         [Authenticated User (uid)]                          [Unauthenticated Guest]
                       │                                               │
         syncStudentProgressFromFirestore                             getStudentProgress('guest')
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                                  [StudentProgressState]
                         • completedChapters: string[]
                         • lastActivity: ChapterActivity
                         • quizScores: QuizScoreRecord[]
                         • streakDays: number
                         • bookmarks: string[]
                                               │
                                               ▼
                                 [Curriculum Hierarchy API]
                        GET http://127.0.0.1:8001/api/v1/curriculum/hierarchy
                                               │
                                               ▼
                                  [Processed Subject Realms]
                         • English (Santoor Island)
                         • Hindi (Veena Realm)
                         • Maths (Maths Mela Kingdom)
                         • Science (Wondrous World Lab)
                                               │
                                               ▼
                                    [Rendered Dashboard UI]
```

---

## Data Source Specifications

1. **Curriculum Hierarchy (`fetchHierarchy`)**:
   - URL: `GET /api/v1/curriculum/hierarchy`
   - Content: Returns Grade 5 hierarchy containing subjects, books, units, and chapters.
   - Fallback: Hardcoded Class 5 subject structure if API is offline.

2. **Student Progress (`syncStudentProgressFromFirestore`)**:
   - Collection: `users/{uid}/progress/current`
   - Fields: `completedChapters`, `lastActivity`, `quizScores`, `streakDays`, `lastActiveDate`.
   - Local Fallback: `localStorage.getItem('gurukul_student_progress_guest')`.

3. **Curriculum Identity URLs (`buildCurriculumUrl`)**:
   - Route: `/curriculum?grade=5&subject={subject}&book={book}&part=main&unit=U01&chapter_id={chapter_id}`
