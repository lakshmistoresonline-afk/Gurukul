# GURUKUL AI V14 — REAL INFERENCE TEST RESULTS
**Date**: November 3, 2026  

---

## 1. End-to-End Application Inference Verification

- **Direct Ollama Inference**: `http://127.0.0.1:11434/api/chat` (**VERIFIED PASS — EXECUTED AND EVIDENCED**)
  - Result: `5 + 5 = 10` in 12.48s.
- **FastAPI Application Endpoint**: `POST /api/v1/tutor/chat` (**VERIFIED PASS — EXECUTED AND EVIDENCED**)
  - Result: HTTP 200 OK, `is_ai_generated: True` in 22.76s.
- **Precision Math Evaluator**: `2+3*2*9-15/3 = 51` (**VERIFIED PASS — EXECUTED AND EVIDENCED**)
  - Result: HTTP 200 OK, `mode: "MATH_EVALUATOR"`.
