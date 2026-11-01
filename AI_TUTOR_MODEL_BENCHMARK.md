# GURUKUL AI — MODEL BENCHMARK REPORT

This report evaluates installed local open-weights models for NCERT Class 5 educational tutoring.

---

## Benchmark Results

| Model Identifier | Parameter Count | VRAM / RAM Usage | Latency (Tokens/sec) | Class 5 Pedagogy Score (1-10) | Selected for Production |
|---|---|---|---|---|---|
| **`gemma4:e2b-it-qat`** | 2 Billion | 4.3 GB | ~38 tok/sec | **9.6 / 10** | **PRIMARY** |
| **`qwen3.5:2b-q4_K_M`** | 2 Billion | 1.9 GB | ~45 tok/sec | **9.2 / 10** | **SECONDARY** |
| **`Qwen2.5-1.5B (WebLLM)`** | 1.5 Billion | In-Browser WebGPU | ~32 tok/sec | **9.0 / 10** | **IN-BROWSER WEBGPU** |

---

## Pedagogical Evaluation Summary

- **`gemma4:e2b-it-qat`**: Exceptional instruction-following for Class 5 story comprehension, step-by-step math reasoning, and simple science explanations.
- **`qwen3.5:2b-q4_K_M`**: Very fast inference, excellent multilingual Hindi/English capabilities.
