import os
import sys
import pytest
from pathlib import Path

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.curriculum.verification.forensic_fidelity_verifier import ForensicFidelityVerifier
from src.curriculum.core.config import GurukulConfig

def test_adversarial_block_extraction_ignores_metadata():
    sample = {
        "id": "meta-123",
        "timestamp": "2026-10-07",
        "hash": "abc",
        "schema_version": "3.0.0",
        "title": "Authoritative Educational Text"
    }
    blocks = ForensicFidelityVerifier.extract_structured_blocks(sample)
    assert len(blocks) == 1
    assert blocks[0][1] == "Authoritative Educational Text"

def test_adversarial_normalization():
    raw = "  Authoritative   NCERT\nTextbook "
    normalized = ForensicFidelityVerifier.normalize_text(raw)
    assert normalized == "authoritative ncert textbook"

def test_adversarial_parse_source_file_metadata():
    rel = Path("Class 7/Maths I/Maths I Master.json")
    grade, subject, book, part, ct = ForensicFidelityVerifier.parse_source_file_metadata(rel)
    assert grade == "7"
    assert subject == "mathematics"
    assert book == "maths_i"
    assert part == "part1"
    assert ct == "master"

def test_forensic_verifier_corpus_execution():
    if not GurukulConfig.get_content_root().exists():
        pytest.skip("Raw Contents root not present on CI runner")
    report = ForensicFidelityVerifier.verify_corpus_fidelity()
    assert report["source_files_audited"] > 0
    assert "provenance_ledger" in report
