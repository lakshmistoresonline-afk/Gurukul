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
          console.warn('Failed to fetch authoritative curriculum hierarchy after retries:', err);
          return [];
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return [];
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

export async function getCurriculumHierarchy() {
  return CurriculumApiClient.fetchHierarchy();
}
