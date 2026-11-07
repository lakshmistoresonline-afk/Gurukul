# GURUKUL AI V14 — MINIMAL FIX IMPLEMENTATION REPORT
**Date**: November 3, 2026  

---

## 1. Summary of Minimal Source Code Changes

- **`backend/src/curriculum/api/tutor.py`**:
  1. Updated `OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:2b-q4_K_M")` and `OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "30"))`.
  2. Updated `_sync_query_ollama` to call `{url}/api/chat` schema.
  3. Optimized prompt passage context to `passage_text[:300]`.
  4. Extracted `msg_obj.get("content") || msg_obj.get("thinking")`.
  5. Enforced `HTTPException(status_code=503)` when local AI generation fails or times out.
