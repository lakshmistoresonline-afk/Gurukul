import os
import json
import re
import ast
import math
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
from ..security.auth_service import get_current_user, AuthenticatedUser, validate_student_class_access

router = APIRouter(prefix="/api/v1/tutor", tags=["Contextual AI Tutor"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").strip() or "http://127.0.0.1:11434"

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4:e2b-it-qat")
OLLAMA_VALIDATION_MODEL = os.getenv("OLLAMA_VALIDATION_MODEL", "qwen3.5:2b-q4_K_M")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))
PUBLIC_MEDIA_BASE_URL = os.getenv("PUBLIC_MEDIA_BASE_URL", "/api/v1/curriculum/media/stream")

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
    engineMode: Optional[str] = "NCERT"

class MediaAssets(BaseModel):
    diagram: Optional[str] = None
    video: Optional[str] = None

def validate_tutor_model_config() -> None:
    gen_model = (OLLAMA_MODEL or "").strip()
    val_model = (OLLAMA_VALIDATION_MODEL or "").strip()
    if not gen_model or not val_model:
        raise HTTPException(
            status_code=503,
            detail="Local AI Tutor configuration is invalid: generation and validation models must be non-empty."
        )
    if gen_model == val_model:
        raise HTTPException(
            status_code=503,
            detail="Local AI Tutor configuration is invalid: generation and validation models must be distinct."
        )

def _reject_duplicate_keys_hook(pairs):
    d = {}
    for k, v in pairs:
        if k in d:
            raise ValueError(f"Duplicate key detected in JSON: {k}")
        d[k] = v
    return d

def _reject_non_standard_constants(val):
    raise ValueError(f"Non-standard JSON constant rejected: {val}")

def parse_qwen_validation_decision(raw_resp: str) -> dict:
    if not raw_resp or not isinstance(raw_resp, str):
        return {"approved": False, "decision": "REJECTED", "reason": "Empty validation response"}

    clean_resp = raw_resp.strip()

    # Strip markdown code fences if present around JSON payload
    if clean_resp.startswith("```json"):
        clean_resp = clean_resp[7:].strip()
    elif clean_resp.startswith("```"):
        clean_resp = clean_resp[3:].strip()
    if clean_resp.endswith("```"):
        clean_resp = clean_resp[:-3].strip()

    clean_resp = clean_resp.strip()

    if not (clean_resp.startswith("{") and clean_resp.endswith("}")):
        return {"approved": False, "decision": "REJECTED", "reason": "Response is not a raw standalone JSON object"}

    try:
        data = json.loads(
            clean_resp,
            object_pairs_hook=_reject_duplicate_keys_hook,
            parse_constant=_reject_non_standard_constants
        )
        if not isinstance(data, dict):
            return {"approved": False, "decision": "REJECTED", "reason": "JSON payload is not an object"}

        allowed_keys = {"decision", "accuracy", "curriculum_alignment", "age_appropriateness", "evidence_support", "issues"}
        if set(data.keys()) != allowed_keys:
            return {"approved": False, "decision": "REJECTED", "reason": "Invalid or missing 6-field JSON schema keys"}

        decision = data.get("decision")
        accuracy = data.get("accuracy")
        alignment = data.get("curriculum_alignment")
        age_app = data.get("age_appropriateness")
        ev_support = data.get("evidence_support")
        issues = data.get("issues")

        # Strict exact-type and exact-value checks (NO coercion or normalization)
        if type(decision) is not str or decision != "APPROVED":
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid decision field value/type: {decision}"}
        if type(accuracy) is not str or accuracy != "PASS":
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid accuracy field value/type: {accuracy}"}
        if type(alignment) is not str or alignment != "PASS":
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid curriculum_alignment field value/type: {alignment}"}
        if type(age_app) is not str or age_app != "PASS":
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid age_appropriateness field value/type: {age_app}"}
        if type(ev_support) is not str or ev_support != "PASS":
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid evidence_support field value/type: {ev_support}"}
        if type(issues) is not list or len(issues) != 0:
            return {"approved": False, "decision": "REJECTED", "reason": f"Invalid or non-empty issues list: {issues}"}

        return {"approved": True, "decision": "APPROVED", "reason": "Passed strict 6-field raw JSON validation gate"}
    except Exception as e:
        return {"approved": False, "decision": "REJECTED", "reason": f"Strict JSON parse error: {str(e)}"}

def safe_eval_arithmetic(expr_str: str) -> Optional[float]:
    """
    Evaluates arithmetic expressions using AST parsing without Python eval().
    Supports +, -, *, /, (), integers, and floats.
    """
    try:
        parsed = ast.parse(expr_str, mode='eval')
    except Exception:
        return None

    def _eval_node(node):
        if isinstance(node, ast.Expression):
            return _eval_node(node.body)
        elif isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return float(node.value)
            raise ValueError("Invalid constant type")
        elif isinstance(node, ast.UnaryOp):
            operand = _eval_node(node.operand)
            if isinstance(node.op, ast.UAdd):
                return +operand
            elif isinstance(node.op, ast.USub):
                return -operand
            else:
                raise ValueError("Invalid unary operator")
        elif isinstance(node, ast.BinOp):
            left = _eval_node(node.left)
            right = _eval_node(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            elif isinstance(node.op, ast.Sub):
                return left - right
            elif isinstance(node.op, ast.Mult):
                return left * right
            elif isinstance(node.op, ast.Div):
                if right == 0:
                    raise ValueError("Division by zero")
                return left / right
            elif isinstance(node.op, ast.Mod):
                if right == 0:
                    raise ValueError("Modulo by zero")
                return left % right
            else:
                raise ValueError("Invalid binary operator")
        else:
            raise ValueError("Unsupported AST node")

    try:
        res = _eval_node(parsed)
        if math.isnan(res) or math.isinf(res):
            return None
        return res
    except Exception:
        return None

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
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("OLLAMA_API_KEY", "")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    target_endpoint = f"{url}/api/chat" if not url.endswith("/api/chat") else url
    req_obj = urllib.request.Request(
        target_endpoint,
        data=payload,
        headers=headers,
        method="POST"
    )
    try:
        with urllib.request.urlopen(req_obj, timeout=timeout_sec) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as url_err:
        if "10061" in str(url_err) or "refused" in str(url_err).lower():
            raise HTTPException(
                status_code=503,
                detail=f"Local Ollama AI service is offline at {url}. Please run 'ollama serve' in your terminal or ensure your local Ollama engine is started."
            )
        raise

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
            content_root = GurukulConfig.get_content_root()

            source_file_rel = f"Class {grade}/{subj.title()}/Source Files/07-Overview.json"
            custom_file_rel = f"Class {grade}/{subj.title()}/Custom Files/07-Overview.json"

            src_abs = content_root / f"Class {grade}" / subj.title() / "Source Files" / "07-Overview.json"
            cust_abs = content_root / f"Class {grade}" / subj.title() / "Custom Files" / "07-Overview.json"

            target_abs_path = src_abs if src_abs.exists() else cust_abs if cust_abs.exists() else None
            used_rel_path = source_file_rel if src_abs.exists() else custom_file_rel if cust_abs.exists() else source_file_rel

            # Read and parse raw source file content on disk to isolate exact chapter record
            chapter_record_text = ""
            if target_abs_path and target_abs_path.exists():
                try:
                    with open(target_abs_path, "r", encoding="utf-8") as sff:
                        src_json = json.load(sff)
                        items = src_json if isinstance(src_json, list) else src_json.get("chapters", []) if isinstance(src_json, dict) else []
                        for item in items:
                            if isinstance(item, dict) and str(item.get("chapter_id", "")).strip().lower() == ch_id.lower():
                                chapter_record_text = json.dumps(item, ensure_ascii=False)
                                break
                except Exception:
                    chapter_record_text = ""

            passage_text = summary.strip()
            norm_passage = " ".join(passage_text.split())
            norm_record_content = " ".join(chapter_record_text.split())

            is_passage_verified = bool(norm_passage) and bool(norm_record_content) and (norm_passage in norm_record_content)

            if is_passage_verified:
                prov_status = "VERIFIED_PASSAGE"
            elif target_abs_path and target_abs_path.exists():
                prov_status = "FILE_EXISTS_PASSAGE_UNVERIFIED"
            else:
                prov_status = "UNVERIFIED"

            best_evidence = {
                "grade": grade,
                "subject": subj,
                "book": book,
                "part": part,
                "unit": unit,
                "authoritative_chapter_id": ch_id,
                "chapter_title": title,
                "source_filename": used_rel_path,
                "source_location": f"Chapter {ch_id} Core Summary Section",
                "exact_source_passage": summary[:600] if summary else full_passage[:600],
                "retrieval_method": "authoritative_token_overlap_scoring",
                "retrieval_score": score,
                "relevance_decision": "HIGH_CONFIDENCE_MATCH",
                "provenance_validation_status": prov_status,
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
    explicit_triggers = ["this lesson", "this chapter", "this story", "this poem", "current chapter", "active chapter", "author", "poet", "narrator", "main idea", "key concept", "lesson summary", "chapter overview", "moral of the story", "central theme"]
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
    validate_tutor_model_config()
    validate_student_class_access(current_user, str(req.grade))

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

    # 1b. Universal Math Expression Evaluator (Safe AST Parser without eval())
    q_math_clean = req.question.strip().lower().replace("x", "*").replace("÷", "/")
    if re.match(r'^[0-9\+\-\*\/\%\(\)\.\s]+$', q_math_clean) and any(op in q_math_clean for op in ['+', '-', '*', '/']):
        res_val = safe_eval_arithmetic(q_math_clean)
        if res_val is not None and isinstance(res_val, (int, float)):
            res_display = int(res_val) if isinstance(res_val, float) and res_val.is_integer() else round(res_val, 4)
            return {
                "status": "ONLINE",
                "mode": "MATH_EVALUATOR",
                "model": "Gurukul Precision Math Engine",
                "response": f"📐 **Step-by-Step Math Solution (Order of Operations)**\n\n**Problem**: `{req.question.strip()}`\n\n1. **Apply Order of Operations (PEMDAS / BODMAS)**: Parentheses ➔ Exponents ➔ Multiplication & Division (Left to Right) ➔ Addition & Subtraction (Left to Right).\n2. **Evaluation**: `{q_math_clean.replace('**', '^')}` = **{res_display}**\n\n✅ **Final Answer**: **{res_display}**",
                "resolved_subject": canon_subj,
                "resolved_chapter_id": ch_id,
                "is_ai_generated": True,
                "uid": current_user.uid
            }

    # 2. Try Local Ollama Engine first if available
    action_instruction = ""
    if req.action == "explain":
        action_instruction = f"Explain this concept in simple terms for a Grade {req.grade} student."
    elif req.action == "example":
        action_instruction = f"Provide a real-world everyday example illustrating this concept for Grade {req.grade}."
    elif req.action == "quiz":
        action_instruction = f"Generate a multiple-choice practice question based on this lesson for Grade {req.grade}."

    passage_text = evidence.get("exact_source_passage", "") if evidence else (content_data.get("summary") or content_data.get("overview") or content_data.get("core_summary") or "")[:300] if isinstance(content_data, dict) else ""

    if req.engineMode == "WORLD":
        mode = "GENERAL_KNOWLEDGE"
        prompt = f"""You are GURUKUL AI Universal World AI Engine. Answer the question accurately for a K-12 student on any topic in the world (Maths, Science, Space, Technology, Coding, History, World Knowledge).

Student Question: {req.question}
Instruction: {action_instruction}

Provide a clear, engaging, step-by-step answer for a student."""
    else:
        prompt = f"""You are an expert NCERT Class {req.grade} AI Tutor.
Response Mode: {mode}
Active Context: {canon_subj.upper()} ({ch_id})
Resolved Target Subject: {resolved_subj.upper()} ({resolved_ch_id})
Retrieved Evidence Passage: {passage_text}

Student Question: {req.question}
Instruction: {action_instruction}

If Mode is NCERT_CROSS_SUBJECT, explain the concept using the resolved {resolved_subj.upper()} curriculum passage. Never state that this topic belongs to the active {canon_subj.upper()} chapter.
If Mode is GENERAL_KNOWLEDGE, explain the concept accurately in general terms without claiming it is from an NCERT textbook.
If Mode is NCERT_CHAPTER, ground your answer in the active chapter context.
Provide a clear, step-by-step, encouraging answer."""

    try:
        ollama_payload = json.dumps({
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": prompt},
                {"role": "user", "content": req.question}
            ],
            "stream": False
        }).encode("utf-8")

        res_data = await asyncio.to_thread(_sync_query_ollama, OLLAMA_URL, ollama_payload, OLLAMA_TIMEOUT)
        msg_obj = res_data.get("message", {}) if isinstance(res_data, dict) else {}
        raw_content = msg_obj.get("content", "").strip()
        candidate_text = re.sub(r'<think>.*?</think>', '', raw_content, flags=re.DOTALL).strip()

        if not candidate_text:
            raise HTTPException(
                status_code=503,
                detail="Local Ollama AI service returned an empty generation response."
            )

        # Mandatory Validation Configuration Guard
        validate_tutor_model_config()

        # Stage 2: Qwen Validation Gate (OLLAMA_VALIDATION_MODEL) - Strictly Fail Closed
        evidence_passage = evidence.get("exact_source_passage", "") if evidence else passage_text
        source_file = evidence.get("source_filename", "N/A") if evidence else "N/A"
        chapter_title_val = evidence.get("chapter_title", "N/A") if evidence else "N/A"

        if req.engineMode == "WORLD":
            val_sys_prompt = f"You are GURUKUL AI Universal World Auditor. Validate if the candidate answer is educational, accurate, and suitable for a Grade {req.grade} student on any topic in the world.\nReturn strict JSON format ONLY: {{\n  \"decision\": \"APPROVED\",\n  \"accuracy\": \"PASS\",\n  \"curriculum_alignment\": \"PASS\",\n  \"age_appropriateness\": \"PASS\",\n  \"evidence_support\": \"PASS\",\n  \"issues\": []\n}}"
        else:
            val_sys_prompt = f"You are an NCERT Curriculum Auditor. Validate if the candidate answer is educational, accurate, and supported by NCERT evidence.\nCurriculum Identity: Grade {req.grade} | Subject: {canon_subj.upper()} | Book: {req.book.strip()} | Part: {req.part.strip()} | Unit: {req.unit.strip()} | Chapter ID: {ch_id} | Content Type: {req.content_type.strip()}\nRetrieved Source File: {source_file} ({chapter_title_val})\nRetrieved Source Passage: {evidence_passage}\n\nReturn strict JSON format ONLY: {{\n  \"decision\": \"APPROVED\",\n  \"accuracy\": \"PASS\",\n  \"curriculum_alignment\": \"PASS\",\n  \"age_appropriateness\": \"PASS\",\n  \"evidence_support\": \"PASS\",\n  \"issues\": []\n}}"

        val_payload = json.dumps({
            "model": OLLAMA_VALIDATION_MODEL,
            "messages": [
                {"role": "system", "content": val_sys_prompt},
                {"role": "user", "content": f"Student Question: {req.question}\nCandidate Answer: {candidate_text}"}
            ],
            "stream": False
        }).encode("utf-8")

        val_data = await asyncio.to_thread(_sync_query_ollama, OLLAMA_URL, val_payload, 60)
        raw_val = val_data.get("message", {}).get("content", "").strip() if isinstance(val_data, dict) else ""
        parsed_outcome = parse_qwen_validation_decision(raw_val)

        if not parsed_outcome.get("approved"):
            raise HTTPException(
                status_code=503,
                detail=f"Generated AI response was rejected by Qwen curriculum validation gate: {parsed_outcome.get('reason')}"
            )

        return {
            "status": "ONLINE",
            "mode": mode,
            "model": f"ollama/{OLLAMA_MODEL}",
            "response": candidate_text,
            "resolved_subject": resolved_subj,
            "resolved_chapter_id": resolved_ch_id,
            "resolved_chapter_title": evidence.get("chapter_title") if evidence else None,
            "evidence": evidence,
            "media": media_meta,
            "is_ai_generated": True,
            "uid": current_user.uid
        }
    except HTTPException:
        raise
    except Exception as ollama_err:
        raise HTTPException(
            status_code=503,
            detail=f"Local Ollama AI service is currently unavailable: {str(ollama_err)}"
        )

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
        "model": f"NCERT Class {req.grade} Grounded RAG Engine",
        "response": detailed_answer,
        "resolved_subject": resolved_subj,
        "resolved_chapter_id": resolved_ch_id,
        "resolved_chapter_title": evidence.get("chapter_title") if evidence else None,
        "evidence": evidence,
        "media": media_meta,
        "is_ai_generated": False,
        "uid": current_user.uid
    }
