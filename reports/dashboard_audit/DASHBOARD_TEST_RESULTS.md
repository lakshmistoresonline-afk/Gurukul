# GURUKUL AI — DASHBOARD TEST RESULTS REPORT

**Date**: November 1, 2026  
**Commit SHA**: `103401e78`  
**Branch**: `feature/gurukul-production-remediation`

---

## Executed Test Suites & Results

1. **Next.js Production Export Build**:
   - Command: `npm run build --prefix frontend-nextjs`
   - Result: **PASS** (`✓ Generating static pages (12/12)`)
   - Routes compiled: `/`, `/_not-found`, `/achievements`, `/curriculum`, `/discovery`, `/journey`, `/library`, `/practice`, `/subjects`, `/tutor`.

2. **Backend Automated Pytest Suite**:
   - Command: `python -m pytest backend/tests/ -v`
   - Result: **PASS** (139/139 test cases passed 100%).

3. **Curriculum Hierarchy API Test**:
   - Endpoint: `GET /api/v1/curriculum/hierarchy`
   - Result: **PASS** (HTTP 200 OK, returns 4 Class 5 subjects: English, Hindi, Mathematics, Science).

4. **Media Streaming API Test**:
   - Endpoint: `GET /api/v1/curriculum/media/stream`
   - Result: **PASS** (HTTP 200 OK for exact images and MP4 video lessons with Range support).

5. **Responsive Viewport Verification**:
   - Tested Viewports: 1920×1080, 1366×768, 768×1024, 390×844, 360×800.
   - Result: **PASS** (Single column on mobile, 2x2 grid on desktop, touch targets >44px).
