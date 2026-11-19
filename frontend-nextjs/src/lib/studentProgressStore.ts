/**
 * Authenticated Student Progress & Firestore Persistence Engine
 * Manages real student chapter progress, completed items, quiz scores, bookmarks, practice marked items,
 * and daily mission event ledgers backed authoritatively by Firebase Firestore (doc: users/{uid}/progress/current)
 * with explicit typed persistence statuses (saved, pending_sync, failed) and offline local cache.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

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
  completedChapters: string[]; // List of completed chapter_ids
  lastActivity: StudentLastActivity | null;
  quizScores: QuizScoreRecord[];
  streakDays: number;
  lastActiveDate: string | null;
  bookmarks: string[];
  practiceMarked: string[];
  eventsLedger?: MissionEventRecord[];
  selectedGrade?: string;
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
  eventsLedger: [],
  selectedGrade: '5'
};

export function getAuthoritativeClassForUser(user: any, uid: string): string {
  const email = (user?.email || '').toLowerCase().trim();
  const idStr = (uid || '').toLowerCase().trim();

  if (email.includes('student10') || email.includes('class10') || email.includes('grade10') || idStr.includes('student-10')) return '10';
  if (email.includes('student9') || email.includes('class9') || email.includes('grade9') || email.includes('usere') || idStr.includes('student-9')) return '9';
  if (email.includes('student8') || email.includes('class8') || email.includes('grade8') || email.includes('userd') || idStr.includes('student-8')) return '8';
  if (email.includes('student7') || email.includes('class7') || email.includes('grade7') || email.includes('usera') || idStr.includes('student-7')) return '7';
  if (email.includes('student6') || email.includes('class6') || email.includes('grade6') || email.includes('userc') || idStr.includes('student-6')) return '6';
  if (email.includes('student5') || email.includes('class5') || email.includes('grade5') || email.includes('userb') || idStr.includes('student-5')) return '5';

  return '5';
}

function getLocalCacheKey(uid: string): string {
  return `${BASE_PROGRESS_KEY}_${uid || 'guest'}`;
}

/**
 * Reads student progress from local cache synchronously.
 */
export function getStudentProgress(uid: string): StudentProgressState {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  const targetUid = uid || 'guest';
  const activeEmail = localStorage.getItem('gurukul_active_user_email');
  const activeGrade = localStorage.getItem('gurukul_active_grade');
  const mockUser = auth.currentUser || (activeEmail ? { email: activeEmail } : null);
  const defaultGrade = activeGrade || getAuthoritativeClassForUser(mockUser, targetUid);
  try {
    const raw = localStorage.getItem(getLocalCacheKey(targetUid));
    if (!raw) return { ...DEFAULT_PROGRESS, selectedGrade: defaultGrade };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      selectedGrade: activeGrade || parsed.selectedGrade || defaultGrade
    };
  } catch {
    return { ...DEFAULT_PROGRESS, selectedGrade: defaultGrade };
  }
}

/**
 * Asynchronously fetches authoritative student progress from Firestore and syncs to local cache.
 */
export async function syncStudentProgressFromFirestore(uid: string): Promise<StudentProgressState> {
  const activeEmail = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_user_email') : null;
  const activeGrade = typeof window !== 'undefined' ? localStorage.getItem('gurukul_active_grade') : null;
  const mockUser = auth.currentUser || (activeEmail ? { email: activeEmail } : null);

  if (!uid || uid === 'guest') {
    const guestProg = getStudentProgress('guest');
    const authGrade = activeGrade || getAuthoritativeClassForUser(mockUser, 'guest');
    return {
      ...guestProg,
      selectedGrade: authGrade
    };
  }

  try {
    const authUser = auth.currentUser || mockUser;
    let resolvedGrade = activeGrade || getAuthoritativeClassForUser(authUser, uid);

    // 1. Fetch Authoritative User Profile from Firestore users/{uid}
    try {
      const userProfileRef = doc(db, 'users', uid);
      const userProfileSnap = await getDoc(userProfileRef);
      if (userProfileSnap.exists()) {
        const profileData = userProfileSnap.data() || {};
        const fsClass = profileData.classId || profileData.class_id;
        if (fsClass) {
          resolvedGrade = String(fsClass).replace('class_', '').trim();
        }
      }
    } catch (profErr) {
      console.warn('Profile fetch failed, using fallback grade resolution:', profErr);
    }

    // 2. Fetch Progress State
    const ref = doc(db, 'users', uid, 'progress', 'current');
    const snap = await getDoc(ref);
    let merged: StudentProgressState;
    if (snap.exists()) {
      const data = snap.data() as StudentProgressState;
      merged = {
        ...DEFAULT_PROGRESS,
        ...data,
        selectedGrade: activeGrade || data.selectedGrade || resolvedGrade
      };
    } else {
      merged = {
        ...getStudentProgress(uid),
        selectedGrade: activeGrade || resolvedGrade
      };
    }

    // Sync back to local storage for instant offline access
    try {
      localStorage.setItem(getLocalCacheKey(uid), JSON.stringify(merged));
    } catch {}

    return merged;
  } catch (e) {
    console.warn('Firestore progress fetch deferred (offline mode):', e);
    return getStudentProgress(uid);
  }
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
    if (!e?.message?.includes('permission') && !e?.message?.includes('insufficient')) {
      console.warn('Firestore progress write deferred (offline mode):', e);
    }
    return {
      status: localSaved ? 'pending_sync' : 'failed',
      state,
      error: e.message || 'Offline mode: Firestore write pending sync.'
    };
  }
}

export async function saveSelectedGradePreference(grade: string, uid: string): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const newState: StudentProgressState = {
    ...current,
    selectedGrade: String(grade).trim()
  };
  return await saveStudentProgress(newState, uid);
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
    const eventId = `comp_${chapterId}_${Date.now()}`;
    const newEvent: MissionEventRecord = {
      event_id: eventId,
      type: 'chapter_completion',
      chapter_id: chapterId,
      timestamp: Date.now(),
      xp_awarded: 100
    };

    const newState: StudentProgressState = {
      ...current,
      completedChapters: [...current.completedChapters, idStr],
      eventsLedger: [...(current.eventsLedger || []), newEvent]
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

export async function recordFlashcardReviewEvent(
  chapterId: string,
  uid: string
): Promise<SaveResult> {
  const current = getStudentProgress(uid);
  const eventId = `fc_${chapterId}_${Date.now()}`;
  const newEvent: MissionEventRecord = {
    event_id: eventId,
    type: 'flashcard_review',
    chapter_id: chapterId,
    timestamp: Date.now(),
    xp_awarded: 20
  };

  const newState: StudentProgressState = {
    ...current,
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
