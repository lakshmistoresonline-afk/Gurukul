# GURUKUL AI — API RESPONSE CONTRACT SPECIFICATION
**Date**: November 3, 2026  

---

## 1. Response JSON Schema (`TutorChatResponse`)

```json
{
  "status": "ONLINE",
  "mode": "NCERT_CHAPTER",
  "model": "ollama-cloud/gemma4:31b",
  "response": "Generated step-by-step educational answer...",
  "resolved_subject": "english",
  "resolved_chapter_id": "G6-ENG-U01-C01",
  "resolved_chapter_title": "A Bottle of Dew",
  "evidence": {
    "grade": "6",
    "subject": "english",
    "book": "english",
    "part": "main",
    "unit": "U01",
    "authoritative_chapter_id": "G6-ENG-U01-C01",
    "chapter_title": "A Bottle of Dew",
    "source_filename": "Class 6/English/Source Files/07-Overview.json",
    "source_location": "Chapter G6-ENG-U01-C01 Core Summary Section",
    "exact_source_passage": "Sage Mahipati guides Rama Natha...",
    "retrieval_method": "authoritative_token_overlap_scoring",
    "retrieval_score": 4,
    "relevance_decision": "HIGH_CONFIDENCE_MATCH",
    "provenance_validation_status": "VERIFIED_PASSAGE",
    "is_current_chapter": true
  },
  "media": null,
  "is_ai_generated": true,
  "uid": "user-a-uid"
}
```
