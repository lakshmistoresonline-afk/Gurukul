# GURUKUL AI V15 — FINAL ANSWER EXTRACTION SPECIFICATION
**Date**: November 3, 2026  

---

## 1. Extraction Algorithm (`tutor.py`)

```python
msg_obj = res_data.get("message", {}) if isinstance(res_data, dict) else {}
raw_content = msg_obj.get("content", "").strip()
# Remove any think tags if present
ai_text = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL).strip()

if not ai_text:
    raise HTTPException(
        status_code=503,
        detail="Local Ollama AI service returned an empty generation response."
    )
```

- **Guaranteed Clean Text**: Returns ONLY clean student-facing answer text.
- **503 Failure**: If `message.content` is empty, raises `HTTPException(status_code=503)` without leaking reasoning.
