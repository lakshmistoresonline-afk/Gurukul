import os
import json
import urllib.request
import urllib.error
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
from ..core.curriculum_identity import CurriculumIdentity
from ..core.processed_content_resolver import ProcessedContentResolver

router = APIRouter(prefix="/api/v1/tutor", tags=["Contextual AI Tutor"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")

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

@router.post("/chat")
async def tutor_chat(req: TutorChatRequest):
    """
    Genuine backend-powered AI Tutor endpoint.
    Grounds answers in processed NCERT content using local Ollama.
    If Ollama is offline, returns status="OFFLINE" and explicit offline message without fake text.
    """
    # 1. Resolve chapter content context
    try:
        identity = CurriculumIdentity(
            grade=req.grade,
            subject=req.subject,
            book=req.book,
            part=req.part,
            unit=req.unit,
            chapter_id=req.chapter_id,
            content_type=req.content_type
        )
        content_data = ProcessedContentResolver.resolve_content(identity)
        context_str = json.dumps(content_data, ensure_ascii=False)[:3000]
    except Exception as e:
        context_str = f"Chapter {req.chapter_id} ({req.subject})"

    # Construct grounded prompt
    action_instruction = ""
    if req.action == "explain":
        action_instruction = "Explain this concept in simple terms for a Grade 5 student."
    elif req.action == "example":
        action_instruction = "Provide a real-world everyday example illustrating this concept."
    elif req.action == "quiz":
        action_instruction = "Generate a multiple-choice practice question based on this lesson."
    elif req.action == "help":
        action_instruction = "Provide step-by-step learning guidance for this concept."

    prompt = f"""
You are an expert NCERT Class 5 AI Tutor.
Subject: {req.subject.upper()}, Chapter: {req.chapter_id}
Lesson Context Excerpt:
{context_str}

Instruction: {action_instruction}
Student Question: {req.question}

Provide an age-appropriate, encouraging, and accurate answer grounded strictly in NCERT Class 5 curriculum.
"""

    # 2. Query Local Ollama Engine
    try:
        ollama_payload = json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }).encode("utf-8")

        req_obj = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=ollama_payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req_obj, timeout=5) as resp:
            res_data = json.loads(resp.read().decode("utf-8"))
            ai_text = res_data.get("response", "").strip()

            return {
                "status": "ONLINE",
                "model": OLLAMA_MODEL,
                "response": ai_text
            }

    except (urllib.error.URLError, ConnectionRefusedError, Exception) as e:
        return {
            "status": "OFFLINE",
            "response": "⚠️ AI Tutor is currently offline. Ensure local Ollama engine is running on port 11434.",
            "error_detail": str(e)
        }
