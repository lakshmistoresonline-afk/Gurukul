# GURUKUL AI — CHANGELOG
**Date**: November 3, 2026  

---

## 1. Summary of Changes

- **`frontend-nextjs/src/app/api/tutor/chat/route.ts`**: Added Next.js server-side API proxy to **Ollama Cloud (`gemma4:31b`)** bypassing browser CORS restrictions.
- **`frontend-nextjs/src/lib/webLlmClient.ts`**: Integrated Universal Math Expression Evaluator and Ollama Cloud proxy fallback chain.
- **`frontend-nextjs/src/app/tutor/page.tsx`**: Added dual mode switcher (NCERT Contextual AI Tutor vs. Universal World AI Engine).
- **`frontend-nextjs/src/app/practice/page.tsx`**: Re-bound Practice Arena to active selected grade (`Class 5`, `Class 6`, `Class 7`).
- **`frontend-nextjs/src/app/journey/page.tsx`**: Re-bound Learning Journey to active selected grade and chapter.
- **`frontend-nextjs/src/app/achievements/page.tsx`**: Re-bound Achievements to active selected grade chapter counts.
- **`frontend-nextjs/src/components/presentation/MathsNotesComponent.tsx`**: Handled `section_1_complete_textbook_notes` and step-by-step algorithms.
- **`frontend-nextjs/src/components/presentation/RendererRegistry.tsx`**: Registered explicit Class 6 and 7 keys and universal content type fallback.
- **`backend/src/curriculum/api/chapters.py`**: Added grade-aware local media streaming endpoint.
- **`backend/src/curriculum/api/tutor.py`**: Integrated Ollama Cloud (`gemma4:31b`) fallback and precision math evaluator.
- **`scripts/generate_all_media_manifests.py`**: Parsed 16 `source-artifact-map.csv` files and built `media-manifest.json` for Class 5, 6, 7.
- **`scripts/regenerate_hindi_diagram_images.py`**: Re-rendered 23 Devanagari Hindi diagram images with `Nirmala UI` font.
