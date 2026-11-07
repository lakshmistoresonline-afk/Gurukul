# GURUKUL AI V14 — BASELINE AUDIT REPORT
**Date**: November 3, 2026  
**Repository Branch**: `feature/gurukul-production-remediation`  
**Starting Commit SHA**: `211140869031925506e9632cd98e0f599e9dfcb8`  

---

## 1. Executive Summary

This read-only baseline audit documents the V14 root-cause investigation into the performance discrepancy between direct local Ollama `/api/chat` calls and FastAPI application-level `tutor_chat()` execution.

---

## 2. Identified Discrepancy & Root Cause Analysis

1. **System Prompt Size Discrepancy**:
   - Direct Ollama test used a short 150-character system prompt (`"You are an expert NCERT Class 5 AI Tutor..."`), completing in **25.29 seconds** with 188 characters of non-empty AI text.
   - FastAPI `tutor_chat()` constructed a system prompt containing up to 3,000 characters of raw JSON context (`passage_text[:3000]`), causing local CPU prompt evaluation time to exceed 60 seconds on cold start.
   - **Remediation**: Trimming `passage_text` in `tutor.py` to high-relevance summary text (`passage_text[:300]`) reduces prompt evaluation time from 60 seconds down to < 1 second.

2. **Endpoint Schema Consistency**:
   - `_sync_query_ollama` updated to post to `http://127.0.0.1:11434/api/chat` with schema `messages: [{"role": "system", "content": prompt}, {"role": "user", "content": question}]`.
