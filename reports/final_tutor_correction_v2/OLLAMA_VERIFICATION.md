# GURUKUL AI — OLLAMA VERIFICATION REPORT
**Date**: November 3, 2026  

---

## 1. Engine Fallback & Reliability Chain

1. **Local Ollama Instance**: `http://127.0.0.1:11434` (model `gemma:2b` / `qwen2.5:1.5b`). Operates without cloud key requirement.
2. **Ollama Cloud API**: `https://ollama.com/api/chat` (model `gemma4:31b`) invoked server-side when `OLLAMA_API_KEY` environment variable is configured.
3. **Dynamic NCERT RAG Engine**: Local fallback using `ProcessedContentResolver`.
4. **Zero Paid LLMs**: No Gemini or OpenAI cloud services used for curriculum content generation.
