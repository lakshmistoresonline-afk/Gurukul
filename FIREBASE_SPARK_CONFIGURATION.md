# GURUKUL AI — FIREBASE SPARK CONFIGURATION GUIDE

---

## 1. Free Tier Quota Limits & Optimization

- **Firestore Reads**: 50,000 / day
- **Firestore Writes**: 20,000 / day
- **Firestore Storage**: 1 GiB total
- **Authentication**: Unlimited active users (Email/Password & Anonymous)

## 2. Optimization Rules Applied

1. Client-side state caching in `studentProgressStore.ts` to prevent redundant reads on every page load.
2. Firestore writes use `setDoc(..., { merge: true })` on single document path `users/{uid}/progress/current`.
3. Application-managed progress cleanup instead of paid Firestore TTL extensions.
