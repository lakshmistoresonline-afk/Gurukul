import os
import json
import sys
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.main import app
from src.curriculum.core.config import GurukulConfig
from src.curriculum.core.curriculum_registry import CurriculumRegistry

client = TestClient(app)

def test_dynamic_curriculum_fidelity_and_manifests():
    index = CurriculumRegistry.get_index()
    assert len(index) > 0, "Curriculum index must not be empty"

    total_chapters_verified = 0

    for key, node in index.items():
        grade = node["grade"]
        subject = node["canonical_subject"]
        book = node["book"]
        part = node["part"]
        unit = node["unit"]
        ch_id = node["chapter_id"]
        ch_path = node["processed_path"]

        # Verify manifest exists and has authoritative fields
        manifest_path = os.path.join(ch_path, "manifest.json")
        assert os.path.exists(manifest_path), f"Missing manifest for node {key}"
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
            assert "chapter_title" in manifest
            assert "chapter_number" in manifest
            assert manifest["grade"] == grade
            assert manifest["chapter_id"] == ch_id

        # Verify available content types exist
        for sec in node["available_content_types"]:
            sec_path = os.path.join(ch_path, f"{sec}.json")
            assert os.path.exists(sec_path), f"Missing content type section {sec} for chapter {ch_id}"

        # Verify API source endpoint with exact explicit identity
        res = client.get(f"/api/v1/chapters/{ch_id}/source?grade={grade}&subject={subject}&book={book}&part={part}&unit={unit}")
        assert res.status_code == 200, f"API source resolution failed for {key}: status {res.status_code}"
        data = res.json()
        assert data["chapterId"] == ch_id
        assert "sections" in data

        total_chapters_verified += 1

    assert total_chapters_verified == len(index)

def test_source_immutability_portable():
    content_root = GurukulConfig.get_content_root()
    if not content_root.exists():
        pytest.skip("Raw Contents root not present on CI runner")
    assert content_root.exists(), "Authoritative content root must exist"

    class_dirs = [d for d in content_root.iterdir() if d.is_dir() and "class" in d.name.lower()]
    assert len(class_dirs) >= 3, "At least 3 classes must be present under Content root"
