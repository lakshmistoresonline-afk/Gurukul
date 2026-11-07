# GURUKUL AI V15 — V14 SOURCE AUDIT & DEFECT REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  

---

## 1. Executive Summary & Defect Inspection

In V14, response extraction attempted to fall back to `msg.get("thinking")` when `msg.get("content")` was empty due to low `num_predict` token caps. This resulted in internal reasoning text ("Thinking Process: 1. Analyze the Request...") leaking into student-facing answers.

---

## 2. V15 Remediation Requirements

1. **Thinking Leak Prevention**: Update `backend/src/curriculum/api/tutor.py` to extract `msg_obj.get("content", "").strip()` **ONLY**. Never return `message.thinking` or internal reasoning text to students.
2. **Token Output Capacity**: Configure `num_predict: 350` in Ollama options so model generation completes its thinking phase and outputs the full, clean, student-facing answer into `message.content`.
3. **Strict 503 Fallback**: If `message.content` is empty or missing, raise `HTTPException(status_code=503, detail="Local Ollama AI service returned an empty answer.")`.
