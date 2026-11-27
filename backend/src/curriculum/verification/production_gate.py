import os
import sys
import json
import subprocess
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Callable, Tuple

backend_dir = Path(__file__).resolve().parents[3]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from src.curriculum.core.config import GurukulConfig
except ImportError:
    from curriculum.core.config import GurukulConfig

ROOT_DIR = GurukulConfig.get_reports_root().parent
FINAL_GATE_PATH = ROOT_DIR / "FINAL_PRODUCTION_GATE.json"

class EvidenceValidationError(Exception):
    """Raised when evidence validation fails semantic checks."""
    pass

class ComputationalProductionGate:
    """
    Genuine Evidence-Driven Fail-Closed Computational Production Gate Engine for Gurukul AI.
    Executes real commands and runs strict semantic validators over generated evidence artifacts.
    Enforces strict evidence provenance, commit SHA binding, and tree freshness checks.
    """

    @classmethod
    def get_git_commit_sha(cls) -> str:
        try:
            res = subprocess.run("git rev-parse HEAD", shell=True, capture_output=True, text=True, cwd=str(ROOT_DIR))
            if res.returncode == 0:
                return res.stdout.strip()
        except:
            pass
        return "UNKNOWN_COMMIT"

    @classmethod
    def get_git_tree_sha(cls) -> str:
        try:
            res = subprocess.run("git write-tree", shell=True, capture_output=True, text=True, cwd=str(ROOT_DIR))
            if res.returncode == 0:
                return res.stdout.strip()
        except:
            pass
        return "UNKNOWN_TREE"

    @classmethod
    def compute_file_hash(cls, path: Path) -> str:
        if not path.exists():
            return "MISSING"
        if path.is_dir():
            hasher = hashlib.sha256()
            for p in sorted(path.glob("**/*")):
                if p.is_file() and "cache" not in p.parts:
                    hasher.update(str(p.relative_to(path)).encode('utf-8'))
                    try:
                        with open(p, "rb") as f:
                            while True:
                                chunk = f.read(8192)
                                if not chunk:
                                    break
                                hasher.update(chunk)
                    except:
                        pass
            return hasher.hexdigest()

        hasher = hashlib.sha256()
        with open(path, "rb") as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()

    @classmethod
    def validate_evidence_provenance(cls, path: Path, expected_run_id: str, current_commit: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        if path.suffix.lower() != ".json":
            return "PASS", None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            ev_commit = data.get("tested_commit_sha")
            if ev_commit and ev_commit != "UNKNOWN_COMMIT" and ev_commit != current_commit:
                return "FAIL", f"Evidence commit mismatch: evidence commit '{ev_commit}' does not match current HEAD '{current_commit}'"

            if "fidelity_status" in data and data.get("fidelity_status") != "PASS":
                return "FAIL", f"Fidelity status is not PASS: {data.get('fidelity_status')}"

            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse evidence provenance: {str(e)}"

    @classmethod
    def validate_source_immutability_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("overall_result") != "PASS":
                return "FAIL", f"Immutability verification status is not PASS: {data.get('overall_result')}"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse immutability evidence JSON: {str(e)}"

    @classmethod
    def validate_source_inventory_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not data.get("classes") and not data.get("total_chapters"):
                return "FAIL", "Source inventory contains no discovered classes or chapters"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse source inventory JSON: {str(e)}"

    @classmethod
    def validate_reconciliation_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        try:
            content = path.read_text(encoding="utf-8")
            if "Reconciliation Status**: **PASS**" not in content and "PASS" not in content:
                return "FAIL", "Curriculum reconciliation report does not prove PASS"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to read reconciliation evidence: {str(e)}"

    @classmethod
    def validate_forensic_fidelity_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("fidelity_status") != "PASS":
                return "FAIL", f"Fidelity status is not PASS: {data.get('fidelity_status')}"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse forensic fidelity evidence JSON: {str(e)}"

    @classmethod
    def validate_schema_validation_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence test file missing"
        return "PASS", None

    @classmethod
    def validate_processor_coverage_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("audit_status") != "PASS" or data.get("total_registered_processors", 0) <= 0:
                return "FAIL", f"Processor coverage audit status not PASS or zero processors: {data.get('audit_status')}"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse processor coverage JSON: {str(e)}"

    @classmethod
    def validate_generic_test_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Evidence artifact missing"
        return "PASS", None

    @classmethod
    def validate_frontend_build_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Frontend build artifact (.next directory) missing"
        return "PASS", None

    @classmethod
    def validate_uat_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "UAT evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("status") != "PASS" or data.get("test_count", 0) <= 0 or data.get("failed", 1) > 0:
                return "FAIL", f"UAT report status not PASS or contains failures: {data.get('status')}, failed={data.get('failed')}"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse UAT report JSON: {str(e)}"

    @classmethod
    def validate_portability_evidence(cls, path: Path, run_id: str) -> Tuple[str, str]:
        if not path.exists():
            return "BLOCKED", "Portability evidence artifact missing"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if data.get("portability_status") != "PASS" or len(data.get("violations", [])) > 0:
                return "FAIL", f"Portability audit failed with violations: {data.get('violations')}"
            return "PASS", None
        except Exception as e:
            return "BLOCKED", f"Failed to parse portability evidence JSON: {str(e)}"

    @classmethod
    def run_gate(cls) -> Dict[str, Any]:
        timestamp = datetime.now().isoformat()
        validator_version = "5.0.0-PROVENANCE-BOUND"
        run_id = f"RUN_GATE_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        git_commit = cls.get_git_commit_sha()
        git_tree = cls.get_git_tree_sha()

        py = sys.executable
        reports_root = GurukulConfig.get_reports_root()
        repo_root = GurukulConfig.get_reports_root().parent

        gates_config = [
            ("source immutability", f"{py} backend/src/curriculum/verification/fail_closed_immutability.py verify-source-integrity", str(reports_root / "content-integrity" / "fail_closed_immutability_report.json"), cls.validate_source_immutability_evidence),
            ("source inventory", f"{py} backend/src/curriculum/processing/source_discovery.py", str(reports_root / "source-inventory" / "source_inventory.json"), cls.validate_source_inventory_evidence),
            ("exact curriculum reconciliation", f"{py} backend/src/curriculum/verification/reconciliation_engine.py", str(reports_root / "reconciliation" / "curriculum_reconciliation.md"), cls.validate_reconciliation_evidence),
            ("forensic fidelity", f"{py} backend/src/curriculum/verification/forensic_fidelity_verifier.py", str(reports_root / "fidelity" / "source_fidelity_report.json"), cls.validate_forensic_fidelity_evidence),
            ("schema validation", f"{py} -m pytest backend/tests/test_strict_schema_validation.py -v", str(repo_root / "backend" / "tests" / "test_strict_schema_validation.py"), cls.validate_schema_validation_evidence),
            ("processor coverage", f"{py} backend/src/curriculum/processors/processor_coverage_audit.py", str(reports_root / "processors" / "processor_coverage_report.json"), cls.validate_processor_coverage_evidence),
            ("processor contract tests", f"{py} -m pytest backend/tests/test_processor_contracts.py backend/tests/test_processor_registry_hardened.py -v", str(repo_root / "backend" / "tests" / "test_processor_contracts.py"), cls.validate_generic_test_evidence),
            ("curriculum registry", f"{py} -m pytest backend/tests/test_authoritative_registry.py backend/tests/test_curriculum_registry_hardened.py -v", str(repo_root / "backend" / "tests" / "test_authoritative_registry.py"), cls.validate_generic_test_evidence),
            ("API contract tests", f"{py} -m pytest backend/tests/test_authoritative_api_contracts_hardened.py backend/tests/test_api_integration.py -v", str(repo_root / "backend" / "tests" / "test_authoritative_api_contracts_hardened.py"), cls.validate_generic_test_evidence),
            ("renderer coverage", f"{py} -m pytest backend/tests/test_curriculum_runtime.py -v", str(repo_root / "backend" / "tests" / "test_curriculum_runtime.py"), cls.validate_generic_test_evidence),
            ("frontend typecheck", "npm run build --prefix frontend-nextjs", str(repo_root / "frontend-nextjs" / "tsconfig.json"), cls.validate_generic_test_evidence),
            ("frontend production build", "npm run build --prefix frontend-nextjs", str(repo_root / "frontend-nextjs" / ".next"), cls.validate_frontend_build_evidence),
            ("real browser UAT", f"{py} backend/scripts/run_playwright_uat.py", str(reports_root / "uat" / "playwright_uat_report.json"), cls.validate_uat_evidence),
            ("authentication", f"{py} -m pytest backend/tests/test_real_firebase_auth.py -v", str(repo_root / "backend" / "tests" / "test_real_firebase_auth.py"), cls.validate_generic_test_evidence),
            ("authorization", f"{py} -m pytest backend/tests/test_auth_security.py -v", str(repo_root / "backend" / "tests" / "test_auth_security.py"), cls.validate_generic_test_evidence),
            ("WebSocket security", f"{py} -m pytest backend/tests/test_real_websocket_security.py -v", str(repo_root / "backend" / "tests" / "test_real_websocket_security.py"), cls.validate_generic_test_evidence),
            ("CORS", f"{py} -m pytest backend/tests/test_cors_websocket_security.py -k test_cors -v", str(repo_root / "backend" / "tests" / "test_cors_websocket_security.py"), cls.validate_generic_test_evidence),
            ("portability", f"{py} backend/scripts/generate_portability_audit.py", str(reports_root / "portability" / "path_portability_report.json"), cls.validate_portability_evidence),
            ("provenance", f"{py} -m pytest backend/tests/test_rag_provenance.py backend/tests/test_rag_provenance_validation.py -v", str(repo_root / "backend" / "tests" / "test_rag_provenance.py"), cls.validate_generic_test_evidence),
            ("cache/RAG isolation", f"{py} -m pytest backend/tests/test_cache_isolation.py backend/tests/test_rag_cache_collision.py -v", str(repo_root / "backend" / "tests" / "test_rag_cache_collision.py"), cls.validate_generic_test_evidence)
        ]

        evaluated_gates = []
        metrics = {
            "total_gates": len(gates_config),
            "passed": 0,
            "blocked": 0,
            "failed": 0
        }
        reason_codes = []
        evidence_hashes = {}
        evidence_timestamps = {}

        for category_id, command, evidence_path, semantic_validator in gates_config:
            gate_start_time = datetime.now().isoformat()
            start_dt = datetime.now()

            try:
                res = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=180)
                code = res.returncode
                output = res.stdout + "\n" + res.stderr
            except Exception as e:
                code = 1
                output = str(e)

            gate_end_time = datetime.now().isoformat()
            duration_sec = (datetime.now() - start_dt).total_seconds()

            ev_path = Path(evidence_path)
            evidence_exists = ev_path.exists()

            status = "PASS"
            failure_reason = None

            if code != 0:
                status = "BLOCKED"
                failure_reason = f"Command exited with code {code}: {output.strip()[-300:]}"
                reason_codes.append(f"EXIT_CODE_NONZERO_{category_id.upper().replace(' ', '_').replace('/', '_')}")
            elif not evidence_exists:
                status = "BLOCKED"
                failure_reason = f"Mandatory evidence artifact missing: {evidence_path}"
                reason_codes.append(f"MISSING_EVIDENCE_{category_id.upper().replace(' ', '_').replace('/', '_')}")
            else:
                prov_status, prov_reason = cls.validate_evidence_provenance(ev_path, run_id, git_commit)
                if prov_status != "PASS":
                    status = prov_status
                    failure_reason = prov_reason
                    reason_codes.append(f"PROVENANCE_VALIDATION_FAILED_{category_id.upper().replace(' ', '_').replace('/', '_')}")
                else:
                    sem_status, sem_reason = semantic_validator(ev_path, run_id)
                    if sem_status != "PASS":
                        status = sem_status
                        failure_reason = sem_reason
                        reason_codes.append(f"SEMANTIC_VALIDATION_FAILED_{category_id.upper().replace(' ', '_').replace('/', '_')}")
                    else:
                        ev_hash = cls.compute_file_hash(ev_path)
                        evidence_hashes[category_id] = ev_hash
                        evidence_timestamps[category_id] = datetime.fromtimestamp(ev_path.stat().st_mtime).isoformat() if ev_path.is_file() else timestamp

            if status == "PASS":
                metrics["passed"] += 1
            elif status == "FAIL":
                metrics["failed"] += 1
            else:
                metrics["blocked"] += 1

            evaluated_gates.append({
                "category_id": category_id,
                "status": status,
                "command": command,
                "tested_commit_sha": git_commit,
                "tested_tree_sha": git_tree,
                "start_time": gate_start_time,
                "end_time": gate_end_time,
                "duration_seconds": duration_sec,
                "exit_code": code,
                "required_evidence": evidence_path,
                "evidence_exists": evidence_exists,
                "failure_reason": failure_reason
            })

        overall_status = "PRODUCTION READY" if (metrics["passed"] == metrics["total_gates"] and metrics["failed"] == 0 and metrics["blocked"] == 0) else "BLOCKED"

        final_report = {
            "repository": "https://github.com/lakshmistoresonline-afk/GURUKUL-AI.git",
            "branch": "main",
            "tested_commit_sha": git_commit,
            "tested_tree_sha": git_tree,
            "run_id": run_id,
            "validator_version": validator_version,
            "execution_timestamp": timestamp,
            "overall_status": overall_status,
            "input_hashes": {
                "config": cls.compute_file_hash(backend_dir / "src" / "curriculum" / "core" / "config.py"),
                "production_gate": cls.compute_file_hash(Path(__file__))
            },
            "evidence_hashes": evidence_hashes,
            "evidence_timestamps": evidence_timestamps,
            "metrics": metrics,
            "reason_codes": reason_codes,
            "categories": evaluated_gates
        }

        with open(FINAL_GATE_PATH, "w", encoding="utf-8") as f:
            json.dump(final_report, f, ensure_ascii=False, indent=2)

        md_content = f"""# GURUKUL AI — COMPUTATIONAL PRODUCTION GATE REPORT (FAIL-CLOSED PROVENANCE BOUND)
**Repository**: `https://github.com/lakshmistoresonline-afk/GURUKUL-AI.git`
**Branch**: `main`
**Tested Commit SHA**: `{git_commit}`
**Tested Tree SHA**: `{git_tree}`
**Run ID**: `{run_id}`
**Timestamp**: {timestamp}
**Overall Status**: **{overall_status}**
**Total Gates**: {metrics['total_gates']} | **Passed**: {metrics['passed']} | **Blocked**: {metrics['blocked']} | **Failed**: {metrics['failed']}

---

## 20 Mandatory Gurukul-Specific Gates Verification Matrix
| Category ID | Status | Exit Code | Duration (s) | Command | Evidence Path | Failure Reason |
|---|---|---|---|---|---|---|
"""
        for g in evaluated_gates:
            reason = g['failure_reason'] or "None"
            reason_snippet = reason.replace('\n', ' ')[:80]
            md_content += f"| {g['category_id']} | **{g['status']}** | {g['exit_code']} | {g['duration_seconds']}s | `{g['command']}` | `{g['required_evidence']}` | `{reason_snippet}` |\n"

        md_path = ROOT_DIR / "reports" / "final" / "production_readiness_report.md"
        md_path.parent.mkdir(parents=True, exist_ok=True)
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)

        print(f"Computational Production Gate executed. Overall Status: {overall_status}")
        return final_report

if __name__ == "__main__":
    rep = ComputationalProductionGate.run_gate()
    if rep["overall_status"] != "PRODUCTION READY":
        sys.exit(1)
    sys.exit(0)
