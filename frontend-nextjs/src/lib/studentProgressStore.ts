/**
 * Authenticated Student Progress & Activity Persistence
 * Manages real student chapter progress, completed items, quiz scores, and last activity isolated by Firebase UID.
 */

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

export interface StudentProgressState {
  completedChapters: string[]; // List of completed chapter_ids
  lastActivity: StudentLastActivity | null;
  quizScores: QuizScoreRecord[];
  streakDays: number;
  lastActiveDate: string | null;
  bookmarks: string[];
  practiceMarked: string[];
}

const BASE_PROGRESS_KEY = 'gurukul_student_progress_v2';

const DEFAULT_PROGRESS: StudentProgressState = {
  completedChapters: [],
  lastActivity: null,
  quizScores: [],
  streakDays: 0,
  lastActiveDate: null,
  bookmarks: [],
  practiceMarked: []
};

function getKey(uid?: string): string {
  return uid ? `${BASE_PROGRESS_KEY}_${uid}` : BASE_PROGRESS_KEY;
}

export function getStudentProgress(uid?: string): StudentProgressState {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(getKey(uid));
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveStudentProgress(state: StudentProgressState, uid?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getKey(uid), JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist student progress:', e);
  }
}

export function recordChapterActivity(activity: Omit<StudentLastActivity, 'timestamp'>, uid?: string): void {
  const current = getStudentProgress(uid);
  const updatedActivity: StudentLastActivity = {
    ...activity,
    timestamp: Date.now()
  };

  const today = new Date().toISOString().split('T')[0];
  let newStreak = current.streakDays;

  if (current.lastActiveDate !== today) {
    if (current.lastActiveDate) {
      const lastDate = new Date(current.lastActiveDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
  }

  saveStudentProgress({
    ...current,
    lastActivity: updatedActivity,
    streakDays: newStreak,
    lastActiveDate: today
  }, uid);
}

export function markChapterCompleted(chapterId: string, uid?: string): void {
  const current = getStudentProgress(uid);
  const idStr = String(chapterId);
  if (!current.completedChapters.includes(idStr)) {
    saveStudentProgress({
      ...current,
      completedChapters: [...current.completedChapters, idStr]
    }, uid);
  }
}

export function recordQuizScore(chapterId: string, score: number, total: number, uid?: string): void {
  const current = getStudentProgress(uid);
  const newRecord: QuizScoreRecord = {
    chapter_id: chapterId,
    score,
    total,
    timestamp: Date.now()
  };
  saveStudentProgress({
    ...current,
    quizScores: [...current.quizScores, newRecord]
  }, uid);
}
