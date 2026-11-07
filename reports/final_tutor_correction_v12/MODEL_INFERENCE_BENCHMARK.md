# GURUKUL AI V12 — MODEL INFERENCE BENCHMARK
**Date**: November 3, 2026  

---

## 1. Isolated Local Inference Benchmark

| Model Name | GGUF File Size | Cold Load Time | Warm Inference Time | Non-Empty Generated Response Output |
|---|---|---|---|---|
| **`qwen3.5:2b-q4_K_M`** | 1.95 GB | 27.99 s | **12.48 s** | `"5 + 5 = 10"` (**VERIFIED PASS**) |
| **`gemma4:e2b-it-qat`** | 4.34 GB | 58.90 s | **14.58 s** | `"Photosynthesis is the process used by plants to convert light energy..."` (**VERIFIED PASS**) |
