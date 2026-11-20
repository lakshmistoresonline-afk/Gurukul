import os
import sys
import pytest

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.curriculum.core.curriculum_identity import CurriculumIdentity
from src.curriculum.core.subject_registry import SubjectRegistry
from src.curriculum.core.content_immutability_test import ContentImmutabilityAuditor

def test_curriculum_identity_cache_key():
    identity = CurriculumIdentity(
        grade="6",
        subject="mathematics",
        book="main",
        part="none",
        unit="U01",
        chapter_id="G6-MAT-U01-C03",
        content_type="flashcards"
    )
    assert identity.to_cache_key() == "class6:mathematics:book:main:part:none:unit:u01:ch:g6-mat-u01-c03:ct:flashcards"

def test_subject_registry_normalization():
    assert SubjectRegistry.resolve_canonical_subject("Maths") == "mathematics"
    assert SubjectRegistry.resolve_canonical_subject("Social Science") == "social_science"
    assert SubjectRegistry.resolve_canonical_subject("EVS") == "science"
    assert SubjectRegistry.get_display_name("social_science") == "Social Science"

def test_content_immutability():
    contents_dir = os.path.join(backend_dir, "..", "Contents")
    if not os.path.exists(contents_dir):
        pytest.skip("Raw Contents root not present on CI runner")
    hashes = ContentImmutabilityAuditor.compute_directory_hashes(contents_dir)
    assert len(hashes) > 0
    assert ContentImmutabilityAuditor.verify_immutability(hashes) is True
