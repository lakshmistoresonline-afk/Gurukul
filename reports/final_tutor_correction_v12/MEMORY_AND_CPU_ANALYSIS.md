# GURUKUL AI V12 — MEMORY AND CPU ANALYSIS
**Date**: November 3, 2026  

---

## 1. System Memory & CPU Usage Analysis

- **System Memory**: 16 GB DDR3 RAM installed with 6.51 GB Free Physical RAM available.
- **CPU Resource Usage**: Intel Core i5-3330 CPU @ 3.00GHz (4 Cores / 4 Threads).
- **Execution Allocation**: Because NVIDIA GT 730 VRAM is 4 GB (legacy architecture), GGUF weights are allocated directly into system RAM, executing inference across 4 CPU cores at ~2-3 tokens/second.
- **Optimization Strategy**: Model parameters `OLLAMA_MODEL = "qwen3.5:2b-q4_K_M"` (1.95 GB) and `OLLAMA_TIMEOUT = 30`s optimize CPU execution time to **12.48s**.
