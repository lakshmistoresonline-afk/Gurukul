/**
 * Authenticated Student Progress & Firestore Persistence Engine
 * Manages real student chapter progress, completed items, quiz scores, and last activity
 * backed authoritatively by Firebase Firestore (doc: users/{uid}/progress/current)
 * with offline local cache fallback.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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

const BASE_PROGRESS_KEY = 'gurukul_student_progress_v3';

const DEFAULT_PROGRESS: StudentProgressState = {
  completedChapters: [],
  lastActivity: null,
  quizScores: [],
  streakDays: 0,
  lastActiveDate: null,
  bookmarks: [],
  practiceMarked: []
};

function getLocalCacheKey(uid: string): string {
  return `${BASE_PROGRESS_KEY}_${uid}`;
}

/**
 * Reads student progress from local cache synchronously or Firestore asynchronously.
 */
export function getStudentProgress(uid: string): StudentProgressState {
  if (typeof window === 'undefined' || !uid) return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(getLocalCacheKey(uid));
    if (!raw) return DEFAULT_PROGRESS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/**
 * Asynchronously fetches authoritative student progress from Firestore and syncs to local cache.
 */
export async function syncStudentProgressFromFirestore(uid: string): Promise<StudentProgressState> {
  if (!uid) return DEFAULT_PROGRESS;
  try {
    const ref = doc(db, 'users', uid, 'progress', 'current');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as StudentProgressState;
      if (typeof window !== 'undefined') {
        localStorage.setItem(getLocalCacheKey(uid), JSON.stringify(data));
      }
      return data;
    }
  } catch (e) {
    console.warn('Firestore progress fetch failed, using local cache:', e);
  }
  return getStudentProgress(uid);
}

/**
 * Persists student progress state to both local cache and Firestore.
 */
export async function saveStudentProgress(state: StudentProgressState, uid: string): Promise<void> {
  if (!uid) return;

  // 1. Local Cache Save
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getLocalCacheKey(uid), JSON.stringify(state));
    } catch (e) {
      console.error('Failed to update local progress cache:', e);
    }
  }

  // 2. Authoritative Firestore Sync
  try {
    const ref = doc(db, 'users', uid, 'progress', 'current');
    await setDoc(ref, {
      ...state,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore progress write deferred (offline mode):', e);
  }
}

export function recordChapterActivity(activity: Omit<StudentLastActivity, 'timestamp'>, uid: string): void {
  if (!uid) return;
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

  const newState: StudentProgressState = {
    ...current,
    lastActivity: updatedActivity,
    streakDays: newStreak,
    lastActiveDate: today
  };

  saveStudentProgress(newState, uid);
}

export function markChapterCompleted(chapterId: string, uid: string): void {
  if (!uid) return;
  const current = getStudentProgress(uid);
  const idStr = String(chapterId);
  if (!current.completedChapters.includes(idStr)) {
    const newState: StudentProgressState = {
      ...current,
      completedChapters: [...current.completedChapters, idStr]
    };
    saveStudentProgress(newState, uid);
  }
}

export function recordQuizScore(chapterId: string, score: number, total: number, uid: string): void {
  if (!uid) return;
  const current = getStudentProgress(uid);
  const newRecord: QuizScoreRecord = {
    chapter_id: chapterId,
    score,
    total,
    timestamp: Date.now()
  };
  const newState: StudentProgressState = {
    ...current,
    quizScores: [...current.quizScores, newRecord]
  };
  saveStudentProgress(newState, uid);
}
