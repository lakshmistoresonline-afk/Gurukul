# GURUKUL AI V4 — LOCAL OLLAMA VERIFICATION REPORT
**Date**: November 3, 2026  

---

## 1. Local-Only Generation Pipeline

- **Local Ollama Primary Engine**: FastAPI connects to local Ollama service (`http://127.0.0.1:11434`, model `gemma:2b` / `qwen2.5:1.5b`) without cloud key requirement.
- **Server-Side Cloud Fallback**: Cloud fallback (`https://ollama.com/api/chat` model `gemma4:31b`) executed server-side in FastAPI when `OLLAMA_API_KEY` environment variable is set.
- **Zero Gemini / OpenAI LLM Inference**: No external Gemini or OpenAI LLM services used for curriculum content generation or tutor inference.
