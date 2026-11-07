# GURUKUL AI V7 — AI SERVICE UNAVAILABLE CONTRACT
**Date**: November 3, 2026  

---

## 1. AI Generation vs. Deterministic RAG Response Contract

- **AI Generation**: When local Ollama model `qwen3.5:2b-q4_K_M` completes inference, returns `status: "ONLINE"`, `is_ai_generated: True`, and `model: "ollama/qwen3.5:2b-q4_K_M"`.
- **RAG Fallback**: When local Ollama inference fails or times out, returns `status: "NCERT_SOURCE"`, `is_ai_generated: False`, and `model: "NCERT Class X Grounded RAG Engine"`.
- **Honest Labeling**: Never misrepresents RAG evidence summary text as an AI-generated answer.
- **Precision Math Evaluator**: Mathematical calculations (`2+3*2*9-15/3 = 51`) return `status: "ONLINE"`, `mode: "MATH_EVALUATOR"`, and `model: "Gurukul Precision Math Engine"`.
