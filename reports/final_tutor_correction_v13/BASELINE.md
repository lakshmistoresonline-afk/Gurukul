# GURUKUL AI V13 — BASELINE INSPECTION REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the V13 local inference reliability verification, model configuration parameters, resource monitoring benchmarks, end-to-end FastAPI application integration test results, and failure contract enforcement.

---

## 2. Identified V13 Verification Tasks

1. **Verify Local Model Configuration Parameters (Phase 1)**:
   - `OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:2b-q4_K_M")` (1.95 GB model for fast CPU execution).
   - `OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "30"))` seconds.
   - Endpoint: `http://127.0.0.1:11434/api/chat`.

2. **Direct Ollama Reliability Benchmark (Phase 2 & 3)**:
   - Benchmark 1 cold request + 3 consecutive warm requests against `http://127.0.0.1:11434/api/chat`.
   - Measure HTTP status, wall-clock duration, `load_duration`, `eval_count`, non-empty response text, and system memory/CPU usage before and after.

3. **FastAPI End-to-End Integration Verification (Phase 4 & 6)**:
   - Test `POST /api/v1/tutor/chat` via FastAPI `TestClient` without mocking `_sync_query_ollama`.
   - Verify HTTP 200 with non-empty AI text when local Ollama is active, and HTTP 503 when local Ollama is offline or times out.
