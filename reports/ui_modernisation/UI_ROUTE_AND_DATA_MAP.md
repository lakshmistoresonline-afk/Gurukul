# GURUKUL AI — UI ROUTE AND DATA MAP
**Date**: November 4, 2026  

---

## 1. Route to API Data Mapping

| Route | Page Component | Primary API & State Data Source |
|---|---|---|
| `/` | `app/page.tsx` | `studentProgressStore.ts`, `getCurriculumHierarchy()` |
| `/subjects` | `app/subjects/page.tsx` | `getCurriculumHierarchy()`, `studentProgressStore.ts` |
| `/curriculum/[...slug]` | `CatchAllChapterClient.tsx` | `CurriculumApiClient.fetchContent()`, `media-manifest.json` |
| `/tutor` | `app/tutor/page.tsx` | `POST /api/v1/tutor/chat`, `sendHybridTutorChat()` |
| `/practice` | `app/practice/page.tsx` | `CurriculumApiClient.fetchContent({ content_type: 'quiz' })` |
| `/journey` | `app/journey/page.tsx` | `studentProgressStore.ts`, `getCurriculumHierarchy()` |
| `/discovery` | `app/discovery/page.tsx` | `media-manifest.json`, `/api/v1/curriculum/media/stream` |
| `/achievements` | `app/achievements/page.tsx` | `studentProgressStore.ts`, `getCurriculumHierarchy()` |
| `/library` | `app/library/page.tsx` | `studentProgressStore.ts`, `getCurriculumHierarchy()` |
