import os
import json
from fastapi import APIRouter, HTTPException, Query, Path, Depends, Security
from typing import Dict, Any, List, Optional
from ..core.curriculum_identity import CurriculumIdentity, ChapterRuntimeDTO
from ..core.curriculum_registry import CurriculumRegistry, CurriculumResolutionError, ChapterNotFoundError as RegChapterNotFoundError, ContentNotFoundError as RegContentNotFoundError, ContentSchemaError as RegContentSchemaError, IdentityConflictError as RegIdentityConflictError, ManifestMissingError, ManifestMalformedError
from ..core.subject_registry import SubjectRegistry
from ..core.processed_content_resolver import ProcessedContentResolver, ChapterNotFoundError as ResolverChapterNotFoundError, ContentIntegrityError
from ..core.content_validator import ContentNotFoundError, ContentSchemaError, IdentityConflictError, ChapterNotFoundError
from ..core.config import GurukulConfig
from ..security.auth_service import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/api/v1", tags=["Hardened Authoritative Curriculum Pipeline"])

@router.options("/classes")
@router.options("/curriculum/classes")
async def classes_options():
    return {}

@router.get("/curriculum/secure-protected")
async def secure_protected_endpoint(user: AuthenticatedUser = Depends(get_current_user)):
    """
    Explicity protected curriculum endpoint enforcing authoritative authentication dependency.
    """
    return {
        "status": "authorized",
        "uid": user.uid,
        "email": user.email,
        "role": user.role
    }

@router.get("/curriculum/media")
async def get_subject_media_assets(
    grade: str = Query("5", description="Grade"),
    subject: str = Query(..., description="Subject name")
):
    canon_subj = SubjectRegistry.resolve_canonical_subject(subject)
    subj_folder_map = {
        "english": "English",
        "hindi": "Hindi",
        "mathematics": "Maths",
        "maths": "Maths",
        "science": "Science",
        "social_science": "Social"
    }
    subj_dir_name = subj_folder_map.get(canon_subj, subject.title())
    processed_root = GurukulConfig.get_processed_root()
    subj_dir = processed_root / f"Class {grade}" / subj_dir_name
    if not subj_dir.exists():
        subj_dir = processed_root / f"Class{grade}" / subj_dir_name

    media_data = {}
    video_data = {}

    media_file = subj_dir / "media_directory.json"
    if not media_file.exists():
        for ch in subj_dir.glob("G*"):
            if (ch / "media_directory.json").exists():
                media_file = ch / "media_directory.json"
                break

    if media_file.exists():
        try:
            with open(media_file, "r", encoding="utf-8") as f:
                media_data = json.load(f)
        except Exception as e:
            print(f"Error reading media_file: {e}")

    video_file = subj_dir / "studio_video_links.json"
    if not video_file.exists():
        for ch in subj_dir.glob("G*"):
            if (ch / "studio_video_links.json").exists():
                video_file = ch / "studio_video_links.json"
                break

    if video_file.exists():
        try:
            with open(video_file, "r", encoding="utf-8") as f:
                video_data = json.load(f)
        except Exception as e:
            print(f"Error reading video_file: {e}")

    return {
        "grade": grade,
        "subject": canon_subj,
        "media_directory": media_data,
        "studio_video_links": video_data
    }

@router.get("/curriculum/hierarchy")
@router.get("/classes")
async def get_curriculum_hierarchy():
    """
    Returns the complete, dynamic, authoritative curriculum hierarchy:
    Class → Subject → Book → Part → Unit → Chapter → Content Types.
    Derived purely from registry-authoritative metadata without fabricated fallback catalogs or static unit numbers.
    """
    tax = CurriculumRegistry.get_taxonomy()
    index = CurriculumRegistry.get_index()
    hierarchy = []

    for grade, subjects in sorted(tax.items()):
        grade_entry = {
            "grade": grade,
            "subjects": []
        }
        for subj_key, books_dict in subjects.items():
            display_subj = SubjectRegistry.get_display_name(subj_key)
            books_list = []
            for book_id, book_data in books_dict.items():
                part_id = book_data.get("part", "none")
                units_dict = book_data.get("units", {})
                units_list = []
                for unit_id, ch_ids in units_dict.items():
                    chapters_list = []
                    unit_number = None
                    unit_title = None

                    for ch_id in ch_ids:
                        node_key = f"{grade}:{subj_key}:{book_id}:{part_id}:{unit_id}:{ch_id}"
                        node = index.get(node_key)
                        if not node:
                            raise HTTPException(
                                status_code=500,
                                detail={
                                    "error": {
                                        "code": "AUTHORITATIVE_METADATA_MISSING",
                                        "message": f"Authoritative metadata missing for node key: {node_key}"
                                    }
                                }
                            )
                        if unit_number is None:
                            unit_number = int(node["unit_number"])
                        if unit_title is None:
                            unit_title = str(node["unit_title"])

                        chapters_list.append({
                            "chapter_id": ch_id,
                            "chapter_number": node["chapter_number"],
                            "chapter_title": node["chapter_title"],
                            "content_types": node["available_content_types"]
                        })

                    if unit_number is None or unit_title is None:
                        raise HTTPException(
                            status_code=500,
                            detail={
                                "error": {
                                    "code": "AUTHORITATIVE_METADATA_MISSING",
                                    "message": f"Unit number or unit title missing for unit {unit_id}"
                                }
                            }
                        )

                    units_list.append({
                        "unit_id": unit_id,
                        "unit_number": unit_number,
                        "unit_title": unit_title,
                        "chapters": chapters_list
                    })

                books_list.append({
                    "book_id": book_id,
                    "part": part_id,
                    "units": units_list
                })

            grade_entry["subjects"].append({
                "subject": display_subj,
                "canonical_subject": subj_key,
                "books": books_list
            })
        hierarchy.append(grade_entry)

    return hierarchy

@router.get("/classes/{grade}/subjects")
@router.get("/curriculum/classes/{grade}/subjects")
async def get_grade_subjects(grade: str):
    subjects = CurriculumRegistry.get_subjects(grade)
    return {"grade": grade, "subjects": subjects}

@router.get("/curriculum/resolve")
async def resolve_authoritative_content(
    grade: str = Query(..., description="Grade/Class"),
    subject: str = Query(..., description="Subject ID"),
    book: str = Query(..., description="Book identifier"),
    part: str = Query(..., description="Part identifier"),
    unit: str = Query(..., description="Unit identifier"),
    chapter_id: str = Query(..., description="Exact chapter ID"),
    content_type: str = Query(..., description="Content type")
):
    """
    Strictest Authoritative Resolution Endpoint:
    Requires complete 7 dimensions explicitly without inference, defaults, or fallback.
    """
    try:
        identity = CurriculumIdentity(
            grade=str(grade),
            subject=SubjectRegistry.resolve_canonical_subject(subject),
            book=book,
            part=part,
            unit=unit,
            chapter_id=chapter_id,
            content_type=content_type
        )
    except Exception as ve:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_CURRICULUM_IDENTITY",
                    "message": f"Malformed or missing identity parameters: {str(ve)}"
                }
            }
        )

    try:
        content_data = ProcessedContentResolver.resolve_content(identity)
    except (ChapterNotFoundError, ResolverChapterNotFoundError, RegChapterNotFoundError, CurriculumResolutionError) as cnf:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "CHAPTER_NOT_FOUND",
                    "message": str(cnf),
                    "identity": identity.model_dump()
                }
            }
        )
    except (ContentNotFoundError, RegContentNotFoundError) as cnf_type:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "CONTENT_TYPE_NOT_FOUND",
                    "message": str(cnf_type),
                    "identity": identity.model_dump()
                }
            }
        )
    except (IdentityConflictError, RegIdentityConflictError) as ice:
        raise HTTPException(
            status_code=409,
            detail={
                "error": {
                    "code": "IDENTITY_CONFLICT",
                    "message": str(ice),
                    "identity": identity.model_dump()
                }
            }
        )
    except (ContentSchemaError, RegContentSchemaError, ManifestMalformedError, ContentIntegrityError) as cse:
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "CONTENT_SCHEMA_INVALID",
                    "message": str(cse),
                    "identity": identity.model_dump()
                }
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": str(exc),
                    "identity": identity.model_dump()
                }
            }
        )

    return {
        "identity": identity.model_dump(),
        "contentType": content_type,
        "data": content_data,
        "status": "READY"
    }

@router.get("/chapters/{chapterId}/source")
async def get_chapter_direct_source_v2(
    chapterId: str,
    grade: str = Query(..., description="Grade/Class"),
    subject: str = Query(..., description="Subject ID"),
    book: str = Query(..., description="Book identifier"),
    part: str = Query(..., description="Part identifier"),
    unit: str = Query(..., description="Unit identifier")
):
    """
    Direct chapter bundle source endpoint requiring complete explicit identity.
    Returns authoritative unitNumber from the registry node (never hardcoded).
    """
    try:
        canonical_subj = SubjectRegistry.resolve_canonical_subject(subject)
        identity = CurriculumIdentity(
            grade=str(grade),
            subject=canonical_subj,
            book=book,
            part=part,
            unit=unit,
            chapter_id=chapterId,
            content_type="overview"
        )
    except Exception as ve:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_CURRICULUM_IDENTITY",
                    "message": f"Malformed or missing identity parameters: {str(ve)}"
                }
            }
        )

    try:
        dto: ChapterRuntimeDTO = CurriculumRegistry.load_chapter_bundle(identity)
    except (ChapterNotFoundError, ResolverChapterNotFoundError, RegChapterNotFoundError, CurriculumResolutionError) as e:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "CHAPTER_NOT_FOUND",
                    "message": str(e),
                    "identity": identity.model_dump()
                }
            }
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": str(exc),
                    "identity": identity.model_dump()
                }
            }
        )

    return {
        "chapterId": chapterId,
        "grade": grade,
        "subject": subject,
        "book": book,
        "part": part,
        "unit": unit,
        "chapterNumber": dto.chapter_number,
        "chapterTitle": dto.chapter_title,
        "unitNumber": dto.unit_number,
        "unitTitle": dto.unit_title,
        "sections": dto.data,
        "runtimeIdentity": dto.identity.model_dump()
    }
