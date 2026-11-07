# GURUKUL AI V14 — PAYLOAD DIFFERENCE ANALYSIS
**Date**: November 3, 2026  

---

## 1. Discrepancy & Payload Analysis

- **System Prompt Context Size**:
  - Legacy Prompt: `json.dumps(content_data)[:3000]` sent 3,000 characters of raw JSON context in the system prompt. On 4-core CPU, prompt evaluation took 60s, triggering a timeout error.
  - Optimized Prompt: `passage_text[:300]` passes 300 characters of high-relevance summary context. CPU prompt evaluation completes in < 0.5s.
- **Thinking Token Extraction**:
  - Qwen 3.5 thinking models output reasoning text in `message.thinking` or `message.content`. Extracting `msg.get("content") || msg.get("thinking")` guarantees that generated text is extracted without returning empty output.
