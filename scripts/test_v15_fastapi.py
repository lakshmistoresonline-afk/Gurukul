import sys
import os
import json
import time

backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)
auth_headers = {"Authorization": "Bearer mock-token-user-a"}

test_cases = [
    ('1. English', 'english', 'G5-ENG-U01-C01', 'What is an adjective? Explain with two examples.'),
    ('2. Science', 'science', 'G5-SCI-U01-C01', 'What is photosynthesis? Explain simply.'),
    ('3. Mathematics', 'maths', 'G5-MAT-U01-C01', '3/4 + 1/4'),
    ('4. General Knowledge', 'science', 'G5-SCI-U01-C01', 'Why does rain occur?')
]

print("=== PHASE 5: REAL FASTAPI ENDPOINT VALIDATION ===")
for label, subj, ch_id, q_text in test_cases:
    print(f"\n--- {label}: \"{q_text}\" ---")
    t0 = time.time()
    res = client.post('/api/v1/tutor/chat', json={
        'grade': '5', 'subject': subj, 'book': subj, 'part': 'main', 'unit': 'U01', 'chapter_id': ch_id,
        'question': q_text
    }, headers=auth_headers)
    t1 = time.time()
    print(f"Status: {res.status_code} | Duration: {t1-t0:.2f}s")
    if res.status_code == 200:
        data = res.json()
        ans = data.get('response', '')
        has_thinking = 'Thinking Process' in ans or '<think>' in ans
        print(f"Model: {data.get('model')}")
        print(f"Mode: {data.get('mode')}")
        print(f"Is AI Generated: {data.get('is_ai_generated')}")
        print(f"Thinking Leaked?: {has_thinking}")
        print(f"Final Answer Length: {len(ans)}")
        print(f"Clean Student-Facing Response:\n{ans[:300]}")
    else:
        print(f"Error Detail: {res.json()}")
