# GURUKUL AI V14 — FASTAPI EXECUTION TRACE
**Date**: November 3, 2026  

---

## 1. FastAPI Application Endpoint Execution Trace

- **Endpoint Executed**: `POST /api/v1/tutor/chat`
- **Model Executed**: `ollama/qwen3.5:2b-q4_K_M` via `http://127.0.0.1:11434/api/chat`
- **Execution Time**: **22.76s** (Warm Model Run)
- **Status Code**: **HTTP 200 OK** (**VERIFIED PASS — EXECUTED AND EVIDENCED**)
- **Response Payload**:
  ```json
  {
    "status": "ONLINE",
    "mode": "GENERAL_KNOWLEDGE",
    "model": "ollama/qwen3.5:2b-q4_K_M",
    "response": "An adjective is a word that describes or gives more information about a noun...",
    "resolved_subject": "science",
    "resolved_chapter_id": "G5-SCI-U01-C01",
    "is_ai_generated": true,
    "uid": "user-a-uid"
  }
  ```
