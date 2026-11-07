# GURUKUL AI — SECRET REMEDIATION & GIT HISTORY CLEANUP PLAN
**Date**: November 3, 2026  

---

## 1. Environment Variable Architecture

To prevent hardcoded credentials in tracked repository files:

1. **Local & Server Configuration (`.env`)**:
   Add `OLLAMA_API_KEY` to `.env` / `.env.local` (which is excluded from Git in `.gitignore`):
   ```bash
   OLLAMA_API_KEY="your_rotated_ollama_api_key_here"
   OLLAMA_CLOUD_MODEL="gemma4:31b"
   ```

2. **Next.js & FastAPI Access**:
   - `frontend-nextjs/src/app/api/tutor/chat/route.ts` reads `process.env.OLLAMA_API_KEY` server-side.
   - `backend/src/curriculum/api/tutor.py` reads `os.getenv("OLLAMA_API_KEY")` server-side.
   - Neither client-side JavaScript nor browser network responses expose the key.

---

## 2. Git History Cleanup Plan (Requires User Approval)

If the user requests removal of the credential from historical Git commits before merging to `main`:
1. Use `git filter-repo` or `BFG Repo-Cleaner` on the feature branch.
2. Replace all historical instances of the credential with `[REDACTED_KEY]`.
3. Require explicit approval before executing any forced history rewrite.
