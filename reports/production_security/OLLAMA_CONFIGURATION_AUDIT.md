# GURUKUL AI — OLLAMA CONFIGURATION AUDIT
**Date**: November 3, 2026  

---

## 1. Ollama Model Orchestration & Configuration

- **Primary Local Engine**: Local Ollama instance (`http://127.0.0.1:11434`, model `gemma:2b` or `qwen2.5:1.5b`).
- **Secondary Cloud Engine**: Ollama Cloud API (`https://ollama.com/api/chat`, model `gemma4:31b`) invoked when `OLLAMA_API_KEY` is present in server environment.
- **Tertiary RAG Engine**: Local Dynamic RAG Evidence Grounded Engine utilizing `ProcessedContentResolver`.
- **Zero External LLMs**: No Gemini or OpenAI cloud services are used for curriculum content generation.
