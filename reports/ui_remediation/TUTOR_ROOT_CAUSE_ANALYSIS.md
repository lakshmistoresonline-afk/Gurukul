# GURUKUL AI — TUTOR ROOT CAUSE ANALYSIS
**Date**: November 2, 2026  

---

## 1. Primary Root Cause Analysis

### Issue A: False Textbook Claims in General Knowledge Mode
- **Diagnosis**: The offline fallback response formatter in `webLlmClient.ts` contained a template string that forcibly appended the active subject name and chapter ID (`G5-ENG-U01-C01`) to all fallback responses.
- **Remediation**: Updated `sendHybridTutorChat` in `webLlmClient.ts` to output `🌿 **Understanding Photosynthesis (General Science)**` or `🌐 **General Educational Explanation**` without attributing the response to the active English chapter.

### Issue B: Subject Preset Misalignment
- **Diagnosis**: Preset suggestion cards in `app/tutor/page.tsx` were hardcoded to three fixed questions without checking the active subject.
- **Remediation**: Separated suggestions into **Questions about this chapter** (Main Idea, Real-World Example) and **Explore Other Subjects** (Cross-subject Science/Maths/General Knowledge questions).
