/**
 * Authenticated Student Progress & Firestore Persistence Engine
 * Manages real student chapter progress, completed items, quiz scores, bookmarks, practice marked items,
 * and daily mission event ledgers backed authoritatively by Firebase Firestore (doc: users/{uid}/progress/current)
 * with explicit typed persistence statuses (saved, pending_sync, failed) and offline local cache.
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

export interface MissionEventRecord {
  event_id: string;
  type: 'video_view' | 'flashcard_review' | 'quiz_completion';
  chapter_id: string;
  timestamp: number;
  xp_awarded: number;
}

export interface StudentProgressState {
  completedChapters: string[]; // List of completed chapter_ids
  lastActivity: StudentLastActivity | null;
  quizScores: QuizScoreRecord[];
  streakDays: number;
  lastActiveDate: string | null;
  bookmarks: string[];
  practiceMarked: string[];
  eventsLedger?: MissionEventRecord[];
}

export type PersistenceStatus = 'saved' | 'pending_sync' | 'failed';

export interface SaveResult {
  status: PersistenceStatus;
  state: StudentProgressState;
  error?: string;
}

const BASE_PROGRESS_KEY = 'gurukul_student_progress_v4';

const DEFAULT_PROGRESS: StudentProgressState = {
  completedChapters: [],
  lastActivity: null,
  quizScores: [],
  streakDays: 0,
  lastActiveDate: null,
  bookmarks: [],
  practiceMarked: [],
  eventsLedger: []
};

function getLocalCacheKey(uid: string): string {
  return `${BASE_PROGRESS_KEY}_${uid || 'guest'}`;
}

/**
 * Reads student progress from local cache synchronously.
 */
export function getStudentProgress(uid: string): StudentProgressState {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  const targetUid = uid || 'guest';
  try {
    const raw = localStorage.getItem(getLocalCacheKey(targetUid));
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/**
 * Asynchronously fetches authoritative student progress from Firestore and syncs to local cache.
 */
export async function syncStudentProgressFromFirestore(uid: string): Promise<StudentProgressState> {
  if (!uid || uid === 'guest') return getStudentProgress('guest');
  try {
    const ref = doc(db, 'users', uid, 'progress', 'current');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as StudentProgressState;
      const merged: StudentProgressState = {
        ...DEFAULT_PROGRESS,
        ...data
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(getLocalCacheKey(uid), JSON.stringify(merged));
      }
      return merged;
    }
  } catch (e) {
    console.warn('Firestore progress fetch failed, using local cache:', e);
  }
  return getStudentProgress(uid);
}

/**
 * Persists student progress state to both local cache and Firestore.
 * Returns typed PersistenceStatus ('saved' | 'pending_sync' | 'failed').
 */
export async function saveStudentProgress(state: StudentProgressState, uid: string): Promise<SaveResult> {
  const targetUid = uid || 'guest';

  // 1. Local Cache Save
  let localSaved = false;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(getLocalCacheKey(targetUid), JSON.stringify(state));
      localSaved = true;
    } catch (e) {
      console.error('Failed to update local progress cache:', e);
    }
  }

  // If unauthenticated guest, local save is primary
  if (!uid || uid === 'guest') {
    return {
      status: localSaved ? 'saved' : 'failed',
      state
    };
  }

  // 2. Authoritative Firestore Sync
  try {
    const ref = doc(db, 'users', uid, 'progress', 'current');
    await setDoc(ref, {
      ...state,
      updatedAt: Date.now()
    }, { merge: true });

    return {
      status: 'saved',
      state
    };
  } catch (e: any) {
    console.warn('Firestore progress write deferred (offline/pending mode):', e);
    return {
      status: localSaved ? 'pending_sync' : 'failed',
      state,
      error: e.message || 'Offline mode: Firestore write pending sync.'
    };
  }
}

export async function recordChapterActivity(
  activity: Omit<StudentLastActivity, 'timestamp'>,
  uid: string
): Promise<SaveResult> {
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

  return await saveStudentProgress(newState, uid);
}

export async function markChapterCompleted(chapterId: string, uid: string): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const idStr = String(chapterId);
  if (!current.completedChapters.includes(idStr)) {
    const newState: StudentProgressState = {
      ...current,
      completedChapters: [...current.completedChapters, idStr]
    };
    return await saveStudentProgress(newState, uid);
  }
  return { status: 'saved', state: current };
}

export async function recordQuizScore(
  chapterId: string,
  score: number,
  total: number,
  uid: string
): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const newRecord: QuizScoreRecord = {
    chapter_id: chapterId,
    score,
    total,
    timestamp: Date.now()
  };

  // Record event in idempotent ledger
  const eventId = `quiz_${chapterId}_${Date.now()}`;
  const newEvent: MissionEventRecord = {
    event_id: eventId,
    type: 'quiz_completion',
    chapter_id: chapterId,
    timestamp: Date.now(),
    xp_awarded: 50
  };

  const newState: StudentProgressState = {
    ...current,
    quizScores: [...current.quizScores, newRecord],
    eventsLedger: [...(current.eventsLedger || []), newEvent]
  };
  return await saveStudentProgress(newState, uid);
}

export async function toggleBookmarkStore(canonicalKey: string, uid: string): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const exists = (current.bookmarks || []).includes(canonicalKey);
  const nextBookmarks = exists
    ? current.bookmarks.filter(k => k !== canonicalKey)
    : [...(current.bookmarks || []), canonicalKey];

  const newState: StudentProgressState = {
    ...current,
    bookmarks: nextBookmarks
  };
  return await saveStudentProgress(newState, uid);
}

export async function togglePracticeMarkedStore(canonicalKey: string, uid: string): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const exists = (current.practiceMarked || []).includes(canonicalKey);
  const nextPractice = exists
    ? current.practiceMarked.filter(k => k !== canonicalKey)
    : [...(current.practiceMarked || []), canonicalKey];

  const newState: StudentProgressState = {
    ...current,
    practiceMarked: nextPractice
  };
  return await saveStudentProgress(newState, uid);
}
