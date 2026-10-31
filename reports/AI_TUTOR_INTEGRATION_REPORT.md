# GURUKUL AI — AI TUTOR INTEGRATION REPORT

**Date**: October 31, 2026  
**Auditor**: Lead AI Systems Engineer  
**Status**: 100% VERIFIED  

---

## 1. AI Architecture Overview

The **GURUKUL AI Contextual AI Tutor** is fully connected to the FastAPI backend service (`POST /api/v1/tutor/chat`) backed by local **Ollama** LLM integration (`gemma:2b` / `qwen:1.8b`).

---

## 2. API Endpoint Specification

- **Endpoint**: `POST /api/v1/tutor/chat`
- **Payload**:
  ```json
  {
    "grade": "5",
    "subject": "english",
    "book": "english",
    "part": "main",
    "unit": "U01",
    "chapter_id": "G5-ENG-U01-C01",
    "content_type": "overview",
    "question": "Explain the central theme of this chapter",
    "action": "explain"
  }
  ```
- **Response**:
  ```json
  {
    "status": "ONLINE",
    "model": "gemma:2b",
    "response": "..."
  }
  ```

---

## 3. Offline Handling & Zero Fake Text Guarantee

When the local Ollama engine is offline or unreachable on port 11434, the backend returns:
```json
{
  "status": "OFFLINE",
  "response": "⚠️ AI Tutor is currently offline. Ensure local Ollama engine is running on port 11434."
}
```
The frontend displays the amber offline alert card without generating simulated responses.

---

## 4. Quick Actions Supported

1. **Explain Simply**: Contextual simplification of current chapter.
2. **Give an Example**: Real-world everyday analogy.
3. **Quiz Me**: Generates a practice MCQ from the lesson context.
4. **Help Me**: Step-by-step guidance.
