# GURUKUL AI V5 — BASELINE INSPECTION REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline report documents the V5 architectural state, source code diffs, local Ollama execution requirements, Next.js server proxy configurations, and Firebase authentication controls.

---

## 2. Identified V5 Remediation Tasks

1. **Strict Local Ollama-Only Enforcement (`tutor.py`, `route.ts`, `webLlmClient.ts`)**:
   - **Requirement**: Remove all external cloud LLM fallbacks (`OLLAMA_CLOUD_KEY`, `ollama.com`, Gemini, OpenAI). All tutor inference and curriculum content generation must use local Ollama (`http://127.0.0.1:11434`) exclusively. If local Ollama is offline or unavailable, return an explicit service unavailable error without silently substituting a cloud model.

2. **Explicit Production Backend Proxy Configuration (`route.ts`)**:
   - **Requirement**: Remove implicit production localhost fallback in `frontend-nextjs/src/app/api/tutor/chat/route.ts`. Require `FASTAPI_TUTOR_URL` in production mode (`process.env.NODE_ENV === 'production'`) and fail safely if unconfigured.

3. **Firebase Token Verification & Learner UID Isolation**:
   - **Requirement**: Ensure Bearer tokens are forwarded through the proxy and verified by `get_current_user` in `auth_service.py`. Derive learner UID strictly from verified tokens, rejecting any client-supplied UID overrides.
