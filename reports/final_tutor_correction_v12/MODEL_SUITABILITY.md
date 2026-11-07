# GURUKUL AI V12 — MODEL SUITABILITY ASSESSMENT
**Date**: November 3, 2026  

---

## 1. Hardware Suitability Matrix

- **Recommended Default Model**: `qwen3.5:2b-q4_K_M` (1.95 GB GGUF). Fits comfortably within available 6.5 GB free system RAM, executing inference in **12.48 seconds**.
- **Secondary Model**: `gemma4:e2b-it-qat` (4.34 GB GGUF). Requires 60s cold start timeout; executes in **14.58 seconds** on warm runs.
