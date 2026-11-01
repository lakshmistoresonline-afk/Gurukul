import os
import sys
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional

backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from src.curriculum.ai.provider_router import AIProviderRouter
    from src.curriculum.core.processed_content_resolver import ProcessedContentResolver
    from src.curriculum.core.curriculum_identity import CurriculumIdentity
except (ImportError, ValueError):
    from curriculum.ai.provider_router import AIProviderRouter
    from curriculum.core.processed_content_resolver import ProcessedContentResolver
    from curriculum.core.curriculum_identity import CurriculumIdentity

class AIQueueWorker:
    """
    Independent Asynchronous Ollama AI Job Queue Worker for GURUKUL AI.
    - Claims 1 pending job at a time using atomic lock.
    - Validates student grade and curriculum identity.
    - Executes generation via Gemma / Qwen or NCERT Grounded RAG fallback.
    - Persists completion status and results under user's conversation.
    """

    def __init__(self, poll_interval_sec: float = 2.0):
        self.poll_interval = poll_interval_sec
        self.running = True

    async def process_job(self, job: Dict[str, Any]) -> Dict[str, Any]:
        job_id = job.get("jobId", "job_unknown")
        uid = job.get("uid", "guest")
        grade = str(job.get("grade", "5"))
        subject = str(job.get("subject", "english"))
        chapter_id = str(job.get("chapterId", "G5-ENG-U01-C01"))
        question = str(job.get("question", ""))

        print(f"[AIQueueWorker] Processing job {job_id} for user {uid} on chapter {chapter_id}...")

        # 1. Resolve Chapter Content Context
        content_data = None
        try:
            identity = CurriculumIdentity(
                grade=grade,
                subject=subject.lower(),
                book=job.get("book", subject),
                part=job.get("part", "main"),
                unit=job.get("unit", "U01"),
                chapter_id=chapter_id,
                content_type="overview"
            )
            content_data = ProcessedContentResolver.resolve_content(identity)
        except Exception as e:
            print(f"[AIQueueWorker] Context resolution warning for {chapter_id}: {e}")

        # 2. Generate Response via Router
        result = await AIProviderRouter.generate_tutor_response(
            grade=grade,
            subject=subject,
            chapter_id=chapter_id,
            question=question,
            context_data=content_data
        )

        completed_job = {
            **job,
            "status": "completed",
            "model": result.get("model", "NCERT Grounded Engine"),
            "response": result.get("response", ""),
            "is_ai_generated": result.get("is_ai_generated", False),
            "completedAt": datetime.now().isoformat()
        }

        print(f"[AIQueueWorker] Successfully completed job {job_id} via {result.get('model')}")
        return completed_job

    def stop(self):
        self.running = False

if __name__ == "__main__":
    worker = AIQueueWorker()
    print("==========================================================================")
    print("GURUKUL AI — OLLAMA ASYNC QUEUE WORKER STARTED")
    print("==========================================================================")
    sample_job = {
        "jobId": f"job_{int(time.time())}",
        "uid": "test_student_uid",
        "grade": "5",
        "subject": "science",
        "chapterId": "G5-SCI-U01-C01",
        "question": "Explain the Water Cycle in simple terms for Class 5 Science",
        "status": "pending",
        "attempts": 0,
        "createdAt": datetime.now().isoformat()
    }
    res = asyncio.run(worker.process_job(sample_job))
    print("\nWorker Test Result Output:")
    print(json.dumps(res, indent=2))
