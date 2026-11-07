import sys
import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from src.main import app

client = TestClient(app)
auth_headers = {"Authorization": "Bearer mock-token-user-b"} # User B is assigned to Class 5

# ====================================================
# CATEGORY A: MOCKED LOCAL OLLAMA SUCCESS TESTS (HTTP 200)
# ====================================================

VALID_QWEN_JSON = '{"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_scenario_1_photosynthesis_on_english(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "Photosynthesis is the process by which plants make food using sunlight and water."}},
        {"message": {"content": VALID_QWEN_JSON}}
    ]
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Explain photosynthesis?"
    }, headers=auth_headers)
    assert resp.status_code == 200
    res = resp.json()
    assert res["status"] == "ONLINE"
    assert res["mode"] in ["NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]
    assert res["is_ai_generated"] is True
    assert "photosynthesis" in res["response"].lower()
    assert "papa's spectacles" not in res["response"].lower()

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_scenario_2_adjectives_on_english(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "Adjectives are words that describe nouns, like 'bright' or 'funny'."}},
        {"message": {"content": VALID_QWEN_JSON}}
    ]
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "english", "book": "english", "part": "main", "unit": "U01", "chapter_id": "G5-ENG-U01-C01", "question": "Explain adjectives"
    }, headers=auth_headers)
    assert resp.status_code == 200
    res = resp.json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]
    assert res["is_ai_generated"] is True

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_scenario_3_fraction_addition_on_maths(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "To add fractions with common denominators, add top numbers and keep bottom number."}},
        {"message": {"content": VALID_QWEN_JSON}}
    ]
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "Explain fraction addition"
    }, headers=auth_headers)
    assert resp.status_code == 200
    res = resp.json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_scenario_4_water_cycle_on_science(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "Water cycle includes evaporation, condensation, and precipitation."}},
        {"message": {"content": VALID_QWEN_JSON}}
    ]
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain water cycle"
    }, headers=auth_headers)
    assert resp.status_code == 200
    res = resp.json()
    assert res["mode"] in ["NCERT_CHAPTER", "NCERT_CROSS_SUBJECT", "GENERAL_KNOWLEDGE"]

def test_precision_math_evaluator_direct():
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "2+3*2*9-15/3"
    }, headers=auth_headers)
    assert resp.status_code == 200
    res = resp.json()
    assert res["status"] == "ONLINE"
    assert res["mode"] == "MATH_EVALUATOR"
    assert "51" in res["response"]

# ====================================================
# CATEGORY B: AI UNAVAILABLE FAILURE TESTS (HTTP 503)
# ====================================================

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_ollama_timeout_returns_503(mock_ollama):
    mock_ollama.side_effect = Exception("Connection timed out after 30 seconds")
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain photosynthesis"
    }, headers=auth_headers)
    assert resp.status_code == 503
    assert "unavailable" in resp.json()["detail"].lower()

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_ollama_empty_response_returns_503(mock_ollama):
    mock_ollama.return_value = {"message": {"content": ""}}
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "science", "book": "science", "part": "main", "unit": "U01", "chapter_id": "G5-SCI-U01-C01", "question": "Explain gravity"
    }, headers=auth_headers)
    assert resp.status_code == 503
    assert "empty" in resp.json()["detail"].lower()

# ====================================================
# CATEGORY C: QWEN PARSER & MODEL CONFIGURATION TESTS
# ====================================================

@pytest.mark.parametrize("invalid_input", [
    'APPROVED',
    'NOT APPROVED',
    'UNAPPROVED',
    'APPROVED BUT FACTUALLY INCORRECT',
    'APPROVED WITH WARNINGS: INCORRECT',
    '',
    'Here is output: {"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision":"APPROVED","decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision":"APPROVED","accuracy":"FAIL","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":["Fact mismatch"]}',
    '{"decision": "APPROVED"}',
    '{"decision": "APPROVED", "accuracy": "PASS", "extra": "invalid"}',
    '{"decision": 123, "accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision": true, "accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision": NaN, "accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision": Infinity, "accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}',
    '{"decision": -Infinity, "accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'
])
def test_parse_qwen_validation_decision_rejections(invalid_input):
    from src.curriculum.api.tutor import parse_qwen_validation_decision
    res = parse_qwen_validation_decision(invalid_input)
    assert res["approved"] is False

def test_parse_qwen_validation_decision_strict():
    from src.curriculum.api.tutor import parse_qwen_validation_decision, validate_tutor_model_config
    import src.curriculum.api.tutor as tutor_module
    from fastapi import HTTPException

    valid_json = '{"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'
    assert parse_qwen_validation_decision(valid_json)["approved"] is True
    assert parse_qwen_validation_decision(f'```json\n{valid_json}\n```')["approved"] is True

    # Model Configuration Validation Tests
    orig_gen = tutor_module.OLLAMA_MODEL
    orig_val = tutor_module.OLLAMA_VALIDATION_MODEL
    try:
        tutor_module.OLLAMA_MODEL = ""
        with pytest.raises(HTTPException) as exc_info:
            validate_tutor_model_config()
        assert exc_info.value.status_code == 503

        tutor_module.OLLAMA_MODEL = "gemma4:e2b-it-qat"
        tutor_module.OLLAMA_VALIDATION_MODEL = "gemma4:e2b-it-qat"
        with pytest.raises(HTTPException) as exc_info2:
            validate_tutor_model_config()
        assert exc_info2.value.status_code == 503
    finally:
        tutor_module.OLLAMA_MODEL = orig_gen
        tutor_module.OLLAMA_VALIDATION_MODEL = orig_val

# ====================================================
# CATEGORY D: FIRESTORE CLASS-BASED ACCESS CONTROL TESTS
# ====================================================

def test_student_class_isolation_access_denied():
    # User B is assigned to Class 5, attempting to access Class 7 curriculum
    user_b_headers = {"Authorization": "Bearer mock-token-user-b"}
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "7", "subject": "maths", "book": "maths_i", "part": "part1", "unit": "U01", "chapter_id": "G7-MAT-U01-C01", "question": "Explain integers"
    }, headers=user_b_headers)
    assert resp.status_code == 403
    assert "Access Denied" in resp.json()["detail"]

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_student_class_isolation_access_granted(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "Fractions represent equal parts of a whole."}},
        {"message": {"content": '{"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'}}
    ]
    # User B is assigned to Class 5, requesting Class 5 curriculum
    user_b_headers = {"Authorization": "Bearer mock-token-user-b"}
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "5", "subject": "maths", "book": "maths", "part": "main", "unit": "U01", "chapter_id": "G5-MAT-U01-C01", "question": "Explain fractions"
    }, headers=user_b_headers)
    assert resp.status_code == 200

@patch("src.curriculum.api.tutor._sync_query_ollama")
def test_admin_bypass_class_isolation(mock_ollama):
    mock_ollama.side_effect = [
        {"message": {"content": "Integers include positive and negative whole numbers."}},
        {"message": {"content": '{"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'}}
    ]
    # Admin can access Class 7 content
    admin_headers = {"Authorization": "Bearer mock-token-admin"}
    resp = client.post("/api/v1/tutor/chat", json={
        "grade": "7", "subject": "maths", "book": "maths_i", "part": "part1", "unit": "U01", "chapter_id": "G7-MAT-U01-C01", "question": "Explain integers"
    }, headers=admin_headers)
    assert resp.status_code == 200

