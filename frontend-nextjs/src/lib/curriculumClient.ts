export interface CurriculumIdentity {
  grade: string;
  subject: string;
  book: string;
  part: string;
  unit: string;
  chapter_id: string;
  content_type: string;
}

export interface ChapterContentResponse {
  identity: CurriculumIdentity;
  contentType: string;
  data: any;
  status: string;
}

export class CurriculumApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'CurriculumApiError';
    this.status = status;
    this.code = code;
  }
}

export function buildCurriculumUrl(identity: {
  grade: string | number;
  subject: string;
  book?: string;
  part?: string;
  unit?: string;
  chapter_id?: string;
  content_type?: string;
}): string {
  const params = new URLSearchParams();
  if (identity.grade !== undefined && identity.grade !== null) params.set('grade', String(identity.grade).trim());
  if (identity.subject) params.set('subject', String(identity.subject).trim().toLowerCase());
  if (identity.book) params.set('book', String(identity.book).trim());
  if (identity.part) params.set('part', String(identity.part).trim());
  if (identity.unit) params.set('unit', String(identity.unit).trim());
  if (identity.chapter_id) params.set('chapter_id', String(identity.chapter_id).trim());
  if (identity.content_type) params.set('content_type', String(identity.content_type).trim());
  return `/curriculum?${params.toString()}`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8001' : 'http://127.0.0.1:8001');

export class CurriculumApiClient {
  static async fetchHierarchy(retries = 8, delayMs = 1000): Promise<any[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/v1/curriculum/hierarchy`);
        if (!res.ok) {
          throw new CurriculumApiError(res.status, `Authoritative hierarchy fetch failed with HTTP ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        if (attempt === retries) {
          console.warn('Backend hierarchy unreachable, returning fallback hierarchy:', err);
          return getFallbackHierarchy();
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return getFallbackHierarchy();
  }

  static async fetchContent(identity: CurriculumIdentity): Promise<ChapterContentResponse> {
    const params = new URLSearchParams({
      grade: String(identity.grade || ''),
      subject: String(identity.subject || ''),
      book: String(identity.book || ''),
      part: String(identity.part || ''),
      unit: String(identity.unit || ''),
      chapter_id: String(identity.chapter_id || ''),
      content_type: String(identity.content_type || '')
    });

    const res = await fetch(`${API_BASE}/api/v1/curriculum/resolve?${params.toString()}`);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.detail?.error?.message || `Curriculum resolution failed with HTTP ${res.status}`;
      const code = errBody.detail?.error?.code;
      throw new CurriculumApiError(res.status, msg, code);
    }
    return res.json();
  }
}

export function getFallbackHierarchy(): any[] {
  const grades = ['5', '6', '7', '8', '9', '10'];
  return grades.map((g) => ({
    grade: g,
    subjects: [
      {
        subject: 'English',
        canonical_subject: 'english',
        books: [{
          book_id: 'english',
          part: 'main',
          units: [{
            unit: 'U01',
            chapters: Array.from({ length: 10 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-ENG-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: `English Chapter ${i + 1}`
            }))
          }]
        }]
      },
      {
        subject: 'Hindi',
        canonical_subject: 'hindi',
        books: [{
          book_id: 'hindi',
          part: 'main',
          units: [{
            unit: 'U01',
            chapters: Array.from({ length: 10 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-HIN-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: `Hindi Chapter ${i + 1}`
            }))
          }]
        }]
      },
      {
        subject: 'Mathematics',
        canonical_subject: 'mathematics',
        books: [
          {
            book_id: 'maths_i',
            book_title: 'Mathematics Part I',
            part: 'part1',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 7 }, (_, i) => ({
                chapter_number: i + 1,
                chapter_id: `G${g}-MAT-U01-C${String(i + 1).padStart(2, '0')}`,
                chapter_title: `Maths Part 1 Chapter ${i + 1}`
              }))
            }]
          },
          {
            book_id: 'maths_ii',
            book_title: 'Mathematics Part II',
            part: 'part2',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 7 }, (_, i) => ({
                chapter_number: i + 8,
                chapter_id: `G${g}-MAT-U01-C${String(i + 8).padStart(2, '0')}`,
                chapter_title: `Maths Part 2 Chapter ${i + 8}`
              }))
            }]
          }
        ]
      },
      {
        subject: 'Science',
        canonical_subject: 'science',
        books: [{
          book_id: 'science',
          part: 'main',
          units: [{
            unit: 'U01',
            chapters: Array.from({ length: 12 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-SCI-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: `Science Chapter ${i + 1}`
            }))
          }]
        }]
      },
      {
        subject: 'Social Science',
        canonical_subject: 'social_science',
        books: [
          {
            book_id: 'social_i',
            book_title: 'Social Science Part 1 (Geography)',
            part: 'part1',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 6 }, (_, i) => ({
                chapter_number: i + 1,
                chapter_id: `G${g}-SOC-U01-C${String(i + 1).padStart(2, '0')}`,
                chapter_title: `Social Science Part 1 Chapter ${i + 1}`
              }))
            }]
          },
          {
            book_id: 'social_ii',
            book_title: 'Social Science Part 2 (Civics & Economics)',
            part: 'part2',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 6 }, (_, i) => ({
                chapter_number: i + 7,
                chapter_id: `G${g}-SOC-U01-C${String(i + 7).padStart(2, '0')}`,
                chapter_title: `Social Science Part 2 Chapter ${i + 7}`
              }))
            }]
          },
          {
            book_id: 'social_iii',
            book_title: 'Social Science Part 3 (History)',
            part: 'part3',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 5 }, (_, i) => ({
                chapter_number: i + 13,
                chapter_id: `G${g}-SOC-U01-C${String(i + 13).padStart(2, '0')}`,
                chapter_title: `Social Science Part 3 Chapter ${i + 13}`
              }))
            }]
          }
        ]
      }
    ]
  }));
}

export async function getCurriculumHierarchy() {
  let hier: any[] = [];
  try {
    hier = await CurriculumApiClient.fetchHierarchy();
  } catch (err) {
    console.warn('Backend hierarchy fetch failed, using fallback hierarchy:', err);
    hier = getFallbackHierarchy();
  }

  if (!Array.isArray(hier) || hier.length === 0) {
    hier = getFallbackHierarchy();
  }

  const class10Exists = hier.some((h: any) => String(h.grade) === '10');
  if (!class10Exists) {
    const class9Data = hier.find((h: any) => String(h.grade) === '9') || hier[0];
    if (class9Data) {
      const class10Data = JSON.parse(JSON.stringify(class9Data));
      class10Data.grade = '10';
      (class10Data.subjects || []).forEach((subj: any) => {
        (subj.books || []).forEach((b: any) => {
          (b.units || []).forEach((u: any) => {
            (u.chapters || []).forEach((ch: any) => {
              ch.chapter_id = ch.chapter_id.replace('G9-', 'G10-').replace('G5-', 'G10-').replace('G6-', 'G10-').replace('G7-', 'G10-').replace('G8-', 'G10-');
            });
          });
        });
      });
      hier.push(class10Data);
    }
  }
  return hier;
}

export async function fetchSubjectMedia(subject: string, grade = '5') {
  try {
    const res = await fetch(`${API_BASE}/api/v1/curriculum/media?grade=${grade}&subject=${subject}`);
    if (!res.ok) return { media_directory: null, studio_video_links: null };
    return await res.json();
  } catch {
    return { media_directory: null, studio_video_links: null };
  }
}

export interface TutorChatPayload {
  grade: string;
  subject: string;
  book: string;
  part: string;
  unit: string;
  chapter_id: string;
  content_type?: string;
  question: string;
  action?: string;
}

export async function sendTutorChat(payload: TutorChatPayload): Promise<{ status: string; response: string; model?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return { status: 'OFFLINE', response: '⚠️ AI Tutor is currently offline. Ensure local Ollama engine is running on port 11434.' };
    }
    return await res.json();
  } catch {
    return { status: 'OFFLINE', response: '⚠️ AI Tutor is currently offline. Ensure local Ollama engine is running on port 11434.' };
  }
}
