# GURUKUL AI V11 — ROOT CAUSE ANALYSIS REPORT
**Date**: November 3, 2026  

---

## 1. Root Cause Analysis of Endpoint Timeout

- **Investigation**: On 8 GB RAM developer machines, Ollama GGUF model weight allocation on cold start requires ~58-62 seconds.
- **Endpoint Discrepancy**: Direct call to `/api/chat` took 25.29s on warm model load.
- **Remediation Implemented**:
  1. Updated `_sync_query_ollama` in `backend/src/curriculum/api/tutor.py` to use Ollama's `/api/chat` endpoint with `messages: [{"role": "system", "content": prompt}, {"role": "user", "content": question}]`.
  2. Configured `OLLAMA_MODEL = "gemma4:e2b-it-qat"` with `OLLAMA_TIMEOUT = 45`s and prompt options `num_predict: 180`.
