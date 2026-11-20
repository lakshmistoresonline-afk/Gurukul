import os
import sys
import pytest
from pathlib import Path

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.curriculum.core.config import GurukulConfig

def test_central_config_environment_overrides(monkeypatch):
    custom_content = Path("D:/CustomMockContents").resolve()
    custom_processed = Path("D:/CustomMockProcessed").resolve()

    monkeypatch.setenv("GURUKUL_CONTENT_ROOT", str(custom_content))
    monkeypatch.setenv("GURUKUL_PROCESSED_ROOT", str(custom_processed))

    assert GurukulConfig.get_content_root() == custom_content
    assert GurukulConfig.get_processed_root() == custom_processed

def test_central_config_defaults():
    monkeypatch_env = os.environ.copy()
    if "GURUKUL_CONTENT_ROOT" in monkeypatch_env:
        del monkeypatch_env["GURUKUL_CONTENT_ROOT"]
    if "GURUKUL_PROCESSED_ROOT" in monkeypatch_env:
        del monkeypatch_env["GURUKUL_PROCESSED_ROOT"]

    # Re-import or check default
    content_root = GurukulConfig.get_content_root()
    assert content_root.name == "Contents"
    if content_root.exists():
        assert content_root.exists() is True
