# GURUKUL AI — UI RISK AND REGRESSION MATRIX
**Date**: November 4, 2026  

---

## 1. Risk Mitigation Matrix

- **Risk 1: Hardcoded Unit `U01` in Practice Arena**:
  - *Fix*: Dynamically look up `selectedChapterId` across all books and units in `getCurriculumHierarchy()`, resolving exact `book`, `part`, `unit`, and `chapter_id`.
- **Risk 2: Hardcoded Unit `U01` in AI Tutor**:
  - *Fix*: Dynamically look up `selectedChapterId` across all books and units in `getCurriculumHierarchy()`, resolving exact `book`, `part`, `unit`, and `chapter_id`.
- **Risk 3: Model Thinking Leaks in AI Tutor**:
  - *Fix*: Extract `msg.get("content")` exclusively. Never display `message.thinking` or internal reasoning processes.
- **Risk 4: Fixed Class 5 Totals in Achievements**:
  - *Fix*: Compute total chapters dynamically from `getCurriculumHierarchy()` for the active selected grade.
