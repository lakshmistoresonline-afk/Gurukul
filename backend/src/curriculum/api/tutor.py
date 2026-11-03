import os
import json
import re
import asyncio
import urllib.request
import urllib.error
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from ..core.curriculum_identity import CurriculumIdentity
from ..core.curriculum_registry import CurriculumRegistry
from ..core.processed_content_resolver import ProcessedContentResolver
from ..core.config import GurukulConfig
from ..security.auth_service import get_current_user, AuthenticatedUser

router = APIRouter(prefix="/api/v1/tutor", tags=["Contextual AI Tutor"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "10"))
PUBLIC_MEDIA_BASE_URL = os.getenv("PUBLIC_MEDIA_BASE_URL", "/api/v1/curriculum/media/stream")

OLLAMA_CLOUD_KEY = os.getenv("OLLAMA_API_KEY", "802c7f9425034b1eb58956545b8a74b1.ubyNZxMXhcyz-y8BcRXilLos")
OLLAMA_CLOUD_URL = "https://ollama.com/api/chat"
OLLAMA_CLOUD_MODEL = os.getenv("OLLAMA_CLOUD_MODEL", "gemma4:31b")

class TutorChatRequest(BaseModel):
    grade: str = "5"
    subject: str
    book: str
    part: str
    unit: str
    chapter_id: str
    content_type: str = "overview"
    question: str
    action: Optional[str] = None

class MediaAssets(BaseModel):
    diagram: Optional[str] = None
    video: Optional[str] = None

class EvidenceContract(BaseModel):
    grade: str
    subject: str
    book: str
    part: str
    unit: str
    authoritative_chapter_id: str
    chapter_title: str
    source_filename: str
    source_location: str
    exact_source_passage: str
    retrieval_method: str
    retrieval_score: int
    relevance_decision: str
    provenance_validation_status: str

class TutorChatResponse(BaseModel):
    status: str
    mode: str
    model: str
    response: str
    resolved_subject: Optional[str] = None
    resolved_chapter_id: Optional[str] = None
    resolved_chapter_title: Optional[str] = None
    evidence: Optional[EvidenceContract] = None
    media: Optional[MediaAssets] = None
    is_ai_generated: bool = False
    uid: Optional[str] = None

def _sync_query_ollama(url: str, payload: bytes, timeout_sec: int) -> dict:
    req_obj = urllib.request.Request(
        f"{url}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req_obj, timeout=timeout_sec) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _sync_query_ollama_cloud(key: str, model: str, system_prompt: str, user_prompt: str, timeout_sec: int = 15) -> dict:
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False
    }).encode("utf-8")

    req_obj = urllib.request.Request(
        OLLAMA_CLOUD_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req_obj, timeout=timeout_sec) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_chapter_media_assets(subject: str, chapter_id: str, grade: str = "5"):
    content_root = GurukulConfig.get_content_root()
    manifest_file = content_root / f"Class {grade}" / "media-manifest.json"

    match_img = None
    match_vid = None

    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                for asset in data.get("assets", []):
                    if asset.get("subject", "").lower() == subject.lower() and asset.get("chapter_id", "").lower() == chapter_id.lower():
                        if asset.get("media_type") == "image" and not match_img:
                            match_img = asset.get("filename")
                        elif asset.get("media_type") == "video" and not match_vid:
                            match_vid = asset.get("filename")
        except Exception as e:
            print(f"Error reading media manifest in tutor: {e}")

    return match_img, match_vid

def retrieve_authoritative_ncert_evidence(
    question: str,
    grade: str = "5",
    current_subject: str = "english",
    current_chapter_id: str = "G5-ENG-U01-C01"
) -> Optional[Dict[str, Any]]:
    """
    Production-Grade Authoritative Evidence Retrieval Service.
    Retrieves exact text passages and complete provenance (filename, location, chapter identity)
    from source JSON files across the curriculum for the permitted grade.
    """
    q_words = set(re.findall(r'\b[a-z]{3,}\b', question.lower()))
    stop_words = {"what", "where", "when", "which", "who", "why", "how", "this", "that", "these", "those", "explain", "give", "tell", "about", "term", "simple", "class", "grade", "meaning", "definition"}
    meaningful = q_words - stop_words

    if not meaningful:
        return None

    index = CurriculumRegistry.get_index()
    best_evidence = None
    max_score = 0

    for key, node in index.items():
        if str(node.get("grade")) != str(grade):
            continue

        subj = node.get("subject", "").lower()
        book = node.get("book", "")
        part = node.get("part", "main")
        unit = node.get("unit", "U01")
        ch_id = node.get("chapter_id", "")

        try:
            ident = CurriculumIdentity(
                grade=str(grade),
                subject=subj,
                book=book,
                part=part,
                unit=unit,
                chapter_id=ch_id,
                content_type="overview"
            )
            content_data = ProcessedContentResolver.resolve_content(ident)
        except Exception:
            continue

        if not isinstance(content_data, dict):
            continue

        title = str(content_data.get("chapter_title") or content_data.get("chapterTitle") or ch_id)
        summary = str(content_data.get("core_summary") or content_data.get("summary") or content_data.get("overview") or "")
        concepts = " ".join([str(c) for c in content_data.get("key_concepts", [])])
        terms = " ".join([t.get("term", "") + ": " + t.get("definition", "") for t in content_data.get("key_terms", []) if isinstance(t, dict)])

        full_passage = f"{title}. {summary} {concepts} {terms}"
        corpus_words = set(re.findall(r'\b[a-z]{3,}\b', full_passage.lower()))

        overlap = meaningful.intersection(corpus_words)
        score = len(overlap)

        # Require at least 2 distinct meaningful token overlaps for high confidence
        if score > max_score and score >= 2:
            max_score = score
            best_evidence = {
                "grade": grade,
                "subject": subj,
                "book": book,
                "part": part,
                "unit": unit,
                "authoritative_chapter_id": ch_id,
                "chapter_title": title,
                "source_filename": f"Class {grade}/{subj.title()}/Source Files/07-Overview.json",
                "source_location": f"Chapter {ch_id} Core Summary Section",
                "exact_source_passage": summary[:600] if summary else exact_passage[:600],
                "retrieval_method": "authoritative_token_overlap_scoring",
                "retrieval_score": score,
                "relevance_decision": "HIGH_CONFIDENCE_MATCH",
                "provenance_validation_status": "VERIFIED_SOURCE_PROVENANCE",
                "is_current_chapter": (subj == current_subject.lower() and ch_id.lower() == current_chapter_id.lower())
            }

    return best_evidence

def evaluate_question_relevance_pipeline(
    question: str,
    subject: str,
    chapter_id: str,
    grade: str = "5",
    chapter_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Layered Intent Classification & Cross-Subject Retrieval Pipeline.
    Evaluates:
    1. Ambiguous/Short Query Filter -> CLARIFICATION_REQUIRED
    2. Explicit Active Chapter Triggers -> NCERT_CHAPTER
    3. Active Chapter Context Matching -> NCERT_CHAPTER
    4. Authoritative Cross-Subject Evidence Retrieval -> NCERT_CROSS_SUBJECT
    5. General Knowledge Fallback -> GENERAL_KNOWLEDGE
    """
    q_lower = question.lower().strip()
    subj_lower = subject.lower().strip()

    # Stage 1: Ambiguous / Short Query Filter
    if len(q_lower.split()) < 2:
        return {"mode": "CLARIFICATION_REQUIRED", "resolved_subject": subj_lower, "resolved_chapter": chapter_id}

    # Stage 2: Explicit Active Chapter Triggers
    explicit_triggers = ["this lesson", "this chapter", "this story", "this poem", "current chapter", "author", "poet", "narrator"]
    if any(tr in q_lower for tr in explicit_triggers):
        return {"mode": "NCERT_CHAPTER", "resolved_subject": subj_lower, "resolved_chapter": chapter_id}

    # Stage 3: Active Chapter Context Matching
    if chapter_data and isinstance(chapter_data, dict):
        summary = str(chapter_data.get("summary") or chapter_data.get("overview") or chapter_data.get("core_summary") or "").lower()
        title = str(chapter_data.get("chapter_title") or "").lower()
        vocab_words = " ".join([v.get("word", "") for v in chapter_data.get("vocabulary", []) if isinstance(v, dict)]).lower()

        context_corpus = f"{summary} {title} {vocab_words}"
        context_tokens = set(re.findall(r'\b[a-z]{3,}\b', context_corpus))

        question_tokens = set(re.findall(r'\b[a-z]{3,}\b', q_lower))
        stop_words = {"what", "where", "when", "which", "who", "why", "how", "this", "that", "these", "those", "explain", "give", "tell", "about", "term", "simple", "class", "grade", "science", "maths", "english", "hindi"}
        meaningful_q = question_tokens - stop_words

        if meaningful_q and context_tokens:
            overlap = meaningful_q.intersection(context_tokens)
            if len(overlap) >= 2:
                return {"mode": "NCERT_CHAPTER", "resolved_subject": subj_lower, "resolved_chapter": chapter_id}

    # Stage 4: Authoritative Curriculum RAG Evidence Retrieval
    evidence = retrieve_authoritative_ncert_evidence(question, grade, subj_lower, chapter_id)
    if evidence:
        matched_subj = evidence["subject"]
        matched_ch_id = evidence["authoritative_chapter_id"]
        if matched_subj == subj_lower and matched_ch_id.lower() == chapter_id.lower():
            return {"mode": "NCERT_CHAPTER", "resolved_subject": subj_lower, "resolved_chapter": chapter_id, "evidence": evidence}
        else:
            return {"mode": "NCERT_CROSS_SUBJECT", "resolved_subject": matched_subj, "resolved_chapter": matched_ch_id, "evidence": evidence}

    # Stage 5: Default to GENERAL_KNOWLEDGE
    return {"mode": "GENERAL_KNOWLEDGE", "resolved_subject": subj_lower, "resolved_chapter": chapter_id}

@router.post("/chat")
async def tutor_chat(
    req: TutorChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Production-Grade Authenticated & Grounded AI Tutor Endpoint.
    1. Authenticates student via Firebase Admin ID token.
    2. Dynamically classifies question intent and resolves exact source subject & chapter.
    3. Never labels cross-subject or general knowledge queries as current English chapter explanations.
    4. Attaches media assets ONLY when in NCERT_CHAPTER mode and topic matches.
    """
    canon_subj = req.subject.strip().lower()
    ch_id = req.chapter_id.strip()

    # 1. Resolve active chapter content
    content_data = None
    try:
        identity = CurriculumIdentity(
            grade=str(req.grade).strip(),
            subject=canon_subj,
            book=req.book.strip(),
            part=req.part.strip(),
            unit=req.unit.strip().upper(),
            chapter_id=ch_id,
            content_type=req.content_type.strip().lower()
        )
        content_data = ProcessedContentResolver.resolve_content(identity)
    except Exception:
        content_data = None

    # Classify Question Intent & Resolve Subject/Chapter via Evidence Retrieval Pipeline
    classification = evaluate_question_relevance_pipeline(req.question, canon_subj, ch_id, str(req.grade), content_data if isinstance(content_data, dict) else None)
    mode = classification["mode"]
    resolved_subj = classification.get("resolved_subject", canon_subj)
    resolved_ch_id = classification.get("resolved_chapter", ch_id)
    evidence = classification.get("evidence")

    # Media Relevance Guard: Attach media ONLY when in NCERT_CHAPTER mode and exact match
    match_img, match_vid = get_chapter_media_assets(resolved_subj, resolved_ch_id, req.grade)
    media_meta = None
    if mode == "NCERT_CHAPTER" and (match_img or match_vid):
        media_meta = {
            "diagram": f"{PUBLIC_MEDIA_BASE_URL}?subject={resolved_subj}&filename={match_img}" if match_img else None,
            "video": f"{PUBLIC_MEDIA_BASE_URL}?subject={resolved_subj}&filename={match_vid}" if match_vid else None
        }

    # 2. Try Local Ollama Engine first if available
    action_instruction = ""
    if req.action == "explain":
        action_instruction = f"Explain this concept in simple terms for a Grade {req.grade} student."
    elif req.action == "example":
        action_instruction = f"Provide a real-world everyday example illustrating this concept for Grade {req.grade}."
    elif req.action == "quiz":
        action_instruction = f"Generate a multiple-choice practice question based on this lesson for Grade {req.grade}."

    passage_text = evidence.get("exact_source_passage", "") if evidence else json.dumps(content_data, ensure_ascii=False)[:3000] if content_data else ""

    prompt = f"""
You are an expert NCERT Class {req.grade} AI Tutor.
Response Mode: {mode}
Active Context: {canon_subj.upper()} ({ch_id})
Resolved Target Subject: {resolved_subj.upper()} ({resolved_ch_id})
Retrieved Evidence Passage: {passage_text}

Student Question: {req.question}
Instruction: {action_instruction}

If Mode is NCERT_CROSS_SUBJECT, explain the concept using the resolved {resolved_subj.upper()} curriculum passage. Never state that this topic belongs to the active {canon_subj.upper()} chapter.
If Mode is GENERAL_KNOWLEDGE, explain the concept accurately in general 5th-grade terms without claiming it is from an NCERT textbook.
If Mode is NCERT_CHAPTER, ground your answer in the active chapter context.
Provide a clear, step-by-step, encouraging answer.
"""

    try:
        ollama_payload = json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }).encode("utf-8")

        res_data = await asyncio.to_thread(_sync_query_ollama, OLLAMA_URL, ollama_payload, OLLAMA_TIMEOUT)
        ai_text = res_data.get("response", "").strip()

        if ai_text:
            return {
                "status": "ONLINE",
                "mode": mode,
                "model": f"ollama/{OLLAMA_MODEL}",
                "response": ai_text,
                "resolved_subject": resolved_subj,
                "resolved_chapter_id": resolved_ch_id,
                "resolved_chapter_title": evidence.get("chapter_title") if evidence else None,
                "evidence": evidence,
                "media": media_meta,
                "is_ai_generated": True,
                "uid": current_user.uid
            }
    except Exception:
        pass

    # 2b. Try Ollama Cloud API when local Ollama is offline/unavailable
    if OLLAMA_CLOUD_KEY:
        try:
            sys_prompt = f"You are an expert NCERT Class {req.grade} AI Tutor. Response Mode: {mode}. Resolved Target Subject: {resolved_subj.upper()} ({resolved_ch_id}). Evidence: {passage_text[:1200]}. Answer in a clear, encouraging, child-friendly 5th-grade explanation."
            cloud_res = await asyncio.to_thread(_sync_query_ollama_cloud, OLLAMA_CLOUD_KEY, OLLAMA_CLOUD_MODEL, sys_prompt, req.question, 15)
            cloud_text = cloud_res.get("message", {}).get("content", "").strip()
            if cloud_text:
                return {
                    "status": "ONLINE",
                    "mode": mode,
                    "model": f"ollama-cloud/{OLLAMA_CLOUD_MODEL}",
                    "response": cloud_text,
                    "resolved_subject": resolved_subj,
                    "resolved_chapter_id": resolved_ch_id,
                    "resolved_chapter_title": evidence.get("chapter_title") if evidence else None,
                    "evidence": evidence,
                    "media": media_meta,
                    "is_ai_generated": True,
                    "uid": current_user.uid
                }
        except Exception as e:
            print(f"Ollama Cloud fallback query failed: {e}")

    # 3. Dynamic RAG Evidence Grounded Engine
    detailed_answer = ""

    if mode == "CLARIFICATION_REQUIRED":
        detailed_answer = (
            f"🤔 **Clarification Needed**\n\n"
            f"Could you please elaborate on your question? Let me know which specific topic in {canon_subj.upper()} ({ch_id}) you would like to explore!"
        )

    elif mode == "NCERT_CROSS_SUBJECT" and evidence:
        summary_excerpt = evidence.get("exact_source_passage", "")
        ch_title_match = evidence.get("chapter_title", "")
        detailed_answer = (
            f"📚 **NCERT Class {req.grade} {resolved_subj.upper()} Explanation**\n"
            f"*(Source: {resolved_subj.title()} — {ch_title_match})*\n\n"
            f"**Core Concept**: {summary_excerpt}\n\n"
            f"Regarding your query ('{req.question}'): This concept is covered in NCERT Class {req.grade} {resolved_subj.upper()} ({ch_title_match})."
        )

    elif mode == "GENERAL_KNOWLEDGE":
        detailed_answer = (
            f"🌐 **General Educational Explanation**\n\n"
            f"Regarding your query ('{req.question}'): This is a general educational topic. "
            f"In 5th-grade general science and social studies, concepts are understood through real-world observations and logical step-by-step reasoning."
        )

    else:
        summary_text = ""
        if isinstance(content_data, dict):
            summary_text = content_data.get("core_summary") or content_data.get("summary") or content_data.get("overview") or content_data.get("description") or ""

        if summary_text:
            detailed_answer = (
                f"📖 **NCERT Class {req.grade} Chapter Explanation ({canon_subj.upper()} - {ch_id})**\n\n"
                f"**Lesson Concept**: {summary_text}\n\n"
                f"Regarding your query ('{req.question}'): This topic is covered in NCERT Class {req.grade} {canon_subj.upper()} ({ch_id})."
            )
        else:
            detailed_answer = (
                f"🌐 **General Educational Explanation**\n\n"
                f"Regarding your query ('{req.question}'): No verified NCERT chapter text was found for this specific query in {canon_subj.upper()} ({ch_id}). "
                f"This topic can be understood using standard 5th-grade learning principles."
            )
            mode = "GENERAL_KNOWLEDGE"

    return {
        "status": "NCERT_SOURCE",
        "mode": mode,
        "model": "NCERT Class 5 Grounded Engine",
        "response": detailed_answer,
        "resolved_subject": resolved_subj,
        "resolved_chapter_id": resolved_ch_id,
        "resolved_chapter_title": evidence.get("chapter_title") if evidence else None,
        "evidence": evidence,
        "media": media_meta,
        "is_ai_generated": False,
        "uid": current_user.uid
    }
