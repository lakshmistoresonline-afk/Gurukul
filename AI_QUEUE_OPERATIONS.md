# GURUKUL AI — AI QUEUE OPERATIONS & MONITORING GUIDE

---

## Job Status Lifecycle

`pending` ➔ `processing` (locked) ➔ `completed` / `failed`

- Atomic job locks prevent dual worker collisions.
- Max retries: 3 attempts.
- Stale lock timeout: 60 seconds.
