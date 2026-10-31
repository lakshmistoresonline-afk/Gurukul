import os
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional
from .curriculum_identity import CurriculumIdentity, ChapterRuntimeDTO
from .subject_registry import SubjectRegistry
from .config import GurukulConfig

PROCESSED_ROOT = GurukulConfig.get_processed_root()
CONTENTS_ROOT = GurukulConfig.get_content_root()

class CurriculumResolutionError(Exception):
    pass

class ManifestMissingError(CurriculumResolutionError):
    """Raised when mandatory manifest.json is missing."""
    pass

class ManifestMalformedError(CurriculumResolutionError):
    """Raised when manifest.json contains malformed JSON or missing required authoritative fields/source mapping."""
    pass

class IdentityConflictError(CurriculumResolutionError):
    """Raised when directory identity, manifest identity, or source identity conflict."""
    pass

class ChapterNotFoundError(CurriculumResolutionError):
    """Raised when chapter cannot be resolved."""
    pass

class ContentMissingError(CurriculumResolutionError):
    """Raised when a mandatory content section file is missing."""
    pass

class ContentNotFoundError(CurriculumResolutionError):
    """Raised when requested content type is not found."""
    pass

class ContentSchemaError(CurriculumResolutionError):
    """Raised when content JSON has malformed syntax or schema violation."""
    pass

class ContentCorruptError(CurriculumResolutionError):
    """Raised when content JSON is null, empty, or structurally corrupt."""
    pass

class RegistryDuplicateKeyError(CurriculumResolutionError):
    """Raised when duplicate index keys or chapter IDs are detected."""
    pass

class SourceMismatchError(CurriculumResolutionError):
    """Raised when source hash mismatch or invalid source mapping occurs."""
    pass


class CurriculumRegistry:
    """
    Production-grade Manifest-Authoritative Index-Driven Curriculum Registry for Gurukul AI.
    Requires all mandatory identity dimensions and explicit authoritative source mapping explicitly in manifest.json.
    Raises IdentityConflictError or SourceMismatchError if directory, manifest, or source identities/hashes disagree.
    Zero synthetic synthesis or fallback defaults.
    """
    _INDEX: Optional[Dict[str, Dict[str, Any]]] = None

    @classmethod
    def get_taxonomy(cls) -> Dict[str, Any]:
        idx = cls.get_index()
        taxonomy = {}
        for node in idx.values():
            grade = node["grade"]
            subj = node["canonical_subject"]
            book = node["book"]
            part = node["part"]
            unit = node["unit"]
            ch_id = node["chapter_id"]

            if grade not in taxonomy:
                taxonomy[grade] = {}
            if subj not in taxonomy[grade]:
                taxonomy[grade][subj] = {}
            if book not in taxonomy[grade][subj]:
                taxonomy[grade][subj][book] = {
                    "part": part,
                    "units": {}
                }
            if unit not in taxonomy[grade][subj][book]["units"]:
                taxonomy[grade][subj][book]["units"][unit] = []
            if ch_id not in taxonomy[grade][subj][book]["units"][unit]:
                taxonomy[grade][subj][book]["units"][unit].append(ch_id)

        return taxonomy

    @classmethod
    def get_index(cls) -> Dict[str, Dict[str, Any]]:
        if cls._INDEX is None:
            cls.build_index()
        return cls._INDEX

    @classmethod
    def build_index(cls) -> Dict[str, Dict[str, Any]]:
        index = {}
        seen_keys = set()
        seen_chapter_ids = {}

        if not PROCESSED_ROOT.exists():
            cls._INDEX = index
            return index

        for class_dir in sorted([d for d in PROCESSED_ROOT.iterdir() if d.is_dir() and "class" in d.name.lower()]):
            dir_grade = class_dir.name.replace("Class", "").strip()

            for subj_dir in sorted([d for d in class_dir.iterdir() if d.is_dir()]):
                raw_subj = subj_dir.name
                dir_subject = SubjectRegistry.resolve_canonical_subject(raw_subj)

                for ch_dir in sorted([d for d in subj_dir.iterdir() if d.is_dir()]):
                    if ch_dir.name.lower() in ("images", "assets", "videos", "custom files"):
                        continue

                    dir_chapter_id = ch_dir.name
                    manifest_file = ch_dir / "manifest.json"
                    if not manifest_file.exists():
                        raise ManifestMissingError(f"Mandatory manifest.json missing in chapter directory: {ch_dir}")

                    try:
                        with open(manifest_file, "r", encoding="utf-8") as mf:
                            md = json.load(mf)
                    except json.JSONDecodeError as jde:
                        raise ManifestMalformedError(f"Malformed JSON in manifest.json at {manifest_file}: {str(jde)}")
                    except Exception as e:
                        raise ManifestMalformedError(f"Failed to read manifest.json at {manifest_file}: {str(e)}")

                    required_fields = [
                        "grade", "subject", "book", "part", "unit", "chapter_id",
                        "chapter_number", "chapter_title", "unit_number", "unit_title",
                        "source_files", "source_json_paths", "source_hashes", "source_identity"
                    ]
                    for rf in required_fields:
                        if rf not in md or md[rf] is None or md[rf] == "":
                            raise ManifestMalformedError(f"Manifest missing mandatory authoritative field or source mapping '{rf}' at {manifest_file}")

                    m_grade = str(md["grade"])
                    m_subject = SubjectRegistry.resolve_canonical_subject(str(md["subject"]))
                    m_book = str(md["book"])
                    m_part = str(md["part"])
                    m_unit = str(md["unit"])
                    m_chapter_id = str(md["chapter_id"])
                    m_chapter_number = int(md["chapter_number"])
                    m_chapter_title = str(md["chapter_title"])
                    m_unit_number = int(md["unit_number"])
                    m_unit_title = str(md["unit_title"])

                    source_files = md["source_files"]
                    source_json_paths = md["source_json_paths"]
                    source_hashes = md["source_hashes"]
                    source_identity = md["source_identity"]

                    if m_grade != dir_grade:
                        raise IdentityConflictError(f"Directory grade '{dir_grade}' conflicts with manifest grade '{m_grade}' at {manifest_file}")
                    if m_subject != dir_subject:
                        raise IdentityConflictError(f"Directory subject '{dir_subject}' conflicts with manifest subject '{m_subject}' at {manifest_file}")
                    if m_chapter_id != dir_chapter_id:
                        raise IdentityConflictError(f"Directory chapter ID '{dir_chapter_id}' conflicts with manifest chapter ID '{m_chapter_id}' at {manifest_file}")

                    if str(source_identity.get("grade")) != m_grade or \
                       SubjectRegistry.resolve_canonical_subject(str(source_identity.get("subject", source_identity.get("canonical_subject")))) != m_subject or \
                       str(source_identity.get("book")) != m_book or \
                       str(source_identity.get("chapter_id")) != m_chapter_id:
                        raise IdentityConflictError(f"Source identity in manifest conflicts with manifest authoritative identity at {manifest_file}")

                    for sf_rel, expected_hash in source_hashes.items():
                        sf_abs = CONTENTS_ROOT / Path(sf_rel)
                        if not sf_abs.exists():
                            raise SourceMismatchError(f"Authoritative source file declared in manifest does not exist: {sf_abs}")
                        hasher = hashlib.sha256()
                        with open(sf_abs, "rb") as sff:
                            while True:
                                chunk = sff.read(8192)
                                if not chunk:
                                    break
                                hasher.update(chunk)
                        current_hash = hasher.digest().hex()
                        if current_hash != expected_hash:
                            raise SourceMismatchError(f"Stale source hash detected for {sf_abs}: expected {expected_hash}, got {current_hash}")

                    book_chapter_key = f"{m_book}:{m_chapter_id}"
                    if book_chapter_key in seen_chapter_ids:
                        raise RegistryDuplicateKeyError(f"Duplicate chapter ID '{m_chapter_id}' detected under book '{m_book}'")
                    seen_chapter_ids[book_chapter_key] = True

                    available_content_types = []
                    for ct in ["overview", "notes", "master", "foundational", "flashcards", "mindmaps", "quiz", "question_papers"]:
                        if (ch_dir / f"{ct}.json").exists():
                            available_content_types.append(ct)

                    node = {
                        "grade": m_grade,
                        "canonical_subject": m_subject,
                        "book": m_book,
                        "part": m_part,
                        "unit": m_unit,
                        "chapter_id": m_chapter_id,
                        "chapter_number": m_chapter_number,
                        "chapter_title": m_chapter_title,
                        "unit_number": m_unit_number,
                        "unit_title": m_unit_title,
                        "available_content_types": available_content_types,
                        "source_files": source_files,
                        "source_json_paths": source_json_paths,
                        "source_hashes": source_hashes,
                        "source_identity": source_identity,
                        "processed_path": str(ch_dir)
                    }

                    key = f"{m_grade}:{m_subject}:{m_book}:{m_part}:{m_unit}:{m_chapter_id}"
                    if key in seen_keys:
                        raise RegistryDuplicateKeyError(f"Duplicate exact index key detected in CurriculumRegistry: {key}")
                    seen_keys.add(key)
                    index[key] = node

        cls._INDEX = index
        return index

    @classmethod
    def get_classes(cls) -> List[str]:
        idx = cls.get_index()
        return sorted(list(set(node["grade"] for node in idx.values())))

    @classmethod
    def get_subjects(cls, grade: str) -> List[str]:
        idx = cls.get_index()
        subs = set(node["canonical_subject"] for node in idx.values() if node["grade"] == str(grade))
        return sorted([SubjectRegistry.get_display_name(s) for s in subs])

    @classmethod
    def get_books(cls, grade: str, subject: str) -> List[str]:
        idx = cls.get_index()
        canonical_subject = SubjectRegistry.resolve_canonical_subject(subject)
        books = set(node["book"] for node in idx.values() if node["grade"] == str(grade) and node["canonical_subject"] == canonical_subject)
        return sorted(list(books))

    @classmethod
    def get_units(cls, grade: str, subject: str, book: str) -> List[str]:
        idx = cls.get_index()
        canonical_subject = SubjectRegistry.resolve_canonical_subject(subject)
        units = set(node["unit"] for node in idx.values() if node["grade"] == str(grade) and node["canonical_subject"] == canonical_subject and node["book"].lower() == book.lower())
        return sorted(list(units))

    @classmethod
    def get_chapters(cls, grade: str, subject: str, book: str, unit: str) -> List[str]:
        idx = cls.get_index()
        canonical_subject = SubjectRegistry.resolve_canonical_subject(subject)
        ch_ids = [node["chapter_id"] for node in idx.values() if node["grade"] == str(grade) and node["canonical_subject"] == canonical_subject and node["book"].lower() == book.lower() and node["unit"].upper() == unit.upper()]
        return sorted(list(set(ch_ids)))

    @classmethod
    def resolve_node(cls, identity: CurriculumIdentity) -> Dict[str, Any]:
        idx = cls.get_index()
        canonical_subject = SubjectRegistry.resolve_canonical_subject(identity.subject)

        key = f"{identity.grade}:{canonical_subject}:{identity.book}:{identity.part}:{identity.unit}:{identity.chapter_id}"

        if key not in idx:
            raise ChapterNotFoundError(f"Exact identity node {identity.to_cache_key()} not found in authoritative manifest index.")

        return idx[key]

    @classmethod
    def resolve_chapter_path(cls, identity: CurriculumIdentity) -> Path:
        node = cls.resolve_node(identity)
        ch_path = Path(node["processed_path"])

        if identity.content_type != "source_bundle":
            if identity.content_type not in node["available_content_types"]:
                raise ContentNotFoundError(f"Content type '{identity.content_type}' not available for chapter {identity.chapter_id}.")

        return ch_path

    @classmethod
    def resolve(cls, identity: CurriculumIdentity) -> Path:
        return cls.resolve_chapter_path(identity)

    @classmethod
    def load_chapter_bundle(cls, identity: CurriculumIdentity) -> ChapterRuntimeDTO:
        ch_path = cls.resolve_chapter_path(identity)
        node = cls.resolve_node(identity)

        sections = {}
        for sec_name in node["available_content_types"]:
            sec_file = ch_path / f"{sec_name}.json"
            if not sec_file.exists():
                raise ContentMissingError(f"Mandatory content section file '{sec_name}.json' missing for chapter {identity.chapter_id}.")
            try:
                with open(sec_file, "r", encoding="utf-8") as f:
                    content_json = json.load(f)
                    if content_json is None:
                        raise ContentCorruptError(f"Content section '{sec_name}.json' evaluated to null/None for chapter {identity.chapter_id}.")
                    sections[sec_name] = content_json
            except json.JSONDecodeError as jde:
                raise ContentSchemaError(f"Corrupt or malformed JSON in content section '{sec_name}.json' for chapter {identity.chapter_id}: {str(jde)}")
            except (ContentMissingError, ContentCorruptError, ContentSchemaError):
                raise
            except Exception as e:
                raise ContentCorruptError(f"Unexpected error loading content section '{sec_name}.json' for chapter {identity.chapter_id}: {str(e)}")

        dto = ChapterRuntimeDTO(
            identity=identity,
            chapter_number=node["chapter_number"],
            chapter_title=node["chapter_title"],
            unit_number=int(node["unit_number"]),
            unit_title=node["unit_title"],
            data=sections,
            status="READY"
        )
        return dto
