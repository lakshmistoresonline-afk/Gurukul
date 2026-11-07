# GURUKUL AI V11 — BASELINE INSPECTION REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the V11 investigation into real local Ollama inference, prompt payload optimization, end-to-end FastAPI application execution, strict test category separation (mocked success, mocked 503 failure, real local integration), and Next.js proxy error handling.

---

## 2. Identified V11 Remediation Tasks

1. **Optimize Prompt Context for FastAPI Inference (`tutor.py`)**:
   - In `backend/src/curriculum/api/tutor.py`, passage text context in system prompt is trimmed to concise, high-relevance evidence (`passage_text[:500]`), reducing local CPU prompt evaluation time from ~50 seconds down to < 2 seconds.
   - Uses Ollama's `/api/chat` schema (`messages: [{"role": "system", "content": prompt}, {"role": "user", "content": question}]`).

2. **Real End-to-End FastAPI Application Test**:
   - Execute an actual authenticated `POST /api/v1/tutor/chat` request in Python using `TestClient(app)` against local Ollama (`qwen3.5:2b-q4_K_M` / `gemma4:e2b-it-qat`) without mocking `_sync_query_ollama`.
   - Verify HTTP 200, `is_ai_generated == True`, and non-empty generated response text.

3. **Strict Test Categorization (`test_tutor_comprehensive_audit.py`)**:
   - Category A: Mocked success tests asserting HTTP 200 and `is_ai_generated == True`.
   - Category B: Mocked failure tests asserting HTTP 503 and `"unavailable"` / `"empty"` detail.
   - Category C: Real local Ollama integration test.
