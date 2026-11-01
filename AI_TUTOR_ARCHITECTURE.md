# GURUKUL AI — AI TUTOR ARCHITECTURE & MODEL ROUTING SPECIFICATION

**Date**: November 1, 2026  
**Version**: 4.0.0  

---

## 1. High-Level Architecture

The GURUKUL AI Tutor architecture employs a **Provider-Independent Multi-Tier AI Service**:

```
                         ┌─────────────────────────────────────────┐
                         │       GURUKUL AI FRONTEND (Next.js)     │
                         │  • Full Tutor Page (/tutor)             │
                         │  • Chapter Workspace Drawer             │
                         │  • Selected-Text Ask AI Popup           │
                         └────────────────────┬────────────────────┘
                                              │
                                              ▼
                         ┌─────────────────────────────────────────┐
                         │   HYBRID AI CLIENT (webLlmClient.ts)    │
                         └────────────────────┬────────────────────┘
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         ▼                                    ▼                                    ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│ Tier 1: In-Browser WebGPU │      │ Tier 2: FastAPI Backend   │      │ Tier 3: Grounded NCERT    │
│ (@mlc-ai/web-llm)         │      │ (POST /api/v1/tutor/chat) │      │ Rule Engine               │
├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
│ Model: Qwen2.5-1.5B       │      │ Model: gemma4:e2b-it-qat  │      │ Zero external service     │
│ Runs 100% offline in web  │      │ Non-blocking thread pool  │      │ dependency                │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

---

## 2. Environment Configuration

The backend reads configuration from environment variables (`.env.local` / system env):

```env
AI_TUTOR_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_TUTOR_MODEL=gemma4:e2b-it-qat
OLLAMA_TIMEOUT=10
```

---

## 3. Grade Adaptation Rules

For **NCERT Class 5**:
- Simple, encouraging language.
- Short 2-3 sentence paragraphs.
- Step-by-step problem-solving structure for Mathematics.
- Everyday real-world examples for EVS/Science.
- Phonetic pronunciation notes for English and Hindi vocabulary.
