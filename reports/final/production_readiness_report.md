# GURUKUL AI — COMPUTATIONAL PRODUCTION GATE REPORT (FAIL-CLOSED PROVENANCE BOUND)
**Repository**: `https://github.com/lakshmistoresonline-afk/GURUKUL-AI.git`
**Branch**: `main`
**Tested Commit SHA**: `d7cb747ca387bb1a5ab595a71e0cdbe9a62374b6`
**Tested Tree SHA**: `d3c39a786bc8d9c6a8ee582a4624e32892d4bda7`
**Run ID**: `RUN_GATE_20261101_095915`
**Timestamp**: 2026-11-01T09:59:15.035336
**Overall Status**: **BLOCKED**
**Total Gates**: 20 | **Passed**: 18 | **Blocked**: 2 | **Failed**: 0

---

## 20 Mandatory Gurukul-Specific Gates Verification Matrix
| Category ID | Status | Exit Code | Duration (s) | Command | Evidence Path | Failure Reason |
|---|---|---|---|---|---|---|
| source immutability | **PASS** | 0 | 0.372076s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/src/curriculum/verification/fail_closed_immutability.py verify-source-integrity` | `D:\GURUKUL\reports\content-integrity\fail_closed_immutability_report.json` | `None` |
| source inventory | **PASS** | 0 | 0.35311s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/src/curriculum/processing/source_discovery.py` | `D:\GURUKUL\reports\source-inventory\source_inventory.json` | `None` |
| exact curriculum reconciliation | **PASS** | 0 | 1.024511s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/src/curriculum/verification/reconciliation_engine.py` | `D:\GURUKUL\reports\reconciliation\curriculum_reconciliation.md` | `None` |
| forensic fidelity | **PASS** | 0 | 4.575313s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/src/curriculum/verification/forensic_fidelity_verifier.py` | `D:\GURUKUL\reports\fidelity\source_fidelity_report.json` | `None` |
| schema validation | **PASS** | 0 | 1.747777s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_strict_schema_validation.py -v` | `D:\GURUKUL\backend\tests\test_strict_schema_validation.py` | `None` |
| processor coverage | **PASS** | 0 | 0.783299s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/src/curriculum/processors/processor_coverage_audit.py` | `D:\GURUKUL\reports\processors\processor_coverage_report.json` | `None` |
| processor contract tests | **PASS** | 0 | 1.735719s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_processor_contracts.py backend/tests/test_processor_registry_hardened.py -v` | `D:\GURUKUL\backend\tests\test_processor_contracts.py` | `None` |
| curriculum registry | **BLOCKED** | 1 | 2.014274s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_authoritative_registry.py backend/tests/test_curriculum_registry_hardened.py -v` | `D:\GURUKUL\backend\tests\test_authoritative_registry.py` | `Command exited with code 1: summary info =========================== FAILED back` |
| API contract tests | **BLOCKED** | 1 | 3.554465s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_authoritative_api_contracts_hardened.py backend/tests/test_api_integration.py -v` | `D:\GURUKUL\backend\tests\test_authoritative_api_contracts_hardened.py` | `Command exited with code 1: _api_resolve_valid_class7_maths_i FAILED backend\tes` |
| renderer coverage | **PASS** | 0 | 1.908962s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_curriculum_runtime.py -v` | `D:\GURUKUL\backend\tests\test_curriculum_runtime.py` | `None` |
| frontend typecheck | **PASS** | 0 | 40.457235s | `npm run build --prefix frontend-nextjs` | `D:\GURUKUL\frontend-nextjs\tsconfig.json` | `None` |
| frontend production build | **PASS** | 0 | 41.061403s | `npm run build --prefix frontend-nextjs` | `D:\GURUKUL\frontend-nextjs\.next` | `None` |
| real browser UAT | **PASS** | 0 | 0.249594s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/scripts/run_playwright_uat.py` | `D:\GURUKUL\reports\uat\playwright_uat_report.json` | `None` |
| authentication | **PASS** | 0 | 2.900856s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_real_firebase_auth.py -v` | `D:\GURUKUL\backend\tests\test_real_firebase_auth.py` | `None` |
| authorization | **PASS** | 0 | 2.918343s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_auth_security.py -v` | `D:\GURUKUL\backend\tests\test_auth_security.py` | `None` |
| WebSocket security | **PASS** | 0 | 3.142811s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_real_websocket_security.py -v` | `D:\GURUKUL\backend\tests\test_real_websocket_security.py` | `None` |
| CORS | **PASS** | 0 | 2.893694s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_cors_websocket_security.py -k test_cors -v` | `D:\GURUKUL\backend\tests\test_cors_websocket_security.py` | `None` |
| portability | **PASS** | 0 | 78.790877s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe backend/scripts/generate_portability_audit.py` | `D:\GURUKUL\reports\portability\path_portability_report.json` | `None` |
| provenance | **PASS** | 0 | 1.712998s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_rag_provenance.py backend/tests/test_rag_provenance_validation.py -v` | `D:\GURUKUL\backend\tests\test_rag_provenance.py` | `None` |
| cache/RAG isolation | **PASS** | 0 | 1.725083s | `C:\Users\srina\AppData\Local\Programs\Python\Python313\python.exe -m pytest backend/tests/test_cache_isolation.py backend/tests/test_rag_cache_collision.py -v` | `D:\GURUKUL\backend\tests\test_rag_cache_collision.py` | `None` |
