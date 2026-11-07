import { TutorChatPayload } from './curriculumClient';
import { auth } from './firebase';
import { evaluateSafeArithmetic } from './safeMathEvaluator';

export interface WebLlmResponse {
  status: string;
  mode?: string;
  response: string;
  model?: string;
  media?: {
    diagram?: string;
    video?: string;
  };
  error_detail?: string;
}

/**
 * Safe Token-Based Math Expression Evaluator
 * Evaluates single-operator and multi-operator math expressions (e.g. 10 - -17, 2+3*2*9-15/3, (5+3)*2)
 * using tokenized BODMAS order of operations WITHOUT eval() or new Function().
 */
function trySolveMathExpression(question: string): string | null {
  const result = evaluateSafeArithmetic(question);
  if (result !== null) {
    const resDisplay = Number.isInteger(result) ? result : Math.round(result * 10000) / 10000;
    return `📐 **Step-by-Step Math Solution (Order of Operations)**\n\n**Problem**: \`${question.trim()}\`\n\n1. **Apply Order of Operations (PEMDAS / BODMAS)**: Parentheses ➔ Exponents ➔ Multiplication & Division (Left to Right) ➔ Addition & Subtraction (Left to Right).\n2. **Evaluation**: \`${question.trim()}\` = **${resDisplay}**\n\n✅ **Final Answer**: **${resDisplay}**`;
  }
  return null;
}

/**
 * Single Authoritative Local Ollama AI Client for GURUKUL AI.
 * Flow: Student UI ➔ Next.js Proxy (/api/tutor/chat) ➔ FastAPI Backend (/api/v1/tutor/chat) ➔ Local Ollama (127.0.0.1:11434)
 */
export async function sendHybridTutorChat(payload: TutorChatPayload & { engineMode?: 'NCERT' | 'WORLD' }): Promise<WebLlmResponse> {
  // 1. Firebase Authentication Token (with dev guest fallback for local learning)
  const user = auth.currentUser;
  const token = user ? await user.getIdToken().catch(() => null) : null;
  const authHeader = token ? `Bearer ${token}` : 'Bearer mock-token-user-a';

  // 2. Math Expression Evaluator
  const mathSolution = trySolveMathExpression(payload.question);
  if (mathSolution) {
    return {
      status: 'ONLINE',
      mode: 'MATH_EVALUATOR',
      model: 'Gurukul Precision Math Engine',
      response: mathSolution
    };
  }

  // 3. Authoritative Next.js API Proxy Call (/api/tutor/chat)
  try {
    const res = await fetch('/api/tutor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.status === 'ONLINE' || data.status === 'NCERT_SOURCE')) {
        return data;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        status: res.status === 401 ? 'UNAUTHORIZED' : 'OFFLINE',
        mode: 'ERROR',
        response: `🤖 **GURUKUL AI Engine**: ${errData?.error || errData?.detail || 'Local Ollama AI service is currently unavailable. Please ensure local Ollama is running.'}`,
        error_detail: errData?.error || errData?.detail
      };
    }
  } catch (proxyErr: any) {
    console.warn('[TutorClient] Proxy request failed:', proxyErr);
    return {
      status: 'OFFLINE',
      mode: 'ERROR',
      response: '🤖 **GURUKUL AI Engine**: Local Ollama AI service is currently offline or unreachable at http://127.0.0.1:11434. Please start local Ollama.'
    };
  }

  return {
    status: 'OFFLINE',
    mode: 'ERROR',
    response: '🤖 **GURUKUL AI Engine**: Local Ollama AI service is currently offline or unreachable.'
  };
}
