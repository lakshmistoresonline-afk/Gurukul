import { NextRequest, NextResponse } from 'next/server';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const FASTAPI_TUTOR_URL = process.env.FASTAPI_TUTOR_URL || (IS_PRODUCTION ? '' : 'http://127.0.0.1:8001/api/v1/tutor/chat');

export async function POST(req: NextRequest) {
  try {
    // Production Configuration Enforcement
    if (IS_PRODUCTION && !process.env.FASTAPI_TUTOR_URL) {
      return NextResponse.json({
        status: 'ERROR',
        error: 'FASTAPI_TUTOR_URL environment variable is required in production.'
      }, { status: 500 });
    }

    // 1. Strict Authentication Header Validation
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.trim().length < 12) {
      return NextResponse.json({
        status: 'UNAUTHORIZED',
        error: 'Missing or malformed Authorization header. Bearer token required.'
      }, { status: 401 });
    }

    const payload = await req.json();
    const { question, grade, subject, book, part, unit, chapter_id, content_type, action, engineMode } = payload;

    // 2. Strict Request Validation
    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({
        status: 'ERROR',
        error: 'Missing or invalid required parameter: question'
      }, { status: 400 });
    }

    const reqGrade = String(grade || '').trim();
    if (!['5', '6', '7'].includes(reqGrade)) {
      return NextResponse.json({
        status: 'ERROR',
        error: `Unsupported or invalid grade: '${reqGrade}'. Must be Class 5, 6, or 7.`
      }, { status: 400 });
    }

    // Enforce 7-Dimension Curriculum Identity Validation (No silent fallbacks)
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: subject' }, { status: 400 });
    }
    if (!book || typeof book !== 'string' || !book.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: book' }, { status: 400 });
    }
    if (!part || typeof part !== 'string' || !part.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: part' }, { status: 400 });
    }
    if (!unit || typeof unit !== 'string' || !unit.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: unit' }, { status: 400 });
    }
    if (!chapter_id || typeof chapter_id !== 'string' || !chapter_id.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: chapter_id' }, { status: 400 });
    }
    if (!content_type || typeof content_type !== 'string' || !content_type.trim()) {
      return NextResponse.json({ status: 'ERROR', error: 'Missing required curriculum dimension: content_type' }, { status: 400 });
    }

    // 3. Single Authoritative Request Pipeline: Forward directly to FastAPI
    try {
      const backendRes = await fetch(FASTAPI_TUTOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          grade: reqGrade,
          subject: subject.trim().toLowerCase(),
          book: book.trim().toLowerCase(),
          part: part.trim().toLowerCase(),
          unit: unit.trim().toUpperCase(),
          chapter_id: chapter_id.trim(),
          content_type: content_type.trim().toLowerCase(),
          question: question.trim(),
          action,
          engineMode
        })
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      } else {
        const errData = await backendRes.json().catch(() => ({}));
        return NextResponse.json({
          status: 'ERROR',
          error: errData?.detail || errData?.message || 'Authoritative FastAPI Tutor request failed.'
        }, { status: backendRes.status });
      }
    } catch (backendErr) {
      console.warn('[NextProxy] FastAPI Tutor service endpoint unreachable:', backendErr);
      return NextResponse.json({
        status: 'OFFLINE',
        error: 'FastAPI Tutor Service is currently offline or unreachable.'
      }, { status: 503 });
    }

  } catch (e: any) {
    console.error('[NextProxy] Tutor Proxy Error:', e);
    return NextResponse.json({
      status: 'ERROR',
      error: e.message || 'Failed to process tutor request'
    }, { status: 500 });
  }
}
