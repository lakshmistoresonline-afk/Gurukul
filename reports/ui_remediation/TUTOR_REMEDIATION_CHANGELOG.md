# GURUKUL AI — TUTOR REMEDIATION CHANGELOG
**Date**: November 2, 2026  

---

## 1. Modified Files & Component Changes

- **`frontend-nextjs/src/lib/webLlmClient.ts`**: Replaced generic fallback response formatter with accurate `GENERAL_KNOWLEDGE` and `NCERT_CROSS_SUBJECT` explanation formatters. Added Photosynthesis concept handler.
- **`frontend-nextjs/src/app/tutor/page.tsx`**:
  - Rebuilt preset question cards into subject-aware & chapter-aware categories.
  - Applied light-theme styling (`bg-[#F5F6F8]`, `bg-white`, `border-slate-200`, `text-slate-900`).
  - Added speech synthesis toggle (`Read Aloud`), copy to clipboard (`Copy`), and rating feedback (`ThumbsUp`/`ThumbsDown`).
