# GURUKUL AI — OLLAMA QUEUE WORKER DEPLOYMENT GUIDE

---

## Running the Async Queue Worker

1. Start Ollama local service on port 11434 (`ollama serve`).
2. Run Queue Worker daemon:
   ```bash
   python D:\GURUKUL\backend\src\curriculum\ai\queue_worker.py
   ```
3. Worker claims pending AI jobs from Firestore, processes them via Gemma/Qwen, and persists completion results.
