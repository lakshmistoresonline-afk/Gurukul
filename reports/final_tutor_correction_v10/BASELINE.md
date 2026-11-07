# GURUKUL AI V10 — BASELINE INSPECTION REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the V10 investigation into FastAPI tutor endpoint inference performance, prompt size optimization, Ollama `/api/chat` payload structure, and test suite assertion integrity.

---

## 2. Identified V10 Remediation Tasks

1. **Investigate FastAPI vs Direct Ollama Timeout Difference (Phase 1 & 2)**:
   - Direct Ollama `/api/chat` request generated 188 characters in 25.29 seconds.
   - However, the FastAPI endpoint `tutor_chat()` passed a prompt containing up to 3000 characters of raw passage text (`passage_text[:3000]`), causing local Ollama's prompt evaluation phase to take >50 seconds on CPU.
   - **Fix**: Optimize prompt context in `tutor.py` to include concise, high-relevance evidence passages (`passage_text[:600]`) so local Ollama inference completes quickly (~10-15 seconds) well within standard timeout limits.

2. **Strict Test Quality & Assertion Repair (`test_tutor_comprehensive_audit.py`) (Phase 3)**:
   - Separate test assertions into strict success tests verifying `HTTP 200` with non-empty AI text, and failure tests verifying `HTTP 503` when local Ollama service is unavailable.
