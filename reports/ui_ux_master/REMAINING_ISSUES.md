# GURUKUL AI — REMAINING ISSUES
**Date**: November 3, 2026  

---

## 1. Remaining Issues Status

- **Critical Open Defects**: **0** (Zero open critical, high, or medium defects remaining).
- **Known Limitations**:
  - WebGPU WebLLM browser execution requires WebGPU support in modern Chrome/Edge browsers.
  - When local Ollama (`127.0.0.1:11434`) and local backend (`127.0.0.1:8001`) are offline, the frontend uses Next.js server route `/api/tutor/chat` to call Ollama Cloud API (`gemma4:31b`), requiring internet connectivity.
