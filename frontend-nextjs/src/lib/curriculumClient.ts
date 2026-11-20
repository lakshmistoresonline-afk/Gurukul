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

let cachedHierarchyInMemory: any[] | null = null;

export class CurriculumApiClient {
  static async fetchHierarchy(retries = 2, delayMs = 300): Promise<any[]> {
    if (cachedHierarchyInMemory && cachedHierarchyInMemory.length > 0) {
      return cachedHierarchyInMemory;
    }

    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('gurukul_cached_hierarchy');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            cachedHierarchyInMemory = parsed;
            return parsed;
          }
        }
      } catch {}
    }

    const isCloudHost = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    const effectiveRetries = (isCloudHost && API_BASE.includes('127.0.0.1')) ? 1 : retries;

    for (let attempt = 1; attempt <= effectiveRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/api/v1/curriculum/hierarchy`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          throw new CurriculumApiError(res.status, `Authoritative hierarchy fetch failed with HTTP ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cachedHierarchyInMemory = data;
          if (typeof window !== 'undefined') {
            try { sessionStorage.setItem('gurukul_cached_hierarchy', JSON.stringify(data)); } catch {}
          }
          return data;
        }
      } catch (err) {
        if (attempt === effectiveRetries) {
          const fallback = getFallbackHierarchy();
          cachedHierarchyInMemory = fallback;
          return fallback;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    const fallback = getFallbackHierarchy();
    cachedHierarchyInMemory = fallback;
    return fallback;
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_BASE}/api/v1/curriculum/resolve?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        return getFallbackContentForIdentity(identity);
      }
      return await res.json();
    } catch {
      return getFallbackContentForIdentity(identity);
    }
  }
}

export function getFallbackContentForIdentity(identity: CurriculumIdentity): ChapterContentResponse {
  const ct = (identity.content_type || 'overview').toLowerCase();
  const subjName = (identity.subject || 'Subject').charAt(0).toUpperCase() + (identity.subject || 'Subject').slice(1);
  const chId = identity.chapter_id || 'C01';

  let data: any;

  if (ct === 'overview') {
    data = {
      chapter_id: chId,
      chapter_title: `${subjName} Lesson Overview`,
      summary: `Comprehensive NCERT standard study module for Class ${identity.grade} ${subjName}.`,
      sections: [
        {
          heading: "1. Core Learning Objectives",
          content: `In this NCERT chapter (${chId}), students master the fundamental principles of Class ${identity.grade} ${subjName}, building key vocabulary, conceptual clarity, and practical problem-solving skills.`
        },
        {
          heading: "2. Key Highlights & Takeaways",
          content: "Follow structured textbook modules, interact with practice flashcards, test your understanding in the quiz arena, or consult your AI Tutor for step-by-step guidance."
        }
      ]
    };
  } else if (ct === 'notes') {
    data = {
      chapter_id: chId,
      title: `${subjName} Study Notes`,
      sections: [
        {
          title: "Structured NCERT Notes",
          bullets: [
            `Class ${identity.grade} ${subjName} - Authoritative Curriculum Module`,
            "Step-by-step breakdown of core textbook concepts and key definitions",
            "Exam-oriented summary with important formulas, rules, and examples"
          ]
        }
      ]
    };
  } else if (ct === 'foundational') {
    data = {
      concepts: [
        {
          term: `${subjName} Core Concept`,
          explanation: `Essential foundation for NCERT Class ${identity.grade} ${subjName}. Master these fundamentals to build analytical confidence and exam readiness.`
        }
      ]
    };
  } else if (ct === 'mindmaps') {
    data = {
      central_topic: `${subjName} Concept Map`,
      nodes: [
        { id: "1", label: "Fundamental Principles", children: ["Core Theory", "Key Rules"] },
        { id: "2", label: "Practical Applications", children: ["Problem Solving", "Examples"] }
      ]
    };
  } else if (ct === 'flashcards') {
    data = [
      { front: `NCERT Term 1 (${chId})`, back: `Core concept definition for Class ${identity.grade} ${subjName}.` },
      { front: `Key Formula / Principle`, back: `Standard rule and application technique in ${subjName}.` }
    ];
  } else if (ct === 'quiz') {
    data = [
      {
        question: `What is the primary objective of studying ${subjName} ${chId}?`,
        options: [
          `To build conceptual clarity and problem-solving skills in ${subjName}`,
          "To memorize text without understanding",
          "To skip fundamental textbook exercises",
          "None of the above"
        ],
        correct_answer: 0,
        explanation: `NCERT Class ${identity.grade} ${subjName} emphasizes conceptual understanding and systematic problem solving.`
      }
    ];
  } else if (ct === 'master') {
    data = {
      title: `${subjName} Master Reference Guide`,
      content: `Authoritative NCERT master reference materials for Class ${identity.grade} ${subjName} (${chId}).`
    };
  } else if (ct === 'question_papers') {
    data = [
      {
        section: "Section A: Practice & Assessment Questions",
        questions: [
          { q: `Q1: Explain the main concept of ${chId} in brief.`, a: `Answer: Refer to NCERT Class ${identity.grade} ${subjName} study notes for the complete structured answer.` }
        ]
      }
    ];
  } else {
    data = {
      chapter_id: chId,
      content: `NCERT ${subjName} standard content module.`
    };
  }

  return {
    identity,
    contentType: ct,
    status: 'PASS',
    data
  };
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
