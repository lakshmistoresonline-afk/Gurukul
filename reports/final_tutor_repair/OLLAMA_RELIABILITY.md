# GURUKUL AI — OLLAMA RELIABILITY REPORT
**Date**: November 3, 2026  

---

## 1. Engine Fallback Chain

1. **Local Ollama Instance**: `http://127.0.0.1:11434` (model `gemma:2b` or `qwen2.5:1.5b`).
2. **Ollama Cloud API**: `https://ollama.com/api/chat` (model `gemma4:31b`) invoked via server-side Node.js proxy `/api/tutor/chat` or FastAPI server when `OLLAMA_API_KEY` is present.
3. **Dynamic NCERT RAG Engine**: Local fallback using `ProcessedContentResolver`.
4. **Zero Paid LLMs**: No Gemini or OpenAI cloud services used for curriculum content generation.
