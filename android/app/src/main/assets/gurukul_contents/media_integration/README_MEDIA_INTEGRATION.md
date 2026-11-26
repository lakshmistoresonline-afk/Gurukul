# Gurukul Media Integration — Corrected Audit

## Preservation guarantee
No original educational content, image, notebook JSON, media-directory JSON, or source-artifact CSV was edited. The normalized outputs are derived files. Each normalized record retains its source record/row.

## Verified archive totals
- Classes 5–10: 6 classes
- Class/subject folders: 37
- Notebook video records (Classes 5–9): 353
- Source-artifact-map rows: 1112
- Media-directory top-level records: 713
- Image files packaged: 380
- MP4 files packaged: 0

## Class 10
- Seven subject folders contain media-directory files.
- 65 Class 10 image files are physically packaged and mapped.
- 74 top-level media-directory records are present.
- There are no Class 10 notebook-video JSON files and no Class 10 MP4 files in this ZIP, consistent with the clarification that Class 10 videos have not yet been generated.
- Some Class 10 media-directory records declare future MP4 paths; these are references, not proof that a video exists.
- A 65-chapter video-generation backlog is provided in `class10_video_generation_backlog.json`. Each entry preserves the chapter/image reference and marks the video as `not_generated`.

## Fixes made in this derived integration layer
1. Parsed CSV mapping files with delimiter detection and wrapped-row recovery.
2. Standardized all mapping rows into one JSON structure, preserving each original row.
3. Resolved mapping references against all files in the corresponding subject folder, accounting for numeric export prefixes.
4. Created consistent media-directory records from top-level arrays without recursively double-counting nested fields.
5. Created a normalized notebook-video view while preserving the complete original record.
6. Applied two safe corrections only in the normalized view: a URL misplaced in `duration` and a URL misplaced in `video_title` were moved into normalized `video_link` when the source link field was empty or an artifact path. Original fields remain unchanged.
7. Generated a chapter-level cross-reference and validation report.

## Still requires external/source-owner action
- Three placeholder NotebookLM links need real share URLs.
- Two records have source status `Failed`; two have source status `Missing`.
- 32 notebook records have no chapter number. These include curriculum/subject overview entries as well as records with incomplete metadata; they should not be forced into chapter slots without confirmation. They should not be assigned to chapters without confirmation.
- 319 mapped MP4 references and nine mapped JSON references are not present in this archive. They may exist in external export folders; supply those files or confirm their external locations.
- Class 10 video production remains pending for the 65 chapter/image entries.
- The exact intended video output, language, duration, voice, style and whether to produce one video per chapter or one combined subject video must be confirmed before generation.

See `media_validation_report.json` for the detailed per-subject audit and outstanding issue list.
