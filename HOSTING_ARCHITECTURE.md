# GURUKUL AI — FREE-TIER HOSTING & AI QUEUE ARCHITECTURE

---

## 1. System Overview

GURUKUL AI is deployed using 100% Free-Tier Infrastructure:
- **Frontend Hosting**: Cloudflare Pages / Vercel (Next.js 14 Static Export).
- **Always-Available Edge Gateway**: Cloudflare Workers (`cloudflare-worker/src/index.ts`).
- **Database & Auth**: Firebase Spark Plan (Firestore + Auth).
- **Backend Server**: FastAPI (`backend/src/main.py`).
- **Async AI Queue Worker**: Python Ollama Worker (`backend/src/curriculum/ai/queue_worker.py`).
