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

def test_scenario_1_photosynthesis_on_english():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Explain photosynthesis?"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]
    assert "papa's spectacles" not in res["response"].lower()

def test_scenario_2_adjectives_on_english():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Explain adjectives"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_3_fraction_addition_on_maths():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "Explain fraction addition"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_4_water_cycle_on_science():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain water cycle"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_5_gravity_on_english():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "What is gravity?"
    }, headers=auth_headers).json()
    assert res["mode"] in ["GENERAL_KNOWLEDGE", "NCERT_CROSS_SUBJECT"]

def test_scenario_6_who_wrote_this_chapter():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Who wrote this chapter?"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CHAPTER", "GENERAL_KNOWLEDGE"]

def test_scenario_7_photosynthesis_on_maths():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "Explain photosynthesis"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_8_nouns_on_science():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain nouns"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_9_photosynthesis_one_sentence():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Explain photosynthesis in one sentence"
    }, headers=auth_headers).json()
    assert res["mode"] in ["NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_scenario_10_tell_me_a_joke():
    res = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Tell me a joke"
    }, headers=auth_headers).json()
    assert res["mode"] in ["GENERAL_KNOWLEDGE", "CLARIFICATION_REQUIRED"]
