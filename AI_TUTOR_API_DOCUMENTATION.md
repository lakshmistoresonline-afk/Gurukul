# GURUKUL AI — AI TUTOR API DOCUMENTATION

---

## 1. Chat Endpoint

* **URL**: `POST /api/v1/tutor/chat`
* **Tags**: `Contextual AI Tutor`

### Request Body
```json
{
  "grade": "5",
  "subject": "english",
  "book": "english",
  "part": "main",
  "unit": "U01",
  "chapter_id": "G5-ENG-U01-C01",
  "content_type": "overview",
  "question": "Explain the story of Papa's Spectacles simply.",
  "action": "explain"
}
```

### Response Body
```json
{
  "status": "ONLINE",
  "model": "gemma4:e2b-it-qat",
  "response": "In Papa's Spectacles, Papa misplaces his reading glasses and searches all over the house..."
}
```

---

## 2. Selection Explanation Endpoint

* **URL**: `POST /api/v1/tutor/explain-selection`

### Request Body
```json
{
  "grade": "5",
  "subject": "science",
  "book": "science",
  "part": "main",
  "unit": "U01",
  "chapter_id": "G5-SCI-U01-C01",
  "selected_text": "Evaporation is the process where water turns into water vapor due to sun heat.",
  "action": "explain"
}
```
