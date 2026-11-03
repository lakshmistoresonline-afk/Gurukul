import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_CLOUD_KEY = '802c7f9425034b1eb58956545b8a74b1.ubyNZxMXhcyz-y8BcRXilLos';
const OLLAMA_CLOUD_URL = 'https://ollama.com/api/chat';
const OLLAMA_CLOUD_MODEL = 'gemma4:31b';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { question, grade, subject, chapter_id, engineMode } = payload;

    const isWorldMode = engineMode === 'WORLD';

    const systemPrompt = isWorldMode
      ? `You are GURUKUL AI Universal World Engine. Answer the student's question accurately, thoroughly, and step-by-step for a K-12 learner. Answer ANY question about math, science, history, geography, coding, or world knowledge in simple, encouraging terms.`
      : `You are an expert NCERT Class ${grade || '5'} AI Tutor for ${String(subject || '').toUpperCase()} (${chapter_id || ''}). Answer the student's question accurately based on 5th/6th/7th grade NCERT curriculum concepts.`;

    const res = await fetch(OLLAMA_CLOUD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_CLOUD_KEY}`
      },
      body: JSON.stringify({
        model: OLLAMA_CLOUD_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        stream: false
      })
    });

    if (res.ok) {
      const data = await res.json();
      const aiText = data.message?.content || data.response || '';
      if (aiText) {
        return NextResponse.json({
          status: 'ONLINE',
          mode: isWorldMode ? 'WORLD_KNOWLEDGE' : 'NCERT_CHAPTER',
          model: 'Ollama Cloud (gemma4:31b)',
          response: aiText,
          resolved_subject: subject,
          resolved_chapter_id: chapter_id,
          is_ai_generated: true
        });
      }
    }

    return NextResponse.json({
      status: 'OFFLINE',
      error: 'Ollama Cloud response empty'
    }, { status: 502 });

  } catch (e: any) {
    console.error('Next.js Tutor Proxy Error:', e);
    return NextResponse.json({
      status: 'OFFLINE',
      error: e.message || 'Failed to connect to Ollama Cloud API'
    }, { status: 500 });
  }
}
