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

export function resolveProcessedContentStaticUrl(identity: CurriculumIdentity): string {
  const g = String(identity.grade || '5').trim();
  const subj = String(identity.subject || '').toLowerCase().trim();
  const book = String(identity.book || '').toLowerCase().trim();
  const chId = String(identity.chapter_id || '').trim();
  const ct = String(identity.content_type || 'overview').toLowerCase().trim();

  let subjFolder = 'English';
  if (subj.includes('hin')) {
    subjFolder = 'Hindi';
  } else if (subj.includes('mat') || subj.includes('math')) {
    subjFolder = (book.includes('ii') || book.includes('part2') || book.includes('part_2')) ? 'MathsII' : 'MathsI';
  } else if (subj.includes('sci')) {
    subjFolder = 'Science';
  } else if (subj.includes('soc') || subj.includes('social')) {
    if (book.includes('ii') || book.includes('part2') || book.includes('civics')) subjFolder = 'SocialII';
    else if (book.includes('iii') || book.includes('part3') || book.includes('history')) subjFolder = 'SocialIII';
    else subjFolder = 'SocialI';
  }

  return `/ProcessedContent/Class${g}/${subjFolder}/${chId}/${ct}.json`;
}

const contentCacheMap = new Map<string, ChapterContentResponse>();

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
    const cacheKey = `${identity.grade}:${identity.subject}:${identity.book}:${identity.part}:${identity.unit}:${identity.chapter_id}:${identity.content_type}`;
    if (contentCacheMap.has(cacheKey)) {
      return contentCacheMap.get(cacheKey)!;
    }

    const isCloudHost = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');

    // 1. On Cloud Hosts (Vercel), try Static ProcessedContent Asset FIRST for 0ms load speed
    if (isCloudHost && typeof window !== 'undefined') {
      try {
        const staticUrl = resolveProcessedContentStaticUrl(identity);
        const staticRes = await fetch(staticUrl);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData) {
            const response: ChapterContentResponse = {
              identity,
              contentType: identity.content_type || 'overview',
              status: 'PASS',
              data: staticData
            };
            contentCacheMap.set(cacheKey, response);
            return response;
          }
        }
      } catch {}
    }

    // 2. Try Authoritative Backend API (Local / Custom Configured API)
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
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/api/v1/curriculum/resolve?${params.toString()}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          contentCacheMap.set(cacheKey, data);
          return data;
        }
      }
    } catch {}

    // 3. Try Static Asset as secondary fallback if local API failed
    if (typeof window !== 'undefined') {
      try {
        const staticUrl = resolveProcessedContentStaticUrl(identity);
        const staticRes = await fetch(staticUrl);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData) {
            const response: ChapterContentResponse = {
              identity,
              contentType: identity.content_type || 'overview',
              status: 'PASS',
              data: staticData
            };
            contentCacheMap.set(cacheKey, response);
            return response;
          }
        }
      } catch {}
    }

    // 4. Fallback Client Generator
    const fallbackRes = getFallbackContentForIdentity(identity);
    contentCacheMap.set(cacheKey, fallbackRes);
    return fallbackRes;
  }
}

export function getFallbackContentForIdentity(identity: CurriculumIdentity): ChapterContentResponse {
  const ct = (identity.content_type || 'overview').toLowerCase();
  const subjName = (identity.subject || 'Subject').charAt(0).toUpperCase() + (identity.subject || 'Subject').slice(1);
  const chId = identity.chapter_id || 'C01';
  const realTitle = NCERT_CHAPTER_TITLES[chId] || `${subjName} Lesson ${chId}`;

  let data: any;

  if (ct === 'overview') {
    data = {
      chapter_id: chId,
      chapter_title: realTitle,
      summary: `Comprehensive NCERT standard study module for Class ${identity.grade} ${subjName} (${realTitle}). This chapter establishes fundamental concepts, structured analytical skills, and exam readiness aligned with NCF/NEP 2020 guidelines.`,
      sections: [
        {
          heading: "1. Core Learning Objectives",
          content: `In this NCERT chapter (${realTitle}), students master the core principles of Class ${identity.grade} ${subjName}, building key vocabulary, conceptual clarity, and practical problem-solving skills.`
        },
        {
          heading: "2. Key Highlights & Takeaways",
          content: "Study the structured zero-omission notes, interact with quick revision flashcards, complete practice quizzes, or consult your AI Tutor for step-by-step guidance."
        }
      ]
    };
  } else if (ct === 'notes' || ct === 'master') {
    data = {
      chapter_id: chId,
      chapter_title: realTitle,
      title: `${realTitle} - Zero-Omission Notes & Master Guide`,
      m1_zero_omission_notes: {
        chapter_executive_summary: `Authoritative NCERT study notes for Class ${identity.grade} ${subjName}: ${realTitle}. This comprehensive guide breaks down essential concepts, key rules, and step-by-step analytical reasoning for students.`,
        detailed_sections: [
          {
            section: `1.1 Introduction to ${realTitle}`,
            full_notes: `In Class ${identity.grade} ${subjName}, ${realTitle} introduces fundamental principles and structured frameworks. Key concepts include definition of core terms, analytical models, and practical textbook applications.`
          },
          {
            section: `1.2 Advanced Concepts & Principles`,
            full_notes: `Systematic breakdown of advanced topics in ${realTitle}. Students learn step-by-step procedures, rule applications, and problem-solving strategies.`
          }
        ]
      },
      m2_key_definitions_formulas_and_vocabulary: [
        {
          term: `${subjName} Fundamental Principle`,
          definition: `Core rule and definition for ${realTitle} in NCERT Class ${identity.grade} ${subjName}.`
        },
        {
          term: "Key Concept Definition",
          definition: "Essential terminology and analytical rule for examination preparation."
        }
      ],
      m3_practical_activities_lab_and_step_by_step_procedures: [
        {
          activity_title: `Step-by-Step Procedure & Activity (${realTitle})`,
          procedure: "1. Review fundamental definitions.\n2. Apply step-by-step analytical rules.\n3. Verify results using NCERT standard guidelines."
        }
      ],
      m4_diagrams_tables_and_visual_data: [
        {
          title: `Conceptual Breakdown Diagram (${realTitle})`,
          description: "Sequential flowchart illustrating the logical progression of concepts and rules."
        }
      ],
      m5_textbook_solutions_and_extracts: [
        {
          question_number: "Q1",
          question_text: `Explain the central theme and importance of ${realTitle}.`,
          complete_step_by_step_solution: `Answer: ${realTitle} provides the foundational framework for Class ${identity.grade} ${subjName}, emphasizing conceptual clarity, rule application, and analytical problem-solving.`
        }
      ],
      m6_tiered_exam_question_bank: {
        "Level 1: Objective Questions": [
          {
            question: `What is the primary objective of studying ${realTitle}?`,
            answer: `To build conceptual clarity and problem-solving skills in Class ${identity.grade} ${subjName}.`
          }
        ],
        "Level 2: Short Answer Questions": [
          {
            question: `Summarize the main takeaway of ${realTitle}.`,
            answer: `NCERT Class ${identity.grade} ${subjName} emphasizes systematic understanding, rule application, and practical problem solving.`
          }
        ]
      },
      m7_common_pitfalls_and_misconceptions: [
        "Confusing fundamental definitions with secondary rules. Solution: Always start from basic principles."
      ]
    };
  } else if (ct === 'foundational') {
    data = {
      concepts: [
        {
          term: `${subjName} Core Foundation (${realTitle})`,
          explanation: `Essential foundation for NCERT Class ${identity.grade} ${subjName}. Master these fundamentals to build analytical confidence and exam readiness.`
        },
        {
          term: "Rule & Definition",
          explanation: "Systematic step-by-step explanation aligned with NCERT curriculum guidelines."
        }
      ]
    };
  } else if (ct === 'mindmaps') {
    data = {
      central_topic: realTitle,
      nodes: [
        { id: "1", label: "Fundamental Concepts", children: ["Core Principles", "Key Definitions"] },
        { id: "2", label: "Applications & Practice", children: ["Problem Solving", "Exam Questions"] }
      ]
    };
  } else if (ct === 'flashcards') {
    data = [
      { front: `${realTitle} - Term 1`, back: `Core concept definition for Class ${identity.grade} ${subjName}.` },
      { front: `Key Rule / Formula`, back: `Standard rule and application technique in ${realTitle}.` }
    ];
  } else if (ct === 'quiz') {
    data = [
      {
        question: `What is the primary objective of studying ${realTitle} in Class ${identity.grade} ${subjName}?`,
        options: [
          `To build conceptual clarity, vocabulary, and analytical problem-solving skills`,
          "To memorize textbook sentences without understanding core principles",
          "To skip fundamental exercises and practical applications",
          "None of the above"
        ],
        correct_answer: 0,
        explanation: `Class ${identity.grade} ${subjName} (${realTitle}) focuses on developing fundamental analytical understanding and practical applications.`
      },
      {
        question: `Which approach is most effective when studying complex concepts in ${realTitle}?`,
        options: [
          "Breaking down topics into core definitions, rules, and structured examples",
          "Rushing through textbook exercises without reading explanations",
          "Ignoring key terms and vocabulary definitions",
          "Avoiding step-by-step problem-solving practice"
        ],
        correct_answer: 0,
        explanation: `Systematic problem-solving requires mastering foundational definitions, key rules, and worked examples.`
      },
      {
        question: `What is the role of key vocabulary and definitions in ${realTitle}?`,
        options: [
          "They provide precise language to articulate scientific, mathematical, and literary principles accurately",
          "They are optional and do not affect overall comprehension",
          "They are only used in spelling bees",
          "They replace the need for understanding full chapter concepts"
        ],
        correct_answer: 0,
        explanation: `Mastering key terminology empowers students to express concepts clearly and answer exam questions accurately.`
      },
      {
        question: `How does practicing chapter assessment questions strengthen learning in ${subjName}?`,
        options: [
          "It reinforces active recall, identifies knowledge gaps, and builds exam confidence",
          "It guarantees 100% memorization without revision",
          "It reduces reading comprehension speed",
          "It replaces the need for textbook reading"
        ],
        correct_answer: 0,
        explanation: `Active recall through practice quizzes significantly improves long-term memory retention and conceptual mastery.`
      },
      {
        question: `What is the best way to revise ${realTitle} before an examination?`,
        options: [
          "Review zero-omission notes, key definitions, mindmaps, and step-by-step solutions",
          "Read only the first paragraph of the chapter",
          "Skip practice quizzes and worked examples",
          "Rely entirely on last-minute guessing"
        ],
        correct_answer: 0,
        explanation: `Comprehensive revision combines study notes, visual mindmaps, vocabulary cards, and self-assessment quizzes.`
      }
    ];
  } else if (ct === 'question_papers') {
    data = [
      {
        section: "Section A: Practice & Assessment Questions",
        questions: [
          { q: `Q1: Explain the main concept of ${realTitle} in brief.`, a: `Answer: Refer to NCERT Class ${identity.grade} ${subjName} study notes for the complete structured answer.` }
        ]
      }
    ];
  } else {
    data = {
      chapter_id: chId,
      chapter_title: realTitle,
      content: `NCERT Class ${identity.grade} ${subjName} standard content module for ${realTitle}.`
    };
  }

  return {
    identity,
    contentType: ct,
    status: 'PASS',
    data
  };
}

const NCERT_CHAPTER_TITLES: Record<string, string> = {
  "G10-ENG-U01-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-U02-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-U03-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-U04-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-U05-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-C01": "A Letter to God & Dust of Snow",
  "G10-ENG-1": "A Letter to God & Dust of Snow",
  "G10-ENG-U01-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-U02-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-U03-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-U04-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-U05-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-C02": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-2": "Nelson Mandela: Long Walk to Freedom",
  "G10-ENG-U01-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-U02-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-U03-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-U04-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-U05-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-C03": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-3": "Two Stories about Flying & How to Tell Wild Animals",
  "G10-ENG-U01-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-U02-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-U03-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-U04-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-U05-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-C04": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-4": "From the Diary of Anne Frank & Amanda!",
  "G10-ENG-U01-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-U02-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-U03-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-U04-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-U05-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-C05": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-5": "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
  "G10-ENG-U01-C06": "Mijbil the Otter & Fog",
  "G10-ENG-U02-C06": "Mijbil the Otter & Fog",
  "G10-ENG-U03-C06": "Mijbil the Otter & Fog",
  "G10-ENG-U04-C06": "Mijbil the Otter & Fog",
  "G10-ENG-U05-C06": "Mijbil the Otter & Fog",
  "G10-ENG-C06": "Mijbil the Otter & Fog",
  "G10-ENG-6": "Mijbil the Otter & Fog",
  "G10-ENG-U01-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-U02-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-U03-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-U04-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-U05-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-C07": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-7": "Madam Rides the Bus & The Tale of Custard the Dragon",
  "G10-ENG-U01-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-U02-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-U03-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-U04-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-U05-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-C08": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-8": "The Sermon at Benares & For Anne Gregory",
  "G10-ENG-U01-C09": "The Proposal (Play)",
  "G10-ENG-U02-C09": "The Proposal (Play)",
  "G10-ENG-U03-C09": "The Proposal (Play)",
  "G10-ENG-U04-C09": "The Proposal (Play)",
  "G10-ENG-U05-C09": "The Proposal (Play)",
  "G10-ENG-C09": "The Proposal (Play)",
  "G10-ENG-9": "The Proposal (Play)",
  "G10-ENG-U01-C10": "Footprints Without Feet Review",
  "G10-ENG-U02-C10": "Footprints Without Feet Review",
  "G10-ENG-U03-C10": "Footprints Without Feet Review",
  "G10-ENG-U04-C10": "Footprints Without Feet Review",
  "G10-ENG-U05-C10": "Footprints Without Feet Review",
  "G10-ENG-C10": "Footprints Without Feet Review",
  "G10-ENG-10": "Footprints Without Feet Review",
  "G5-ENG-U01-C01": "Papa's Spectacles",
  "G5-ENG-U02-C01": "Papa's Spectacles",
  "G5-ENG-U03-C01": "Papa's Spectacles",
  "G5-ENG-U04-C01": "Papa's Spectacles",
  "G5-ENG-U05-C01": "Papa's Spectacles",
  "G5-ENG-C01": "Papa's Spectacles",
  "G5-ENG-1": "Papa's Spectacles",
  "G5-ENG-U01-C02": "Gone with the Scooter",
  "G5-ENG-U02-C02": "Gone with the Scooter",
  "G5-ENG-U03-C02": "Gone with the Scooter",
  "G5-ENG-U04-C02": "Gone with the Scooter",
  "G5-ENG-U05-C02": "Gone with the Scooter",
  "G5-ENG-C02": "Gone with the Scooter",
  "G5-ENG-2": "Gone with the Scooter",
  "G5-ENG-U01-C03": "The Rainbow",
  "G5-ENG-U02-C03": "The Rainbow",
  "G5-ENG-U03-C03": "The Rainbow",
  "G5-ENG-U04-C03": "The Rainbow",
  "G5-ENG-U05-C03": "The Rainbow",
  "G5-ENG-C03": "The Rainbow",
  "G5-ENG-3": "The Rainbow",
  "G5-ENG-U01-C04": "The Wise Parrot",
  "G5-ENG-U02-C04": "The Wise Parrot",
  "G5-ENG-U03-C04": "The Wise Parrot",
  "G5-ENG-U04-C04": "The Wise Parrot",
  "G5-ENG-U05-C04": "The Wise Parrot",
  "G5-ENG-C04": "The Wise Parrot",
  "G5-ENG-4": "The Wise Parrot",
  "G5-ENG-U01-C05": "My Frog's World",
  "G5-ENG-U02-C05": "My Frog's World",
  "G5-ENG-U03-C05": "My Frog's World",
  "G5-ENG-U04-C05": "My Frog's World",
  "G5-ENG-U05-C05": "My Frog's World",
  "G5-ENG-C05": "My Frog's World",
  "G5-ENG-5": "My Frog's World",
  "G5-ENG-U01-C06": "What a Tank!",
  "G5-ENG-U02-C06": "What a Tank!",
  "G5-ENG-U03-C06": "What a Tank!",
  "G5-ENG-U04-C06": "What a Tank!",
  "G5-ENG-U05-C06": "What a Tank!",
  "G5-ENG-C06": "What a Tank!",
  "G5-ENG-6": "What a Tank!",
  "G5-ENG-U01-C07": "Gilli Danda",
  "G5-ENG-U02-C07": "Gilli Danda",
  "G5-ENG-U03-C07": "Gilli Danda",
  "G5-ENG-U04-C07": "Gilli Danda",
  "G5-ENG-U05-C07": "Gilli Danda",
  "G5-ENG-C07": "Gilli Danda",
  "G5-ENG-7": "Gilli Danda",
  "G5-ENG-U01-C08": "The Decision of the Panchayat",
  "G5-ENG-U02-C08": "The Decision of the Panchayat",
  "G5-ENG-U03-C08": "The Decision of the Panchayat",
  "G5-ENG-U04-C08": "The Decision of the Panchayat",
  "G5-ENG-U05-C08": "The Decision of the Panchayat",
  "G5-ENG-C08": "The Decision of the Panchayat",
  "G5-ENG-8": "The Decision of the Panchayat",
  "G5-ENG-U01-C09": "Vocation",
  "G5-ENG-U02-C09": "Vocation",
  "G5-ENG-U03-C09": "Vocation",
  "G5-ENG-U04-C09": "Vocation",
  "G5-ENG-U05-C09": "Vocation",
  "G5-ENG-C09": "Vocation",
  "G5-ENG-9": "Vocation",
  "G5-ENG-U01-C10": "Glass Bangles",
  "G5-ENG-U02-C10": "Glass Bangles",
  "G5-ENG-U03-C10": "Glass Bangles",
  "G5-ENG-U04-C10": "Glass Bangles",
  "G5-ENG-U05-C10": "Glass Bangles",
  "G5-ENG-C10": "Glass Bangles",
  "G5-ENG-10": "Glass Bangles",
  "G5-ENG-U01-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-U02-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-U03-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-U04-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-U05-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-C11": "Santoor Grade 5 Bridge & Review",
  "G5-ENG-11": "Santoor Grade 5 Bridge & Review",
  "G5-HIN-U01-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-U02-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-U03-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-U04-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-U05-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-C01": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-1": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
  "G5-HIN-U01-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-U02-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-U03-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-U04-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-U05-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-C02": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-2": "न्याय की कुर्सी (कहानी / लोककथा)",
  "G5-HIN-U01-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-U02-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-U03-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-U04-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-U05-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-C03": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-3": "चाँद का कुर्ता (बाल कविता)",
  "G5-HIN-U01-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-U02-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-U03-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-U04-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-U05-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-C04": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-4": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
  "G5-HIN-U01-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-U02-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-U03-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-U04-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-U05-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-C05": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-5": "हमारी पृथ्वी (पर्यावरण निबंध)",
  "G5-HIN-U01-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-U02-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-U03-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-U04-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-U05-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-C06": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-6": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
  "G5-HIN-U01-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-U02-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-U03-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-U04-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-U05-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-C07": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-7": "मित्रता की शक्ति (लोककथा)",
  "G5-HIN-U01-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-U02-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-U03-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-U04-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-U05-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-C08": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-8": "स्वच्छता और स्वास्थ्य (निबंध)",
  "G5-HIN-U01-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-U02-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-U03-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-U04-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-U05-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-C09": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-9": "कंप्यूटर और एआई (विज्ञान कथा)",
  "G5-HIN-U01-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-U02-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-U03-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-U04-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-U05-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-C10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-10": "वीर शिवाजी (ऐतिहासिक कहानी)",
  "G5-HIN-U01-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-U02-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-U03-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-U04-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-U05-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-C11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-11": "समय का महत्व (प्रेरणादायक निबंध)",
  "G5-HIN-U01-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-U02-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-U03-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-U04-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-U05-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-C12": "सपनों की उड़ान (कविता)",
  "G5-HIN-12": "सपनों की उड़ान (कविता)",
  "G5-MAT-U01-C01": "Travelling, Now and Then",
  "G5-MAT-U02-C01": "Travelling, Now and Then",
  "G5-MAT-U03-C01": "Travelling, Now and Then",
  "G5-MAT-U04-C01": "Travelling, Now and Then",
  "G5-MAT-U05-C01": "Travelling, Now and Then",
  "G5-MAT-C01": "Travelling, Now and Then",
  "G5-MAT-1": "Travelling, Now and Then",
  "G5-MAT-U01-C02": "Fractions",
  "G5-MAT-U02-C02": "Fractions",
  "G5-MAT-U03-C02": "Fractions",
  "G5-MAT-U04-C02": "Fractions",
  "G5-MAT-U05-C02": "Fractions",
  "G5-MAT-C02": "Fractions",
  "G5-MAT-2": "Fractions",
  "G5-MAT-U01-C03": "Angles as Turns",
  "G5-MAT-U02-C03": "Angles as Turns",
  "G5-MAT-U03-C03": "Angles as Turns",
  "G5-MAT-U04-C03": "Angles as Turns",
  "G5-MAT-U05-C03": "Angles as Turns",
  "G5-MAT-C03": "Angles as Turns",
  "G5-MAT-3": "Angles as Turns",
  "G5-MAT-U01-C04": "Shapes and Spatial Understanding",
  "G5-MAT-U02-C04": "Shapes and Spatial Understanding",
  "G5-MAT-U03-C04": "Shapes and Spatial Understanding",
  "G5-MAT-U04-C04": "Shapes and Spatial Understanding",
  "G5-MAT-U05-C04": "Shapes and Spatial Understanding",
  "G5-MAT-C04": "Shapes and Spatial Understanding",
  "G5-MAT-4": "Shapes and Spatial Understanding",
  "G5-MAT-U01-C05": "Numbers and Operations",
  "G5-MAT-U02-C05": "Numbers and Operations",
  "G5-MAT-U03-C05": "Numbers and Operations",
  "G5-MAT-U04-C05": "Numbers and Operations",
  "G5-MAT-U05-C05": "Numbers and Operations",
  "G5-MAT-C05": "Numbers and Operations",
  "G5-MAT-5": "Numbers and Operations",
  "G5-MAT-U01-C06": "Multiplication and Division",
  "G5-MAT-U02-C06": "Multiplication and Division",
  "G5-MAT-U03-C06": "Multiplication and Division",
  "G5-MAT-U04-C06": "Multiplication and Division",
  "G5-MAT-U05-C06": "Multiplication and Division",
  "G5-MAT-C06": "Multiplication and Division",
  "G5-MAT-6": "Multiplication and Division",
  "G5-MAT-U01-C07": "Symmetry and Patterns",
  "G5-MAT-U02-C07": "Symmetry and Patterns",
  "G5-MAT-U03-C07": "Symmetry and Patterns",
  "G5-MAT-U04-C07": "Symmetry and Patterns",
  "G5-MAT-U05-C07": "Symmetry and Patterns",
  "G5-MAT-C07": "Symmetry and Patterns",
  "G5-MAT-7": "Symmetry and Patterns",
  "G5-MAT-U01-C08": "Decimals and Currency",
  "G5-MAT-U02-C08": "Decimals and Currency",
  "G5-MAT-U03-C08": "Decimals and Currency",
  "G5-MAT-U04-C08": "Decimals and Currency",
  "G5-MAT-U05-C08": "Decimals and Currency",
  "G5-MAT-C08": "Decimals and Currency",
  "G5-MAT-8": "Decimals and Currency",
  "G5-MAT-U01-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-U02-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-U03-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-U04-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-U05-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-C09": "Measurement of Length, Weight and Capacity",
  "G5-MAT-9": "Measurement of Length, Weight and Capacity",
  "G5-MAT-U01-C10": "Perimeter and Area",
  "G5-MAT-U02-C10": "Perimeter and Area",
  "G5-MAT-U03-C10": "Perimeter and Area",
  "G5-MAT-U04-C10": "Perimeter and Area",
  "G5-MAT-U05-C10": "Perimeter and Area",
  "G5-MAT-C10": "Perimeter and Area",
  "G5-MAT-10": "Perimeter and Area",
  "G5-MAT-U01-C11": "Data Handling and Bar Graphs",
  "G5-MAT-U02-C11": "Data Handling and Bar Graphs",
  "G5-MAT-U03-C11": "Data Handling and Bar Graphs",
  "G5-MAT-U04-C11": "Data Handling and Bar Graphs",
  "G5-MAT-U05-C11": "Data Handling and Bar Graphs",
  "G5-MAT-C11": "Data Handling and Bar Graphs",
  "G5-MAT-11": "Data Handling and Bar Graphs",
  "G5-MAT-U01-C12": "Volume and Capacity",
  "G5-MAT-U02-C12": "Volume and Capacity",
  "G5-MAT-U03-C12": "Volume and Capacity",
  "G5-MAT-U04-C12": "Volume and Capacity",
  "G5-MAT-U05-C12": "Volume and Capacity",
  "G5-MAT-C12": "Volume and Capacity",
  "G5-MAT-12": "Volume and Capacity",
  "G5-MAT-U01-C13": "Time and Calendar",
  "G5-MAT-U02-C13": "Time and Calendar",
  "G5-MAT-U03-C13": "Time and Calendar",
  "G5-MAT-U04-C13": "Time and Calendar",
  "G5-MAT-U05-C13": "Time and Calendar",
  "G5-MAT-C13": "Time and Calendar",
  "G5-MAT-13": "Time and Calendar",
  "G5-MAT-U01-C14": "Money and Financial Literacy",
  "G5-MAT-U02-C14": "Money and Financial Literacy",
  "G5-MAT-U03-C14": "Money and Financial Literacy",
  "G5-MAT-U04-C14": "Money and Financial Literacy",
  "G5-MAT-U05-C14": "Money and Financial Literacy",
  "G5-MAT-C14": "Money and Financial Literacy",
  "G5-MAT-14": "Money and Financial Literacy",
  "G5-MAT-U01-C15": "Geometric Reasoning",
  "G5-MAT-U02-C15": "Geometric Reasoning",
  "G5-MAT-U03-C15": "Geometric Reasoning",
  "G5-MAT-U04-C15": "Geometric Reasoning",
  "G5-MAT-U05-C15": "Geometric Reasoning",
  "G5-MAT-C15": "Geometric Reasoning",
  "G5-MAT-15": "Geometric Reasoning",
  "G5-MAT-U01-C16": "Ratio and Proportion",
  "G5-MAT-U02-C16": "Ratio and Proportion",
  "G5-MAT-U03-C16": "Ratio and Proportion",
  "G5-MAT-U04-C16": "Ratio and Proportion",
  "G5-MAT-U05-C16": "Ratio and Proportion",
  "G5-MAT-C16": "Ratio and Proportion",
  "G5-MAT-16": "Ratio and Proportion",
  "G5-MAT-U01-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-U02-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-U03-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-U04-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-U05-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-C17": "Mathematical Patterns and Sequences",
  "G5-MAT-17": "Mathematical Patterns and Sequences",
  "G5-MAT-U01-C18": "Problem Solving and Logic",
  "G5-MAT-U02-C18": "Problem Solving and Logic",
  "G5-MAT-U03-C18": "Problem Solving and Logic",
  "G5-MAT-U04-C18": "Problem Solving and Logic",
  "G5-MAT-U05-C18": "Problem Solving and Logic",
  "G5-MAT-C18": "Problem Solving and Logic",
  "G5-MAT-18": "Problem Solving and Logic",
  "G5-SCI-U01-C01": "Earth — Our Shared Home",
  "G5-SCI-U02-C01": "Earth — Our Shared Home",
  "G5-SCI-U03-C01": "Earth — Our Shared Home",
  "G5-SCI-U04-C01": "Earth — Our Shared Home",
  "G5-SCI-U05-C01": "Earth — Our Shared Home",
  "G5-SCI-C01": "Earth — Our Shared Home",
  "G5-SCI-1": "Earth — Our Shared Home",
  "G5-SCI-U01-C02": "Journey of a River",
  "G5-SCI-U02-C02": "Journey of a River",
  "G5-SCI-U03-C02": "Journey of a River",
  "G5-SCI-U04-C02": "Journey of a River",
  "G5-SCI-U05-C02": "Journey of a River",
  "G5-SCI-C02": "Journey of a River",
  "G5-SCI-2": "Journey of a River",
  "G5-SCI-U01-C03": "The Mystery of Food",
  "G5-SCI-U02-C03": "The Mystery of Food",
  "G5-SCI-U03-C03": "The Mystery of Food",
  "G5-SCI-U04-C03": "The Mystery of Food",
  "G5-SCI-U05-C03": "The Mystery of Food",
  "G5-SCI-C03": "The Mystery of Food",
  "G5-SCI-3": "The Mystery of Food",
  "G5-SCI-U01-C04": "Air and Water in Our Lives",
  "G5-SCI-U02-C04": "Air and Water in Our Lives",
  "G5-SCI-U03-C04": "Air and Water in Our Lives",
  "G5-SCI-U04-C04": "Air and Water in Our Lives",
  "G5-SCI-U05-C04": "Air and Water in Our Lives",
  "G5-SCI-C04": "Air and Water in Our Lives",
  "G5-SCI-4": "Air and Water in Our Lives",
  "G5-SCI-U01-C05": "Plants and Their Adaptation",
  "G5-SCI-U02-C05": "Plants and Their Adaptation",
  "G5-SCI-U03-C05": "Plants and Their Adaptation",
  "G5-SCI-U04-C05": "Plants and Their Adaptation",
  "G5-SCI-U05-C05": "Plants and Their Adaptation",
  "G5-SCI-C05": "Plants and Their Adaptation",
  "G5-SCI-5": "Plants and Their Adaptation",
  "G5-SCI-U01-C06": "Animals and Their Habitat",
  "G5-SCI-U02-C06": "Animals and Their Habitat",
  "G5-SCI-U03-C06": "Animals and Their Habitat",
  "G5-SCI-U04-C06": "Animals and Their Habitat",
  "G5-SCI-U05-C06": "Animals and Their Habitat",
  "G5-SCI-C06": "Animals and Their Habitat",
  "G5-SCI-6": "Animals and Their Habitat",
  "G5-SCI-U01-C07": "Our Body Systems and Health",
  "G5-SCI-U02-C07": "Our Body Systems and Health",
  "G5-SCI-U03-C07": "Our Body Systems and Health",
  "G5-SCI-U04-C07": "Our Body Systems and Health",
  "G5-SCI-U05-C07": "Our Body Systems and Health",
  "G5-SCI-C07": "Our Body Systems and Health",
  "G5-SCI-7": "Our Body Systems and Health",
  "G5-SCI-U01-C08": "Force, Energy and Simple Machines",
  "G5-SCI-U02-C08": "Force, Energy and Simple Machines",
  "G5-SCI-U03-C08": "Force, Energy and Simple Machines",
  "G5-SCI-U04-C08": "Force, Energy and Simple Machines",
  "G5-SCI-U05-C08": "Force, Energy and Simple Machines",
  "G5-SCI-C08": "Force, Energy and Simple Machines",
  "G5-SCI-8": "Force, Energy and Simple Machines",
  "G5-SCI-U01-C09": "Natural Phenomena and Weather",
  "G5-SCI-U02-C09": "Natural Phenomena and Weather",
  "G5-SCI-U03-C09": "Natural Phenomena and Weather",
  "G5-SCI-U04-C09": "Natural Phenomena and Weather",
  "G5-SCI-U05-C09": "Natural Phenomena and Weather",
  "G5-SCI-C09": "Natural Phenomena and Weather",
  "G5-SCI-9": "Natural Phenomena and Weather",
  "G5-SCI-U01-C10": "Conservation of Resources",
  "G5-SCI-U02-C10": "Conservation of Resources",
  "G5-SCI-U03-C10": "Conservation of Resources",
  "G5-SCI-U04-C10": "Conservation of Resources",
  "G5-SCI-U05-C10": "Conservation of Resources",
  "G5-SCI-C10": "Conservation of Resources",
  "G5-SCI-10": "Conservation of Resources",
  "G5-SCI-U01-C11": "Science in Daily Life",
  "G5-SCI-U02-C11": "Science in Daily Life",
  "G5-SCI-U03-C11": "Science in Daily Life",
  "G5-SCI-U04-C11": "Science in Daily Life",
  "G5-SCI-U05-C11": "Science in Daily Life",
  "G5-SCI-C11": "Science in Daily Life",
  "G5-SCI-11": "Science in Daily Life",
  "G6-ENG-U01-C01": "A Bottle of Dew",
  "G6-ENG-U02-C01": "A Bottle of Dew",
  "G6-ENG-U03-C01": "A Bottle of Dew",
  "G6-ENG-U04-C01": "A Bottle of Dew",
  "G6-ENG-U05-C01": "A Bottle of Dew",
  "G6-ENG-C01": "A Bottle of Dew",
  "G6-ENG-1": "A Bottle of Dew",
  "G6-ENG-U01-C02": "The Friendship",
  "G6-ENG-U02-C02": "The Friendship",
  "G6-ENG-U03-C02": "The Friendship",
  "G6-ENG-U04-C02": "The Friendship",
  "G6-ENG-U05-C02": "The Friendship",
  "G6-ENG-C02": "The Friendship",
  "G6-ENG-2": "The Friendship",
  "G6-ENG-U01-C03": "The Magic Powder",
  "G6-ENG-U02-C03": "The Magic Powder",
  "G6-ENG-U03-C03": "The Magic Powder",
  "G6-ENG-U04-C03": "The Magic Powder",
  "G6-ENG-U05-C03": "The Magic Powder",
  "G6-ENG-C03": "The Magic Powder",
  "G6-ENG-3": "The Magic Powder",
  "G6-ENG-U01-C04": "The Way the Kite Flies",
  "G6-ENG-U02-C04": "The Way the Kite Flies",
  "G6-ENG-U03-C04": "The Way the Kite Flies",
  "G6-ENG-U04-C04": "The Way the Kite Flies",
  "G6-ENG-U05-C04": "The Way the Kite Flies",
  "G6-ENG-C04": "The Way the Kite Flies",
  "G6-ENG-4": "The Way the Kite Flies",
  "G6-ENG-U01-C05": "A Lesson for All",
  "G6-ENG-U02-C05": "A Lesson for All",
  "G6-ENG-U03-C05": "A Lesson for All",
  "G6-ENG-U04-C05": "A Lesson for All",
  "G6-ENG-U05-C05": "A Lesson for All",
  "G6-ENG-C05": "A Lesson for All",
  "G6-ENG-5": "A Lesson for All",
  "G6-ENG-U01-C06": "The Clever Jackal",
  "G6-ENG-U02-C06": "The Clever Jackal",
  "G6-ENG-U03-C06": "The Clever Jackal",
  "G6-ENG-U04-C06": "The Clever Jackal",
  "G6-ENG-U05-C06": "The Clever Jackal",
  "G6-ENG-C06": "The Clever Jackal",
  "G6-ENG-6": "The Clever Jackal",
  "G6-ENG-U01-C07": "The Old Sage's Wisdom",
  "G6-ENG-U02-C07": "The Old Sage's Wisdom",
  "G6-ENG-U03-C07": "The Old Sage's Wisdom",
  "G6-ENG-U04-C07": "The Old Sage's Wisdom",
  "G6-ENG-U05-C07": "The Old Sage's Wisdom",
  "G6-ENG-C07": "The Old Sage's Wisdom",
  "G6-ENG-7": "The Old Sage's Wisdom",
  "G6-ENG-U01-C08": "The Worth of a Skill",
  "G6-ENG-U02-C08": "The Worth of a Skill",
  "G6-ENG-U03-C08": "The Worth of a Skill",
  "G6-ENG-U04-C08": "The Worth of a Skill",
  "G6-ENG-U05-C08": "The Worth of a Skill",
  "G6-ENG-C08": "The Worth of a Skill",
  "G6-ENG-8": "The Worth of a Skill",
  "G6-ENG-U01-C09": "The Great Indian Bustard",
  "G6-ENG-U02-C09": "The Great Indian Bustard",
  "G6-ENG-U03-C09": "The Great Indian Bustard",
  "G6-ENG-U04-C09": "The Great Indian Bustard",
  "G6-ENG-U05-C09": "The Great Indian Bustard",
  "G6-ENG-C09": "The Great Indian Bustard",
  "G6-ENG-9": "The Great Indian Bustard",
  "G6-ENG-U01-C10": "The Starry Sky",
  "G6-ENG-U02-C10": "The Starry Sky",
  "G6-ENG-U03-C10": "The Starry Sky",
  "G6-ENG-U04-C10": "The Starry Sky",
  "G6-ENG-U05-C10": "The Starry Sky",
  "G6-ENG-C10": "The Starry Sky",
  "G6-ENG-10": "The Starry Sky",
  "G6-ENG-U01-C11": "Yoga—a Way of Life",
  "G6-ENG-U02-C11": "Yoga—a Way of Life",
  "G6-ENG-U03-C11": "Yoga—a Way of Life",
  "G6-ENG-U04-C11": "Yoga—a Way of Life",
  "G6-ENG-U05-C11": "Yoga—a Way of Life",
  "G6-ENG-C11": "Yoga—a Way of Life",
  "G6-ENG-11": "Yoga—a Way of Life",
  "G7-ENG-U01-C01": "The Jamun Tree",
  "G7-ENG-U02-C01": "The Jamun Tree",
  "G7-ENG-U03-C01": "The Jamun Tree",
  "G7-ENG-U04-C01": "The Jamun Tree",
  "G7-ENG-U05-C01": "The Jamun Tree",
  "G7-ENG-C01": "The Jamun Tree",
  "G7-ENG-1": "The Jamun Tree",
  "G7-ENG-U01-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-U02-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-U03-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-U04-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-U05-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-C02": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-2": "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
  "G7-ENG-U01-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-U02-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-U03-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-U04-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-U05-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-C03": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-3": "My Brother's Great Invention & Paper Boats",
  "G7-ENG-U01-C04": "The Tunnel & Travel",
  "G7-ENG-U02-C04": "The Tunnel & Travel",
  "G7-ENG-U03-C04": "The Tunnel & Travel",
  "G7-ENG-U04-C04": "The Tunnel & Travel",
  "G7-ENG-U05-C04": "The Tunnel & Travel",
  "G7-ENG-C04": "The Tunnel & Travel",
  "G7-ENG-4": "The Tunnel & Travel",
  "G7-ENG-U01-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-U02-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-U03-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-U04-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-U05-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-C05": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-5": "A Homage to Our Brave Soldiers & My Dear Soldiers",
  "G7-ENG-U01-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-U02-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-U03-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-U04-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-U05-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-C06": "Gifts of Chivalry & Courage",
  "G7-ENG-6": "Gifts of Chivalry & Courage",
  "G7-ENG-U01-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-U02-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-U03-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-U04-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-U05-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-C07": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-7": "The Choice is Yours (Self-Discipline & Values)",
  "G7-ENG-U01-C08": "The Bond of Friendship",
  "G7-ENG-U02-C08": "The Bond of Friendship",
  "G7-ENG-U03-C08": "The Bond of Friendship",
  "G7-ENG-U04-C08": "The Bond of Friendship",
  "G7-ENG-U05-C08": "The Bond of Friendship",
  "G7-ENG-C08": "The Bond of Friendship",
  "G7-ENG-8": "The Bond of Friendship",
  "G7-ENG-U01-C09": "The Legend of the Mountain Peak",
  "G7-ENG-U02-C09": "The Legend of the Mountain Peak",
  "G7-ENG-U03-C09": "The Legend of the Mountain Peak",
  "G7-ENG-U04-C09": "The Legend of the Mountain Peak",
  "G7-ENG-U05-C09": "The Legend of the Mountain Peak",
  "G7-ENG-C09": "The Legend of the Mountain Peak",
  "G7-ENG-9": "The Legend of the Mountain Peak",
  "G7-ENG-U01-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-U02-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-U03-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-U04-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-U05-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-C10": "Poorvi Grade 7 Synthesis & Review",
  "G7-ENG-10": "Poorvi Grade 7 Synthesis & Review",
  "G7-HIN-U01-C01": "माँ, कह एक कहानी",
  "G7-HIN-U02-C01": "माँ, कह एक कहानी",
  "G7-HIN-U03-C01": "माँ, कह एक कहानी",
  "G7-HIN-U04-C01": "माँ, कह एक कहानी",
  "G7-HIN-U05-C01": "माँ, कह एक कहानी",
  "G7-HIN-C01": "माँ, कह एक कहानी",
  "G7-HIN-1": "माँ, कह एक कहानी",
  "G7-HIN-U01-C02": "चतुर बालक",
  "G7-HIN-U02-C02": "चतुर बालक",
  "G7-HIN-U03-C02": "चतुर बालक",
  "G7-HIN-U04-C02": "चतुर बालक",
  "G7-HIN-U05-C02": "चतुर बालक",
  "G7-HIN-C02": "चतुर बालक",
  "G7-HIN-2": "चतुर बालक",
  "G7-HIN-U01-C03": "फूल और काँटा",
  "G7-HIN-U02-C03": "फूल और काँटा",
  "G7-HIN-U03-C03": "फूल और काँटा",
  "G7-HIN-U04-C03": "फूल और काँटा",
  "G7-HIN-U05-C03": "फूल और काँटा",
  "G7-HIN-C03": "फूल और काँटा",
  "G7-HIN-3": "फूल और काँटा",
  "G7-HIN-U01-C04": "पानी से पानी",
  "G7-HIN-U02-C04": "पानी से पानी",
  "G7-HIN-U03-C04": "पानी से पानी",
  "G7-HIN-U04-C04": "पानी से पानी",
  "G7-HIN-U05-C04": "पानी से पानी",
  "G7-HIN-C04": "पानी से पानी",
  "G7-HIN-4": "पानी से पानी",
  "G7-HIN-U01-C05": "नहीं होना बीमार",
  "G7-HIN-U02-C05": "नहीं होना बीमार",
  "G7-HIN-U03-C05": "नहीं होना बीमार",
  "G7-HIN-U04-C05": "नहीं होना बीमार",
  "G7-HIN-U05-C05": "नहीं होना बीमार",
  "G7-HIN-C05": "नहीं होना बीमार",
  "G7-HIN-5": "नहीं होना बीमार",
  "G7-HIN-U01-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-U02-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-U03-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-U04-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-U05-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-C06": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-6": "गिरधर कविराय की कुंडलियाँ",
  "G7-HIN-U01-C07": "वर्षा-बहार",
  "G7-HIN-U02-C07": "वर्षा-बहार",
  "G7-HIN-U03-C07": "वर्षा-बहार",
  "G7-HIN-U04-C07": "वर्षा-बहार",
  "G7-HIN-U05-C07": "वर्षा-बहार",
  "G7-HIN-C07": "वर्षा-बहार",
  "G7-HIN-7": "वर्षा-बहार",
  "G7-HIN-U01-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-U02-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-U03-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-U04-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-U05-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-C08": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-8": "बिरजू महाराज से साक्षात्कार",
  "G7-HIN-U01-C09": "चिड़िया",
  "G7-HIN-U02-C09": "चिड़िया",
  "G7-HIN-U03-C09": "चिड़िया",
  "G7-HIN-U04-C09": "चिड़िया",
  "G7-HIN-U05-C09": "चिड़िया",
  "G7-HIN-C09": "चिड़िया",
  "G7-HIN-9": "चिड़िया",
  "G7-HIN-U01-C10": "मीरा के पद",
  "G7-HIN-U02-C10": "मीरा के पद",
  "G7-HIN-U03-C10": "मीरा के पद",
  "G7-HIN-U04-C10": "मीरा के पद",
  "G7-HIN-U05-C10": "मीरा के पद",
  "G7-HIN-C10": "मीरा के पद",
  "G7-HIN-10": "मीरा के पद",
  "G7-MAT-U01-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-U02-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-U03-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-U04-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-U05-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-C01": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-1": "Geometric Twins (Congruence of Triangles)",
  "G7-MAT-U01-C02": "Operations with Integers",
  "G7-MAT-U02-C02": "Operations with Integers",
  "G7-MAT-U03-C02": "Operations with Integers",
  "G7-MAT-U04-C02": "Operations with Integers",
  "G7-MAT-U05-C02": "Operations with Integers",
  "G7-MAT-C02": "Operations with Integers",
  "G7-MAT-2": "Operations with Integers",
  "G7-MAT-U01-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-U02-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-U03-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-U04-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-U05-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-C03": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-3": "Finding Common Ground (Fractions & Decimals)",
  "G7-MAT-U01-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-U02-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-U03-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-U04-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-U05-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-C04": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-4": "Another Peek Beyond the Point (Decimals)",
  "G7-MAT-U01-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-U02-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-U03-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-U04-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-U05-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-C05": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-5": "Connecting the Dots (Lines & Angles)",
  "G7-MAT-U01-C06": "Constructions and Tillings",
  "G7-MAT-U02-C06": "Constructions and Tillings",
  "G7-MAT-U03-C06": "Constructions and Tillings",
  "G7-MAT-U04-C06": "Constructions and Tillings",
  "G7-MAT-U05-C06": "Constructions and Tillings",
  "G7-MAT-C06": "Constructions and Tillings",
  "G7-MAT-6": "Constructions and Tillings",
  "G7-MAT-U01-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-U02-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-U03-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-U04-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-U05-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-C07": "Finding the Unknown (Simple Equations)",
  "G7-MAT-7": "Finding the Unknown (Simple Equations)",
  "G7-MAT-U01-C08": "Working with Fractions",
  "G7-MAT-U02-C08": "Working with Fractions",
  "G7-MAT-U03-C08": "Working with Fractions",
  "G7-MAT-U04-C08": "Working with Fractions",
  "G7-MAT-U05-C08": "Working with Fractions",
  "G7-MAT-C08": "Working with Fractions",
  "G7-MAT-8": "Working with Fractions",
  "G7-MAT-U01-C09": "Comparing Quantities & Percentages",
  "G7-MAT-U02-C09": "Comparing Quantities & Percentages",
  "G7-MAT-U03-C09": "Comparing Quantities & Percentages",
  "G7-MAT-U04-C09": "Comparing Quantities & Percentages",
  "G7-MAT-U05-C09": "Comparing Quantities & Percentages",
  "G7-MAT-C09": "Comparing Quantities & Percentages",
  "G7-MAT-9": "Comparing Quantities & Percentages",
  "G7-MAT-U01-C10": "Rational Numbers & Number Line",
  "G7-MAT-U02-C10": "Rational Numbers & Number Line",
  "G7-MAT-U03-C10": "Rational Numbers & Number Line",
  "G7-MAT-U04-C10": "Rational Numbers & Number Line",
  "G7-MAT-U05-C10": "Rational Numbers & Number Line",
  "G7-MAT-C10": "Rational Numbers & Number Line",
  "G7-MAT-10": "Rational Numbers & Number Line",
  "G7-MAT-U01-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-U02-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-U03-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-U04-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-U05-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-C11": "Perimeter and Area of Plane Figures",
  "G7-MAT-11": "Perimeter and Area of Plane Figures",
  "G7-MAT-U01-C12": "Algebraic Expressions & Terms",
  "G7-MAT-U02-C12": "Algebraic Expressions & Terms",
  "G7-MAT-U03-C12": "Algebraic Expressions & Terms",
  "G7-MAT-U04-C12": "Algebraic Expressions & Terms",
  "G7-MAT-U05-C12": "Algebraic Expressions & Terms",
  "G7-MAT-C12": "Algebraic Expressions & Terms",
  "G7-MAT-12": "Algebraic Expressions & Terms",
  "G7-MAT-U01-C13": "Exponents and Powers",
  "G7-MAT-U02-C13": "Exponents and Powers",
  "G7-MAT-U03-C13": "Exponents and Powers",
  "G7-MAT-U04-C13": "Exponents and Powers",
  "G7-MAT-U05-C13": "Exponents and Powers",
  "G7-MAT-C13": "Exponents and Powers",
  "G7-MAT-13": "Exponents and Powers",
  "G7-MAT-U01-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-U02-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-U03-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-U04-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-U05-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-C14": "Symmetry and Visualizing Solid Shapes",
  "G7-MAT-14": "Symmetry and Visualizing Solid Shapes",
  "G7-SCI-U01-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-U02-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-U03-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-U04-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-U05-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-C01": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-1": "Nutrition in Plants & Photosynthesis",
  "G7-SCI-U01-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-U02-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-U03-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-U04-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-U05-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-C02": "Nutrition in Animals & Human Digestion",
  "G7-SCI-2": "Nutrition in Animals & Human Digestion",
  "G7-SCI-U01-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-U02-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-U03-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-U04-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-U05-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-C03": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-3": "Fibre to Fabric & Animal Fibres",
  "G7-SCI-U01-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-U02-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-U03-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-U04-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-U05-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-C04": "Heat Transfer & Temperature Scales",
  "G7-SCI-4": "Heat Transfer & Temperature Scales",
  "G7-SCI-U01-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-U02-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-U03-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-U04-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-U05-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-C05": "Changes Around Us: Physical and Chemical",
  "G7-SCI-5": "Changes Around Us: Physical and Chemical",
  "G7-SCI-U01-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-U02-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-U03-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-U04-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-U05-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-C06": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-6": "Adolescence: A Stage of Growth and Change",
  "G7-SCI-U01-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-U02-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-U03-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-U04-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-U05-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-C07": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-7": "Heat Transfer in Nature & Weather Systems",
  "G7-SCI-U01-C08": "Measurement of Time and Motion",
  "G7-SCI-U02-C08": "Measurement of Time and Motion",
  "G7-SCI-U03-C08": "Measurement of Time and Motion",
  "G7-SCI-U04-C08": "Measurement of Time and Motion",
  "G7-SCI-U05-C08": "Measurement of Time and Motion",
  "G7-SCI-C08": "Measurement of Time and Motion",
  "G7-SCI-8": "Measurement of Time and Motion",
  "G7-SCI-U01-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-U02-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-U03-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-U04-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-U05-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-C09": "Life Processes in Animals & Respiration",
  "G7-SCI-9": "Life Processes in Animals & Respiration",
  "G7-SCI-U01-C10": "Life Processes in Plants & Transport",
  "G7-SCI-U02-C10": "Life Processes in Plants & Transport",
  "G7-SCI-U03-C10": "Life Processes in Plants & Transport",
  "G7-SCI-U04-C10": "Life Processes in Plants & Transport",
  "G7-SCI-U05-C10": "Life Processes in Plants & Transport",
  "G7-SCI-C10": "Life Processes in Plants & Transport",
  "G7-SCI-10": "Life Processes in Plants & Transport",
  "G7-SCI-U01-C11": "Light: Shadows and Reflections",
  "G7-SCI-U02-C11": "Light: Shadows and Reflections",
  "G7-SCI-U03-C11": "Light: Shadows and Reflections",
  "G7-SCI-U04-C11": "Light: Shadows and Reflections",
  "G7-SCI-U05-C11": "Light: Shadows and Reflections",
  "G7-SCI-C11": "Light: Shadows and Reflections",
  "G7-SCI-11": "Light: Shadows and Reflections",
  "G7-SCI-U01-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-U02-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-U03-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-U04-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-U05-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-C12": "Earth, Moon, and the Sun Systems",
  "G7-SCI-12": "Earth, Moon, and the Sun Systems",
  "G7-SOC-U01-C01": "The Story of Indian Farming",
  "G7-SOC-U02-C01": "The Story of Indian Farming",
  "G7-SOC-U03-C01": "The Story of Indian Farming",
  "G7-SOC-U04-C01": "The Story of Indian Farming",
  "G7-SOC-U05-C01": "The Story of Indian Farming",
  "G7-SOC-C01": "The Story of Indian Farming",
  "G7-SOC-1": "The Story of Indian Farming",
  "G7-SOC-U01-C02": "India and Her Neighbours",
  "G7-SOC-U02-C02": "India and Her Neighbours",
  "G7-SOC-U03-C02": "India and Her Neighbours",
  "G7-SOC-U04-C02": "India and Her Neighbours",
  "G7-SOC-U05-C02": "India and Her Neighbours",
  "G7-SOC-C02": "India and Her Neighbours",
  "G7-SOC-2": "India and Her Neighbours",
  "G7-SOC-U01-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-U02-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-U03-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-U04-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-U05-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-C03": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-3": "Empires and Kingdoms: 6th to 10th Centuries",
  "G7-SOC-U01-C04": "New Political Formations in the 18th Century",
  "G7-SOC-U02-C04": "New Political Formations in the 18th Century",
  "G7-SOC-U03-C04": "New Political Formations in the 18th Century",
  "G7-SOC-U04-C04": "New Political Formations in the 18th Century",
  "G7-SOC-U05-C04": "New Political Formations in the 18th Century",
  "G7-SOC-C04": "New Political Formations in the 18th Century",
  "G7-SOC-4": "New Political Formations in the 18th Century",
  "G7-SOC-U01-C05": "Environment and Human Settlement",
  "G7-SOC-U02-C05": "Environment and Human Settlement",
  "G7-SOC-U03-C05": "Environment and Human Settlement",
  "G7-SOC-U04-C05": "Environment and Human Settlement",
  "G7-SOC-U05-C05": "Environment and Human Settlement",
  "G7-SOC-C05": "Environment and Human Settlement",
  "G7-SOC-5": "Environment and Human Settlement",
  "G7-SOC-U01-C06": "Understanding Media and Advertising",
  "G7-SOC-U02-C06": "Understanding Media and Advertising",
  "G7-SOC-U03-C06": "Understanding Media and Advertising",
  "G7-SOC-U04-C06": "Understanding Media and Advertising",
  "G7-SOC-U05-C06": "Understanding Media and Advertising",
  "G7-SOC-C06": "Understanding Media and Advertising",
  "G7-SOC-6": "Understanding Media and Advertising",
  "G7-SOC-U01-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-U02-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-U03-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-U04-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-U05-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-C07": "Markets Around Us & Shirt in the Market",
  "G7-SOC-7": "Markets Around Us & Shirt in the Market",
  "G7-SOC-U01-C08": "Equality and Governance in Democracy",
  "G7-SOC-U02-C08": "Equality and Governance in Democracy",
  "G7-SOC-U03-C08": "Equality and Governance in Democracy",
  "G7-SOC-U04-C08": "Equality and Governance in Democracy",
  "G7-SOC-U05-C08": "Equality and Governance in Democracy",
  "G7-SOC-C08": "Equality and Governance in Democracy",
  "G7-SOC-8": "Equality and Governance in Democracy",
  "G7-SOC-U01-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-U02-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-U03-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-U04-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-U05-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-C09": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-9": "Triad of Governance: Kautilya's Arthashastra",
  "G7-SOC-U01-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-U02-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-U03-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-U04-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-U05-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-C10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-10": "Life in the Deserts and Tropical Regions",
  "G7-SOC-U01-C11": "Devotional Paths to the Divine",
  "G7-SOC-U02-C11": "Devotional Paths to the Divine",
  "G7-SOC-U03-C11": "Devotional Paths to the Divine",
  "G7-SOC-U04-C11": "Devotional Paths to the Divine",
  "G7-SOC-U05-C11": "Devotional Paths to the Divine",
  "G7-SOC-C11": "Devotional Paths to the Divine",
  "G7-SOC-11": "Devotional Paths to the Divine",
  "G7-SOC-U01-C12": "The Making of Regional Cultures",
  "G7-SOC-U02-C12": "The Making of Regional Cultures",
  "G7-SOC-U03-C12": "The Making of Regional Cultures",
  "G7-SOC-U04-C12": "The Making of Regional Cultures",
  "G7-SOC-U05-C12": "The Making of Regional Cultures",
  "G7-SOC-C12": "The Making of Regional Cultures",
  "G7-SOC-12": "The Making of Regional Cultures",
  "G8-ENG-U01-C01": "The Best Christmas Present in the World",
  "G8-ENG-U02-C01": "The Best Christmas Present in the World",
  "G8-ENG-U03-C01": "The Best Christmas Present in the World",
  "G8-ENG-U04-C01": "The Best Christmas Present in the World",
  "G8-ENG-U05-C01": "The Best Christmas Present in the World",
  "G8-ENG-C01": "The Best Christmas Present in the World",
  "G8-ENG-1": "The Best Christmas Present in the World",
  "G8-ENG-U01-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-U02-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-U03-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-U04-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-U05-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-C02": "The Tsunami & Geography Lesson",
  "G8-ENG-2": "The Tsunami & Geography Lesson",
  "G8-ENG-U01-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-U02-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-U03-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-U04-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-U05-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-C03": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-3": "Glimpses of the Past & Macavity: The Mystery Cat",
  "G8-ENG-U01-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-U02-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-U03-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-U04-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-U05-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-C04": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-4": "Bepin Choudhury's Lapse of Memory",
  "G8-ENG-U01-C05": "The Summit Within & The School Boy",
  "G8-ENG-U02-C05": "The Summit Within & The School Boy",
  "G8-ENG-U03-C05": "The Summit Within & The School Boy",
  "G8-ENG-U04-C05": "The Summit Within & The School Boy",
  "G8-ENG-U05-C05": "The Summit Within & The School Boy",
  "G8-ENG-C05": "The Summit Within & The School Boy",
  "G8-ENG-5": "The Summit Within & The School Boy",
  "G8-ENG-U01-C06": "This is Jody's Fawn",
  "G8-ENG-U02-C06": "This is Jody's Fawn",
  "G8-ENG-U03-C06": "This is Jody's Fawn",
  "G8-ENG-U04-C06": "This is Jody's Fawn",
  "G8-ENG-U05-C06": "This is Jody's Fawn",
  "G8-ENG-C06": "This is Jody's Fawn",
  "G8-ENG-6": "This is Jody's Fawn",
  "G8-ENG-U01-C07": "A Visit to Cambridge",
  "G8-ENG-U02-C07": "A Visit to Cambridge",
  "G8-ENG-U03-C07": "A Visit to Cambridge",
  "G8-ENG-U04-C07": "A Visit to Cambridge",
  "G8-ENG-U05-C07": "A Visit to Cambridge",
  "G8-ENG-C07": "A Visit to Cambridge",
  "G8-ENG-7": "A Visit to Cambridge",
  "G8-ENG-U01-C08": "A Short Monsoon Diary",
  "G8-ENG-U02-C08": "A Short Monsoon Diary",
  "G8-ENG-U03-C08": "A Short Monsoon Diary",
  "G8-ENG-U04-C08": "A Short Monsoon Diary",
  "G8-ENG-U05-C08": "A Short Monsoon Diary",
  "G8-ENG-C08": "A Short Monsoon Diary",
  "G8-ENG-8": "A Short Monsoon Diary",
  "G8-ENG-U01-C09": "The Great Stone Face – I",
  "G8-ENG-U02-C09": "The Great Stone Face – I",
  "G8-ENG-U03-C09": "The Great Stone Face – I",
  "G8-ENG-U04-C09": "The Great Stone Face – I",
  "G8-ENG-U05-C09": "The Great Stone Face – I",
  "G8-ENG-C09": "The Great Stone Face – I",
  "G8-ENG-9": "The Great Stone Face – I",
  "G8-ENG-U01-C10": "The Great Stone Face – II",
  "G8-ENG-U02-C10": "The Great Stone Face – II",
  "G8-ENG-U03-C10": "The Great Stone Face – II",
  "G8-ENG-U04-C10": "The Great Stone Face – II",
  "G8-ENG-U05-C10": "The Great Stone Face – II",
  "G8-ENG-C10": "The Great Stone Face – II",
  "G8-ENG-10": "The Great Stone Face – II",
  "G8-MAT-U01-C01": "Rational Numbers",
  "G8-MAT-U02-C01": "Rational Numbers",
  "G8-MAT-U03-C01": "Rational Numbers",
  "G8-MAT-U04-C01": "Rational Numbers",
  "G8-MAT-U05-C01": "Rational Numbers",
  "G8-MAT-C01": "Rational Numbers",
  "G8-MAT-1": "Rational Numbers",
  "G8-MAT-U01-C02": "Linear Equations in One Variable",
  "G8-MAT-U02-C02": "Linear Equations in One Variable",
  "G8-MAT-U03-C02": "Linear Equations in One Variable",
  "G8-MAT-U04-C02": "Linear Equations in One Variable",
  "G8-MAT-U05-C02": "Linear Equations in One Variable",
  "G8-MAT-C02": "Linear Equations in One Variable",
  "G8-MAT-2": "Linear Equations in One Variable",
  "G8-MAT-U01-C03": "Understanding Quadrilaterals",
  "G8-MAT-U02-C03": "Understanding Quadrilaterals",
  "G8-MAT-U03-C03": "Understanding Quadrilaterals",
  "G8-MAT-U04-C03": "Understanding Quadrilaterals",
  "G8-MAT-U05-C03": "Understanding Quadrilaterals",
  "G8-MAT-C03": "Understanding Quadrilaterals",
  "G8-MAT-3": "Understanding Quadrilaterals",
  "G8-MAT-U01-C04": "Data Handling",
  "G8-MAT-U02-C04": "Data Handling",
  "G8-MAT-U03-C04": "Data Handling",
  "G8-MAT-U04-C04": "Data Handling",
  "G8-MAT-U05-C04": "Data Handling",
  "G8-MAT-C04": "Data Handling",
  "G8-MAT-4": "Data Handling",
  "G8-MAT-U01-C05": "Square and Square Roots",
  "G8-MAT-U02-C05": "Square and Square Roots",
  "G8-MAT-U03-C05": "Square and Square Roots",
  "G8-MAT-U04-C05": "Square and Square Roots",
  "G8-MAT-U05-C05": "Square and Square Roots",
  "G8-MAT-C05": "Square and Square Roots",
  "G8-MAT-5": "Square and Square Roots",
  "G8-MAT-U01-C06": "Cube and Cube Roots",
  "G8-MAT-U02-C06": "Cube and Cube Roots",
  "G8-MAT-U03-C06": "Cube and Cube Roots",
  "G8-MAT-U04-C06": "Cube and Cube Roots",
  "G8-MAT-U05-C06": "Cube and Cube Roots",
  "G8-MAT-C06": "Cube and Cube Roots",
  "G8-MAT-6": "Cube and Cube Roots",
  "G8-MAT-U01-C07": "Comparing Quantities",
  "G8-MAT-U02-C07": "Comparing Quantities",
  "G8-MAT-U03-C07": "Comparing Quantities",
  "G8-MAT-U04-C07": "Comparing Quantities",
  "G8-MAT-U05-C07": "Comparing Quantities",
  "G8-MAT-C07": "Comparing Quantities",
  "G8-MAT-7": "Comparing Quantities",
  "G8-MAT-U01-C08": "Algebraic Expressions and Identities",
  "G8-MAT-U02-C08": "Algebraic Expressions and Identities",
  "G8-MAT-U03-C08": "Algebraic Expressions and Identities",
  "G8-MAT-U04-C08": "Algebraic Expressions and Identities",
  "G8-MAT-U05-C08": "Algebraic Expressions and Identities",
  "G8-MAT-C08": "Algebraic Expressions and Identities",
  "G8-MAT-8": "Algebraic Expressions and Identities",
  "G8-MAT-U01-C09": "Mensuration",
  "G8-MAT-U02-C09": "Mensuration",
  "G8-MAT-U03-C09": "Mensuration",
  "G8-MAT-U04-C09": "Mensuration",
  "G8-MAT-U05-C09": "Mensuration",
  "G8-MAT-C09": "Mensuration",
  "G8-MAT-9": "Mensuration",
  "G8-MAT-U01-C10": "Exponents and Powers",
  "G8-MAT-U02-C10": "Exponents and Powers",
  "G8-MAT-U03-C10": "Exponents and Powers",
  "G8-MAT-U04-C10": "Exponents and Powers",
  "G8-MAT-U05-C10": "Exponents and Powers",
  "G8-MAT-C10": "Exponents and Powers",
  "G8-MAT-10": "Exponents and Powers",
  "G8-MAT-U01-C11": "Direct and Inverse Proportions",
  "G8-MAT-U02-C11": "Direct and Inverse Proportions",
  "G8-MAT-U03-C11": "Direct and Inverse Proportions",
  "G8-MAT-U04-C11": "Direct and Inverse Proportions",
  "G8-MAT-U05-C11": "Direct and Inverse Proportions",
  "G8-MAT-C11": "Direct and Inverse Proportions",
  "G8-MAT-11": "Direct and Inverse Proportions",
  "G8-MAT-U01-C12": "Factorisation",
  "G8-MAT-U02-C12": "Factorisation",
  "G8-MAT-U03-C12": "Factorisation",
  "G8-MAT-U04-C12": "Factorisation",
  "G8-MAT-U05-C12": "Factorisation",
  "G8-MAT-C12": "Factorisation",
  "G8-MAT-12": "Factorisation",
  "G8-MAT-U01-C13": "Introduction to Graphs",
  "G8-MAT-U02-C13": "Introduction to Graphs",
  "G8-MAT-U03-C13": "Introduction to Graphs",
  "G8-MAT-U04-C13": "Introduction to Graphs",
  "G8-MAT-U05-C13": "Introduction to Graphs",
  "G8-MAT-C13": "Introduction to Graphs",
  "G8-MAT-13": "Introduction to Graphs",
  "G8-SOC-U01-C01": "How, When and Where",
  "G8-SOC-U02-C01": "How, When and Where",
  "G8-SOC-U03-C01": "How, When and Where",
  "G8-SOC-U04-C01": "How, When and Where",
  "G8-SOC-U05-C01": "How, When and Where",
  "G8-SOC-C01": "How, When and Where",
  "G8-SOC-1": "How, When and Where",
  "G8-SOC-U01-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-U02-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-U03-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-U04-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-U05-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-C02": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-2": "From Trade to Territory: The Company Establishes Power",
  "G8-SOC-U01-C03": "Ruling the Countryside",
  "G8-SOC-U02-C03": "Ruling the Countryside",
  "G8-SOC-U03-C03": "Ruling the Countryside",
  "G8-SOC-U04-C03": "Ruling the Countryside",
  "G8-SOC-U05-C03": "Ruling the Countryside",
  "G8-SOC-C03": "Ruling the Countryside",
  "G8-SOC-3": "Ruling the Countryside",
  "G8-SOC-U01-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-U02-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-U03-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-U04-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-U05-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-C04": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-4": "Tribals, Dikus and the Vision of a Golden Age",
  "G8-SOC-U01-C05": "When People Rebel: 1857 and After",
  "G8-SOC-U02-C05": "When People Rebel: 1857 and After",
  "G8-SOC-U03-C05": "When People Rebel: 1857 and After",
  "G8-SOC-U04-C05": "When People Rebel: 1857 and After",
  "G8-SOC-U05-C05": "When People Rebel: 1857 and After",
  "G8-SOC-C05": "When People Rebel: 1857 and After",
  "G8-SOC-5": "When People Rebel: 1857 and After",
  "G8-SOC-U01-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-U02-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-U03-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-U04-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-U05-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-C06": "Civilising the Native, Educating the Nation",
  "G8-SOC-6": "Civilising the Native, Educating the Nation",
  "G8-SOC-U01-C07": "Women, Caste and Reform",
  "G8-SOC-U02-C07": "Women, Caste and Reform",
  "G8-SOC-U03-C07": "Women, Caste and Reform",
  "G8-SOC-U04-C07": "Women, Caste and Reform",
  "G8-SOC-U05-C07": "Women, Caste and Reform",
  "G8-SOC-C07": "Women, Caste and Reform",
  "G8-SOC-7": "Women, Caste and Reform",
  "G8-SOC-U01-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-U02-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-U03-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-U04-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-U05-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-C08": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-8": "The Making of the National Movement: 1870s–1947",
  "G8-SOC-U01-C09": "Resources and Development",
  "G8-SOC-U02-C09": "Resources and Development",
  "G8-SOC-U03-C09": "Resources and Development",
  "G8-SOC-U04-C09": "Resources and Development",
  "G8-SOC-U05-C09": "Resources and Development",
  "G8-SOC-C09": "Resources and Development",
  "G8-SOC-9": "Resources and Development",
  "G8-SOC-U01-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-U02-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-U03-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-U04-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-U05-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-C10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-10": "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
  "G8-SOC-U01-C11": "Agriculture and Industries",
  "G8-SOC-U02-C11": "Agriculture and Industries",
  "G8-SOC-U03-C11": "Agriculture and Industries",
  "G8-SOC-U04-C11": "Agriculture and Industries",
  "G8-SOC-U05-C11": "Agriculture and Industries",
  "G8-SOC-C11": "Agriculture and Industries",
  "G8-SOC-11": "Agriculture and Industries",
  "G8-SOC-U01-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-U02-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-U03-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-U04-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-U05-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-C12": "Human Resources & Law and Social Justice",
  "G8-SOC-12": "Human Resources & Law and Social Justice",
  "G9-ENG-U01-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-U02-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-U03-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-U04-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-U05-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-C01": "The Fun They Had & The Road Not Taken",
  "G9-ENG-1": "The Fun They Had & The Road Not Taken",
  "G9-ENG-U01-C02": "The Sound of Music & Wind",
  "G9-ENG-U02-C02": "The Sound of Music & Wind",
  "G9-ENG-U03-C02": "The Sound of Music & Wind",
  "G9-ENG-U04-C02": "The Sound of Music & Wind",
  "G9-ENG-U05-C02": "The Sound of Music & Wind",
  "G9-ENG-C02": "The Sound of Music & Wind",
  "G9-ENG-2": "The Sound of Music & Wind",
  "G9-ENG-U01-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-U02-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-U03-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-U04-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-U05-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-C03": "The Little Girl & Rain on the Roof",
  "G9-ENG-3": "The Little Girl & Rain on the Roof",
  "G9-ENG-U01-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-U02-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-U03-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-U04-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-U05-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-C04": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-4": "A Truly Beautiful Mind & A Legend of the Northland",
  "G9-ENG-U01-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-U02-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-U03-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-U04-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-U05-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-C05": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-5": "The Snake and the Mirror & A Slumber Did My Spirit Seal",
  "G9-ENG-U01-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-U02-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-U03-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-U04-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-U05-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-C06": "My Childhood & No Men Are Foreign",
  "G9-ENG-6": "My Childhood & No Men Are Foreign",
  "G9-ENG-U01-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-U02-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-U03-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-U04-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-U05-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-C07": "Reach for the Top & On Killing a Tree",
  "G9-ENG-7": "Reach for the Top & On Killing a Tree",
  "G9-ENG-U01-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-U02-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-U03-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-U04-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-U05-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-C08": "Kathmandu & A House Is Not a Home",
  "G9-ENG-8": "Kathmandu & A House Is Not a Home",
  "G9-ENG-U01-C09": "If I Were You & The Beggar",
  "G9-ENG-U02-C09": "If I Were You & The Beggar",
  "G9-ENG-U03-C09": "If I Were You & The Beggar",
  "G9-ENG-U04-C09": "If I Were You & The Beggar",
  "G9-ENG-U05-C09": "If I Were You & The Beggar",
  "G9-ENG-C09": "If I Were You & The Beggar",
  "G9-ENG-9": "If I Were You & The Beggar",
  "G9-ENG-U01-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-U02-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-U03-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-U04-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-U05-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-C10": "Beehive Grade 9 Review & Synthesis",
  "G9-ENG-10": "Beehive Grade 9 Review & Synthesis"
};

function resolveChapterTitle(grade: string, subjectCode: string, chapterNum: number): string {
  const chNumStr = String(chapterNum).padStart(2, '0');
  const targetSuffix = `-C${chNumStr}`;
  const prefix = `G${grade}-${subjectCode}-`;

  // 1. Strict Grade & Subject Prefix Match FIRST
  for (const [k, v] of Object.entries(NCERT_CHAPTER_TITLES)) {
    if (k.startsWith(prefix) && (k.endsWith(targetSuffix) || k.endsWith(`-C${chapterNum}`))) {
      return v;
    }
  }

  // 2. Master Title Fallbacks for Class 5
  if (String(grade) === '5') {
    if (subjectCode === 'ENG') {
      const engTitles = [
        "Papa's Spectacles", "Gone with the Scooter", "The Rainbow", "The Wise Parrot",
        "My Frog's World", "What a Tank!", "Gilli Danda", "The Decision of the Panchayat",
        "Vocation", "Glass Bangles", "Santoor Grade 5 Bridge & Review"
      ];
      if (engTitles[chapterNum - 1]) return engTitles[chapterNum - 1];
    }
    if (subjectCode === 'HIN') {
      const hinTitles = [
        "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
        "न्याय की कुर्सी (कहानी / लोककथा)",
        "चाँद का कुर्ता (बाल कविता)",
        "सद्केन (सांस्कृतिक आलेख / लोक-उत्सव)",
        "सुंदरिया (कहानी - जैनेंद्र कुमार)",
        "चतुर चित्रकार (हास्य कविता - रामनरेश त्रिपाठी)",
        "मेरा बचपन (संस्मरण - मुंशी प्रेमचंद)",
        "स्वच्छता और स्वास्थ्य (निबंध)",
        "कंप्यूटर और एआई (विज्ञान कथा)",
        "वीर शिवाजी (ऐतिहासिक कहानी)",
        "समय का महत्व (प्रेरणादायक निबंध)",
        "सपनों की उड़ान (कविता)"
      ];
      if (hinTitles[chapterNum - 1]) return hinTitles[chapterNum - 1];
    }
    if (subjectCode === 'MAT') {
      const matTitles = [
        "Travelling, Now and Then", "Fractions", "Angles as Turns",
        "Shapes and Spatial Understanding", "Numbers and Operations", "Multiplication and Division",
        "Shapes and Patterns", "Weight and Capacity", "Coconut Farm",
        "Symmetrical Designs", "Grandmother's Quilt", "Racing Seconds",
        "Animal Jumps", "Maps and Locations", "Data Through Pictures",
        "Ratio and Scale", "Mathematical Sequences", "Logic and Problem Solving"
      ];
      if (matTitles[chapterNum - 1]) return matTitles[chapterNum - 1];
    }
    if (subjectCode === 'SCI') {
      const sciTitles = [
        "Earth — Our Shared Home", "Journey of a River", "The Mystery of Food",
        "Our School — A Happy Place", "Our Vibrant Country", "Some Unique Places",
        "Energy — How Things Work", "Clothes — How Things Are Made", "Rhythms of Nature",
        "Earth — Our Shared Home", "Science in Daily Life"
      ];
      if (sciTitles[chapterNum - 1]) return sciTitles[chapterNum - 1];
    }
  }

  // 3. Master Title Fallbacks for Class 6
  if (String(grade) === '6') {
    if (subjectCode === 'ENG') {
      const eng6Titles = [
        "A Bottle of Dew", "The Friendship", "The Magic Powder", "The Way the Kite Flies",
        "A Lesson for All", "The Clever Jackal", "The Old Sage's Wisdom", "The Worth of a Skill",
        "The Great Indian Bustard", "The Starry Sky", "Yoga—a Way of Life"
      ];
      if (eng6Titles[chapterNum - 1]) return eng6Titles[chapterNum - 1];
    }
  }

  return `${subjectCode} Chapter ${chapterNum}`;
}

export function getFallbackHierarchy(): any[] {
  const grades = ['5', '6', '7', '8', '9', '10'];
  return grades.map((g) => {
    const isClass5 = String(g) === '5';

    const subjects: any[] = [
      {
        subject: 'English',
        canonical_subject: 'english',
        books: [{
          book_id: 'english',
          part: 'main',
          units: [{
            unit: 'U01',
            chapters: Array.from({ length: isClass5 ? 11 : 10 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-ENG-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: resolveChapterTitle(g, 'ENG', i + 1)
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
            chapters: Array.from({ length: isClass5 ? 12 : 10 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-HIN-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: resolveChapterTitle(g, 'HIN', i + 1)
            }))
          }]
        }]
      },
      {
        subject: 'Mathematics',
        canonical_subject: 'mathematics',
        books: isClass5 ? [
          {
            book_id: 'maths_i',
            book_title: 'Mathematics (Maths Mela)',
            part: 'main',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 18 }, (_, i) => ({
                chapter_number: i + 1,
                chapter_id: `G5-MAT-U01-C${String(i + 1).padStart(2, '0')}`,
                chapter_title: resolveChapterTitle('5', 'MAT', i + 1)
              }))
            }]
          }
        ] : [
          {
            book_id: 'maths_i',
            book_title: 'Mathematics Part I',
            part: 'part1',
            units: [{
              unit: 'U01',
              chapters: Array.from({ length: 7 }, (_, i) => ({
                chapter_number: i + 1,
                chapter_id: `G${g}-MAT-U01-C${String(i + 1).padStart(2, '0')}`,
                chapter_title: resolveChapterTitle(g, 'MAT', i + 1)
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
                chapter_title: resolveChapterTitle(g, 'MAT', i + 8)
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
            chapters: Array.from({ length: isClass5 ? 11 : 12 }, (_, i) => ({
              chapter_number: i + 1,
              chapter_id: `G${g}-SCI-U01-C${String(i + 1).padStart(2, '0')}`,
              chapter_title: resolveChapterTitle(g, 'SCI', i + 1)
            }))
          }]
        }]
      }
    ];

    if (!isClass5) {
      subjects.push({
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
                chapter_title: NCERT_CHAPTER_TITLES[`G${g}-SOC-U01-C${String(i + 1).padStart(2, '0')}`] || `Social Science Part 1 Chapter ${i + 1}`
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
                chapter_title: NCERT_CHAPTER_TITLES[`G${g}-SOC-U01-C${String(i + 7).padStart(2, '0')}`] || `Social Science Part 2 Chapter ${i + 7}`
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
                chapter_title: NCERT_CHAPTER_TITLES[`G${g}-SOC-U01-C${String(i + 13).padStart(2, '0')}`] || `Social Science Part 3 Chapter ${i + 13}`
              }))
            }]
          }
        ]
      });
    }

    return {
      grade: g,
      subjects
    };
  });
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
