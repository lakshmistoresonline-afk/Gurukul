# GURUKUL AI — CLOUDFLARE WORKER DEPLOYMENT GUIDE

---

## Deployment Steps

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
2. Deploy Worker:
   ```bash
   cd D:\GURUKUL\cloudflare-worker
   wrangler deploy
   ```
3. Test Gateway:
   ```bash
   curl https://gurukul-ai-always-available-gateway.workers.dev/health
   ```
