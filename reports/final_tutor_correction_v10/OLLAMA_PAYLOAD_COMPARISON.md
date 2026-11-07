# GURUKUL AI V10 — OLLAMA PAYLOAD COMPARISON
**Date**: November 3, 2026  

---

## 1. `/api/generate` vs `/api/chat` Schema Comparison

| Dimension | Legacy `/api/generate` | Authoritative `/api/chat` |
|---|---|---|
| **Endpoint URL** | `http://127.0.0.1:11434/api/generate` | `http://127.0.0.1:11434/api/chat` |
| **Payload Key** | `"prompt": "..."` | `"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}]` |
| **Response Key** | `data["response"]` | `data["message"]["content"]` |
| **Response Performance** | Cold load ~73s / Empty text on GGUF thinking models | **25.29s / Non-empty 188-char AI text** |
