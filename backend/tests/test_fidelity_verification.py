import os
import sys
import pytest
from pathlib import Path

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.curriculum.verification.fidelity_verifier import SourceFidelityVerifier
from src.curriculum.core.config import GurukulConfig

def test_verifier_word_counting():
    text = "Gurukul AI authoritative NCERT curriculum platform."
    assert SourceFidelityVerifier.count_words(text) == 6
    assert SourceFidelityVerifier.count_words("") == 0

def test_verifier_json_text_extraction():
    obj = {"title": "Chapter 1", "content": ["Hello", "World"]}
    extracted = SourceFidelityVerifier.extract_text_from_json_obj(obj)
    assert "Chapter 1" in extracted
    assert "Hello" in extracted
    assert "World" in extracted

def test_verify_fidelity_execution():
    if not GurukulConfig.get_content_root().exists():
        pytest.skip("Raw Contents root not present on CI runner")
    report = SourceFidelityVerifier.verify_fidelity()
    assert report["source_files_count"] > 0
    assert report["processed_files_count"] > 0
    assert report["fidelity_status"] == "PASS"
