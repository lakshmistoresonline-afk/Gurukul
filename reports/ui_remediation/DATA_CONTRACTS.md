# GURUKUL AI — DATA CONTRACTS SPECIFICATION
**Date**: November 2, 2026  

---

## 1. Student Progress State Contract (`StudentProgressState`)

```typescript
export interface StudentLastActivity {
  grade: string;
  subject: string;
  book: string;
  part: string;
  unit: string;
  chapter_id: string;
  chapter_title?: string;
  timestamp: number;
}

export interface QuizScoreRecord {
  chapter_id: string;
  score: number;
  total: number;
  timestamp: number;
}

export interface MissionEventRecord {
  event_id: string;
  type: 'video_view' | 'flashcard_review' | 'quiz_completion' | 'chapter_completion';
  chapter_id: string;
  timestamp: number;
  xp_awarded: number;
}

export interface StudentProgressState {
  completedChapters: string[];
  lastActivity: StudentLastActivity | null;
  quizScores: QuizScoreRecord[];
  streakDays: number;
  lastActiveDate: string | null;
  bookmarks: string[];
  practiceMarked: string[];
  eventsLedger?: MissionEventRecord[];
  selectedGrade?: string;
}
```

---

## 2. Curriculum Identity Contract (`CurriculumIdentity`)

```typescript
export interface CurriculumIdentity {
  grade: string;
  subject: string;
  book: string;
  part: string;
  unit: string;
  chapter_id: string;
  content_type: string;
}
```

---

## 3. Flashcard Content Response Schema (`FlashcardData`)

```typescript
export interface FlashcardItem {
  card_id: string;
  front: string;
  back: string;
  difficulty_level?: string;
  topic?: string;
  key_takeaway?: string;
}
```
