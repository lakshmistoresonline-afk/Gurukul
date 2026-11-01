# GURUKUL AI — FREE-TIER HOSTING & ALWAYS-AVAILABLE AI ARCHITECTURE

**Date**: November 1, 2026  
**Git Branch**: `feature/gurukul-production-remediation`  
**HEAD Commit SHA**: `fc4e9fc4c5fade8ee2e2e083b69f4f1a01ba4044`  
**Architecture Version**: 5.0.0  

---

## 1. System Architecture Overview

GURUKUL AI employs a **3-Tier High-Availability Hybrid Architecture** designed to operate 100% within free-tier limits (Cloudflare Pages, Cloudflare Workers, Firebase Spark Free Tier) while maintaining continuous student access to verified NCERT learning assistance even when AI inference hardware is offline:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │      CLIENT LAYER (Next.js 14 / WebLLM WebGPU)         │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │
                                           ┌─────────────────┴─────────────────┐
                                           ▼                                   ▼
                            ┌────────────────────────────┐       ┌────────────────────────────┐
                            │ Cloudflare Worker Gateway  │       │   FastAPI Backend Server   │
                            │ (Always-Available RAG)     │       │  (Ollama Inference Node)   │
                            └──────────────┬─────────────┘       └─────────────┬──────────────┘
                                           │                                   │
                                           ▼                                   ▼
                            ┌────────────────────────────┐       ┌────────────────────────────┐
                            │  Cloud Firestore (Spark)   │       │   Ollama Local AI Queue    │
                            │  - users/{uid}/progress    │       │   - gemma4:e2b-it-qat      │
                            │  - users/{uid}/ai_jobs     │       │   - qwen3.5:2b-q4_K_M      │
                            └────────────────────────────┘       └────────────────────────────┘
```

---

## 2. Operating Modes & Failover Hierarchy

1. **Mode A: Primary Ollama Inference (`status: "ONLINE"`, `model: "ollama/gemma4:e2b-it-qat"`)**:
   - Executes via background Queue Worker or FastAPI Thread Worker when Ollama daemon is active on port 11434.
2. **Mode B: In-Browser WebGPU Inference (`status: "ONLINE"`, `model: "webllm/Qwen2.5-1.5B"`)**:
   - Executes locally inside student's browser via `@mlc-ai/web-llm` with zero external server costs.
3. **Mode C: Always-Available NCERT Grounded Fallback (`status: "NCERT_SOURCE"`, `model: "NCERT Class 5 Grounded Engine"`)**:
   - Serves verified multi-paragraph explanations and direct media streaming URLs extracted directly from authoritative NCERT JSON content whenever AI inference workers are offline.
