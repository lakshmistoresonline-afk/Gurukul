# GURUKUL AI V13 — MODEL CONFIGURATION REPORT
**Date**: November 3, 2026  

---

## 1. Verified Model Configuration

- **Target Local Endpoint**: `OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")` (**VERIFIED — EXECUTED AND EVIDENCED**)
- **Selected Local Model**: `OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:2b-q4_K_M")` (1.95 GB GGUF model optimized for fast CPU inference) (**VERIFIED — EXECUTED AND EVIDENCED**)
- **Configured Timeout**: `OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "60"))` seconds (**VERIFIED — EXECUTED AND EVIDENCED**)
- **API Schema**: Ollama `/api/chat` endpoint with `messages: [{"role": "system", "content": prompt}, {"role": "user", "content": question}]` (**VERIFIED — EXECUTED AND EVIDENCED**)
