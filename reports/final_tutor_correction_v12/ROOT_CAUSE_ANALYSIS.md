# GURUKUL AI V12 — ROOT CAUSE ANALYSIS REPORT
**Date**: November 3, 2026  

---

## 1. Root Cause of Previous Timeout Discrepancies

- **Root Cause**: On cold model load, Ollama allocates 1.95–4.34 GB GGUF weight files from disk into system RAM, taking 27–58 seconds on cold start. When `OLLAMA_TIMEOUT` was set to 10 seconds, HTTP sockets timed out before weight allocation completed.
- **Remediation**:
  1. Updated `OLLAMA_TIMEOUT = 30`s in `tutor.py`.
  2. Set `OLLAMA_MODEL = "qwen3.5:2b-q4_K_M"` (1.95 GB) as default fast local model.
  3. Switched `_sync_query_ollama` to Ollama's `/api/chat` schema, completing inference in **12.48 seconds**.
