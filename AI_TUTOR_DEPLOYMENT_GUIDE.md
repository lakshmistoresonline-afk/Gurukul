# GURUKUL AI — PRODUCTION DEPLOYMENT GUIDE FOR AI TUTOR

---

## Deployment Architecture

1. **Self-Hosted Backend Instance**:
   - Host FastAPI application behind Gunicorn / Uvicorn workers.
   - Run Ollama as a local background systemd service (`ollama serve`) bound to `127.0.0.1:11434`.
2. **In-Browser WebGPU Acceleration**:
   - WebLLM client (`@mlc-ai/web-llm`) runs locally inside client browsers with zero server cost.
