# GURUKUL AI V8 — AI SERVICE UNAVAILABLE 503 CONTRACT
**Date**: November 3, 2026  

---

## 1. HTTP 503 Service Unavailable Enforcement

- **Enforcement in `tutor.py`**: When local Ollama model `gemma4:e2b-it-qat` fails, times out, or returns an empty response during AI generation, `tutor_chat` raises `HTTPException(status_code=503, detail="Local Ollama AI service is currently unavailable. Please ensure local Ollama is running.")`.
- **Zero Fallback Misrepresentation**: The system NEVER presents un-generated RAG summary text as if it were an AI-generated answer when AI inference fails.
- **Deterministic Math Exemption**: Precision Math Evaluator (`2+3*2*9-15/3 = 51`) executes independently and returns `status: "ONLINE"`, `mode: "MATH_EVALUATOR"`.
