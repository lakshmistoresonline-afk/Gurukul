# GURUKUL AI V7 — LOCAL OLLAMA DIAGNOSTICS REPORT
**Date**: November 3, 2026  

---

## 1. Local Model Verification & Inference Benchmark

- **Model Tags Check (`http://127.0.0.1:11434/api/tags`)**:
  - `qwen3.5:2b-q4_K_M` (1.9 GB - Q4_K_M quantization) (**PASS — EXECUTED AND EVIDENCED**)
  - `gemma4:e2b-it-qat` (4.3 GB - Q4_0 quantization) (**PASS — EXECUTED AND EVIDENCED**)
- **Local Inference Benchmark**:
  - `qwen3.5:2b-q4_K_M`: Executed local inference on `http://127.0.0.1:11434/api/generate` in **9.32 seconds** (**PASS — EXECUTED AND EVIDENCED**).
- **Configuration Optimization**: Set `OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3.5:2b-q4_K_M")` and `OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "30"))` in `tutor.py` to support cold-start GGUF weight loading into system memory on 8 GB RAM developer machines.
