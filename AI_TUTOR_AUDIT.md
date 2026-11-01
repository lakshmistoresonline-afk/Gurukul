# GURUKUL AI — AI TUTOR REPOSITORY & FEATURE AUDIT REPORT

**Date**: November 1, 2026  
**Git Branch**: `feature/gurukul-production-remediation`  
**HEAD Commit SHA**: `f3f65e2df0ec59517c67044cb312a0ca3990d229`  
**Auditor**: Senior AI Architect & Full-Stack Lead  

---

## 1. Executive Summary

This audit assesses the existing AI Tutor implementation in GURUKUL AI (`backend/src/curriculum/api/tutor.py`, `frontend-nextjs/src/app/tutor/page.tsx`, `frontend-nextjs/src/components/CatchAllChapterClient.tsx`, `frontend-nextjs/src/lib/webLlmClient.ts`).

---

## 2. Existing Implementation & Reusable Components

| Module / Component | File Location | Existing Capability | Reusability Assessment |
|---|---|---|---|
| **Backend AI Tutor API** | `backend/src/curriculum/api/tutor.py` | FastAPI endpoint `POST /api/v1/tutor/chat` querying Ollama or grounded NCERT engine with media links. | **100% REUSABLE** — Hardened, non-blocking thread worker execution. |
| **Hybrid AI Client** | `frontend-nextjs/src/lib/webLlmClient.ts` | 3-Tier fallback AI client (`WebLLM WebGPU` ➔ `FastAPI Backend` ➔ `NCERT Rule Engine`). | **100% REUSABLE** — Cross-platform client for PC & Mobile. |
| **Full AI Tutor Page** | `frontend-nextjs/src/app/tutor/page.tsx` | Full-page chat UI with subject/chapter selectors & preset prompt buttons. | **100% REUSABLE** — Will be enhanced with speech synthesis & conversation memory. |
| **Chapter Workspace Drawer**| `frontend-nextjs/src/components/CatchAllChapterClient.tsx` | Slide-out AI Tutor drawer in chapter workspace. | **100% REUSABLE** — Slide-out drawer with quick action buttons (`Explain Simply`, `Give Example`, `Quiz Me`). |
| **Selected-Text Ask AI** | *New Feature* | Floating contextual action popup when highlighting text. | **TO BE IMPLEMENTED** — `SelectedTextTutor.tsx` hook and component. |

---

## 3. Installed Local Ollama Models

Execution of `ollama list` confirmed the following installed open-weights models:
1. **`qwen3.5:2b-q4_K_M`** (1.9 GB) — Fast 2B parameter Qwen model.
2. **`gemma4:e2b-it-qat`** (4.3 GB) — High-quality 2B instruction-tuned Gemma model.
3. **`gemma4:2b-it-qat`** (4.3 GB) — Gemma 2B quantized instruction model.

---

## 4. Missing Functionality & Required Enhancements

1. **Selected-Text "Ask AI" Floating Popup**:
   - Need a reusable hook/component (`SelectedTextTutor.tsx`) that detects browser text selection within lesson content cards, opens a floating `[ 🤖 Ask AI ]` popup, and launches a contextual explanation drawer.
2. **Grade-Aware System Prompting**:
   - System prompts must strictly adapt to the authenticated student's grade (e.g. Class 5 simple language, short paragraphs, step-by-step reasoning).
3. **Conversation Memory & Isolation**:
   - Isolate student chat conversations by authenticated Firebase `user.uid` in Firestore (`users/{uid}/conversations/`).
4. **Native Browser Text-to-Speech (TTS)**:
   - Integrate Web Speech Synthesis (`Read Aloud`, `Pause`, `Stop`) into chat messages.

---

## 5. Protected Files & Content Immutability

The following original source files must remain 100% untouched:
- All original PDFs under `Contents/`
- Original images and videos under `Images/` and `Videos/`
- Source-artifact CSV files (`source-artifact-map.csv`)
- Canonical content JSON files (`overview.json`, `notes.json`, `quiz.json`, etc.)
- Class 6, 7, and 8 content folders.
