import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from .curriculum_identity import CurriculumIdentity, ChapterRuntimeDTO
from .subject_registry import SubjectRegistry
from .config import GurukulConfig
from .content_validator import ContentValidator, ContentNotFoundError, ContentSchemaError, IdentityConflictError
from .curriculum_registry import CurriculumRegistry, CurriculumResolutionError

class ContentIntegrityError(Exception):
    """Raised when a processed content file contains malformed JSON or schema issues (HTTP 422)."""
    pass

class ChapterNotFoundError(Exception):
    """Raised when the target chapter folder does not exist (HTTP 404)."""
    pass

_CONTENT_CACHE: Dict[str, Dict[str, Any]] = {}

class ProcessedContentResolver:
    """
    Index-driven Authoritative ProcessedContent Resolver for Gurukul AI.
    Resolves strictly against CurriculumRegistry with fast in-memory caching.
    """

    @classmethod
    def resolve_content(cls, identity: CurriculumIdentity) -> Dict[str, Any]:
        if not identity.grade or not identity.subject or not identity.book or not identity.part or not identity.unit or not identity.chapter_id or not identity.content_type:
            raise ValueError("All 7 identity dimensions (grade, subject, book, part, unit, chapter_id, content_type) are strictly required.")

        cache_key = f"{identity.grade}:{identity.subject}:{identity.book}:{identity.part}:{identity.unit}:{identity.chapter_id}:{identity.content_type}"
        if cache_key in _CONTENT_CACHE:
            return _CONTENT_CACHE[cache_key]

        try:
            node = CurriculumRegistry.resolve_node(identity)
        except CurriculumResolutionError as cre:
            raise ChapterNotFoundError(str(cre))

        chapter_dir = Path(node["processed_path"])
        if not chapter_dir.exists() or not chapter_dir.is_dir():
            raise ChapterNotFoundError(f"Chapter path not found on disk: {chapter_dir}")

        # Validate manifest metadata against request identity (raises 409 IdentityConflictError if mismatch)
        ContentValidator.validate_manifest(chapter_dir, identity)

        if identity.content_type == "source_bundle":
            sections = {}
            for sec_name in node["available_content_types"]:
                sec_file = chapter_dir / f"{sec_name}.json"
                if sec_file.exists():
                    try:
                        sections[sec_name] = ContentValidator.validate_content_file(sec_file, identity)
                    except Exception as e:
                        raise ContentIntegrityError(str(e))
                else:
                    sections[sec_name] = None
            _CONTENT_CACHE[cache_key] = sections
            return sections

        if identity.content_type not in node["available_content_types"]:
            raise ContentNotFoundError(f"Content type '{identity.content_type}' not available for chapter {identity.chapter_id}.")

        content_file = chapter_dir / f"{identity.content_type}.json"
        try:
            res_data = ContentValidator.validate_content_file(content_file, identity)
            _CONTENT_CACHE[cache_key] = res_data
            return res_data
        except (ContentNotFoundError, ContentSchemaError):
            raise
        except Exception as e:
            raise ContentIntegrityError(str(e))
