import { sendTutorChat, TutorChatPayload } from './curriculumClient';

export interface WebLlmResponse {
  status: 'ONLINE' | 'OFFLINE' | 'LOCAL_WEBGPU' | 'CONTENT_NOT_FOUND' | string;
  response: string;
  model?: string;
  error_detail?: string;
}

/**
 * Cross-Platform WebLLM / Local Offline AI Client for GURUKUL AI.
 * First attempts local WebGPU / in-browser inference if WebGPU is supported and model cached.
 * Otherwise, routes request to local backend Ollama AI API (/api/v1/tutor/chat).
 */
export async function sendHybridTutorChat(payload: TutorChatPayload): Promise<WebLlmResponse> {
  // Check if WebGPU or local WebLLM is available
  if (typeof window !== 'undefined' && (window as any).webLlmEngine) {
    try {
      const engine = (window as any).webLlmEngine;
      const systemPrompt = `You are an expert NCERT Class 5 AI Tutor.\nSubject: ${payload.subject.toUpperCase()}, Chapter: ${payload.chapter_id}\n`;
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: payload.question }
      ];
      const reply = await engine.chat.completions.create({ messages });
      const text = reply.choices[0]?.message?.content || '';
      if (text) {
        return {
          status: 'LOCAL_WEBGPU',
          model: 'Qwen2.5-1.5B-Instruct-q4f16_1',
          response: text
        };
      }
    } catch (e) {
      console.warn('Local WebGPU inference fallback to backend Ollama:', e);
    }
  }

  // Primary API Call to Backend FastAPI Tutor (/api/v1/tutor/chat)
  return await sendTutorChat(payload);
}
