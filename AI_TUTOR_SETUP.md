# GURUKUL AI — AI TUTOR SETUP & INSTALLATION GUIDE

This guide explains how to configure and run local AI models with GURUKUL AI.

---

## 1. Prerequisites

- Python 3.10+
- Node.js 18+
- Ollama CLI (v0.3.0+) installed on Windows / Mac / Linux

---

## 2. Installing Ollama Models

Run the following command in PowerShell / Terminal:

```bash
# Pull the recommended Gemma 2B Instruction model
ollama pull gemma4:e2b-it-qat

# Alternatively, pull Qwen 2.5 2B model
ollama pull qwen3.5:2b-q4_K_M
```

---

## 3. Starting the Backend & Frontend

1. **Start Backend Server**:
   ```bash
   cd D:\GURUKUL\backend
   python -m uvicorn src.main:app --host 127.0.0.1 --port 8001 --reload
   ```

2. **Start Frontend Server**:
   ```bash
   cd D:\GURUKUL\frontend-nextjs
   npm run dev
   ```

3. **Verify AI Tutor**:
   Open `http://localhost:3000/tutor` in your browser.
