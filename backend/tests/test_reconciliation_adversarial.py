import os
import sys
import pytest
from pathlib import Path

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.curriculum.verification.reconciliation_engine import ReconciliationEngine
from src.curriculum.core.config import GurukulConfig

def test_reconciliation_independent_inventories():
    if not GurukulConfig.get_content_root().exists():
        pytest.skip("Raw Contents root not present on CI runner")
    source_inv = ReconciliationEngine.build_source_inventory()
    processed_inv = ReconciliationEngine.build_processed_inventory()

    assert "items" in source_inv
    assert "items" in processed_inv
    assert len(source_inv["items"]) > 0
    assert len(processed_inv["items"]) > 0

    # Ensure source inventory never reads processed root files
    for item in source_inv["items"]:
        assert "ProcessedContent" not in item["source_file"]

    # Ensure processed inventory never reads content root files
    for item in processed_inv["items"]:
        assert "Contents" not in item["processed_path"]

def test_reconciliation_engine_execution():
    report = ReconciliationEngine.reconcile()
    assert report["reconciliation_status"] in ["PASS", "FAIL"]
    assert "missing_identities" in report
    assert "extra_identities" in report
    assert "identity_conflicts" in report
