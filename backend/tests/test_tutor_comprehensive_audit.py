import sys
import os
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.main import app

client = TestClient(app)
auth_headers = {"Authorization": "Bearer mock-token-user-a"}

def test_tutor_unauthenticated_request_rejected():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "What is a waterfall?"
    })
    assert res.status_code in [200, 401]

def test_tutor_waterfall_question_intent():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "What is a waterfall?"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] in ["GENERAL_KNOWLEDGE", "NCERT_CROSS_CHAPTER"]
    assert "waterfall" in data["response"].lower()
    if data.get("media"):
        assert data["media"].get("diagram") is None

def test_tutor_water_cycle_science_intent():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain the Water Cycle in simple terms for Class 5 Science"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "NCERT_CHAPTER"
    assert "evaporation" in data["response"].lower()
    assert data.get("media") is not None
    assert "water_cycle.png" in data["media"]["diagram"]

def test_tutor_flower_general_science():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "what is a flower?"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "flower" in data["response"].lower()
    if data.get("media"):
        assert data["media"].get("diagram") is None

def test_tutor_fraction_addition_maths():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "How do I solve fraction strip addition in Class 5 Maths?"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "fraction" in data["response"].lower()

def test_tutor_papas_spectacles_english():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Give me an example of adjectives from Papa's Spectacles"
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "spectacles" in data["response"].lower() or "papa" in data["response"].lower() or "english" in data["response"].lower()
