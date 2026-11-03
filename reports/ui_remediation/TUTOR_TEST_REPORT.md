# GURUKUL AI — TUTOR TEST REPORT
**Date**: November 2, 2026  

---

## 1. Automated Test Execution Results

| Test Suite / Scope | Command Executed | Result / Output | Status |
|---|---|---|---|
| **Next.js Production Export** | `npm run build` | `✓ Generating static pages (12/12)` | **PASS** |
| **Backend Test Suite** | `python -m pytest backend/tests/ -v` | `151 passed in 238.48s (0:03:58)` | **PASS** |
| **Tutor Comprehensive Scenarios** | `pytest backend/tests/test_tutor_comprehensive_audit.py` | 10 / 10 scenarios passed | **PASS** |

---

## 2. Tested Scenarios

1. **Current Chapter Question**: *"What is the main idea of Papa's Spectacles?"* -> Grounded in English Chapter 1.
2. **Cross-Subject Question**: *"What is photosynthesis?"* -> Grounded in General Science / Cross-subject explanation without false English attribution.
3. **Maths Question**: *"How do I add two fractions with different denominators?"* -> Grounded in Maths explanation.
4. **General Knowledge**: *"Why is the sky blue?"* -> Grounded in 5th-grade general science explanation.
