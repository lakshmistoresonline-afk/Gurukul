import sys
sys.path.insert(0, 'D:/GURUKUL/backend')

from src.curriculum.api.tutor import parse_qwen_validation_decision

val_text = """```json
{
  "decision": "APPROVED",
  "accuracy": "PASS",
  "curriculum_alignment": "PASS",
  "age_appropriateness": "PASS",
  "evidence_support": "PASS",
  "issues": []
}
```"""

res = parse_qwen_validation_decision(val_text)
print("REAL_OLLAMA_CLOUD_PARSE_RESULT:", res)
assert res["approved"] is True
print("✓ PARSE VERIFIED SUCCESSFUL!")
