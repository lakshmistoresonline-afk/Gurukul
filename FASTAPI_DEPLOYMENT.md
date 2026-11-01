# GURUKUL AI — FASTAPI BACKEND DEPLOYMENT GUIDE

---

## Server Setup

1. Start Uvicorn / Gunicorn server:
   ```bash
   cd D:\GURUKUL\backend
   python -m uvicorn src.main:app --host 127.0.0.1 --port 8001 --workers 4
   ```
2. Verify Health:
   `GET http://127.0.0.1:8001/api/v1/curriculum/hierarchy`
