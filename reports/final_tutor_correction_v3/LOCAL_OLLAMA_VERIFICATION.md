# GURUKUL AI V3 — LOCAL OLLAMA VERIFICATION REPORT
**Date**: November 3, 2026  

---

## 1. Local Engine Reliability

- **Local Ollama URL**: `http://127.0.0.1:11434` (model `gemma:2b` / `qwen2.5:1.5b`). Operates without cloud key requirement.
- **Cloud Fallback**: Ollama Cloud API (`https://ollama.com/api/chat` model `gemma4:31b`) invoked server-side when `OLLAMA_API_KEY` environment variable is set.
- **Zero Paid LLMs**: No Gemini or OpenAI cloud services used for curriculum content generation.
