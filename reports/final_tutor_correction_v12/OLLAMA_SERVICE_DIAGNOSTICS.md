# GURUKUL AI V12 — OLLAMA SERVICE DIAGNOSTICS REPORT
**Date**: November 3, 2026  

---

## 1. Ollama Service Status

- **Installed Ollama Version**: `0.33.0` (**VERIFIED — EXECUTED AND EVIDENCED**)
- **Local Service Endpoint**: `http://127.0.0.1:11434` (HTTP 200 OK) (**VERIFIED — EXECUTED AND EVIDENCED**)
- **Installed Models**:
  1. `gemma4:e2b-it-qat` (4.34 GB) (**VERIFIED — EXECUTED AND EVIDENCED**)
  2. `qwen3.5:2b-q4_K_M` (1.95 GB) (**VERIFIED — EXECUTED AND EVIDENCED**)
  3. `gemma4:2b-it-qat` (4.34 GB) (**VERIFIED — EXECUTED AND EVIDENCED**)
- **Memory Allocation Behavior**: On cold start, Ollama loads GGUF model weights from disk into system RAM on demand upon receiving the first request.
