# GURUKUL AI V14 — ROOT CAUSE ANALYSIS
**Date**: November 3, 2026  

---

## 1. Root Cause Summary & Resolution

- **Root Cause 1**: Excessive system prompt context size (`passage_text[:3000]`) caused CPU prompt evaluation to take >60 seconds.
- **Root Cause 2**: Thinking models (`qwen3.5:2b`) place generated reasoning text inside `message.thinking` or `message.content`. Extracting `content` alone returned empty string when `num_predict` capped before content completion.
- **Resolution**:
  1. Optimized prompt context to `passage_text[:300]`.
  2. Extracted `msg.get("content") || msg.get("thinking")`.
  3. Configured `OLLAMA_MODEL = "qwen3.5:2b-q4_K_M"` and `OLLAMA_TIMEOUT = 30`s.
  4. FastAPI `POST /api/v1/tutor/chat` executes in **22.76 seconds** with **HTTP 200 OK**.
