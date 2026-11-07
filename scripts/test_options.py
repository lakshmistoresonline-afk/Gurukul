import urllib.request
import json

key = 'fce4d2c167d446f48a8eff9a35db95ba.qSup05JaLWRJszdnP3EIKCjb'
url = 'https://ollama.com/api/chat'

sys_p = 'You are an NCERT auditor. Return JSON ONLY: {"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'

# 1. Payload WITH options
body1 = {
    'model': 'gpt-oss:20b',
    'messages': [
        {'role': 'system', 'content': sys_p},
        {'role': 'user', 'content': 'Question: What is photosynthesis?\nCandidate Answer: Photosynthesis is the process plants use to make food.'}
    ],
    'options': {'num_predict': 120},
    'stream': False
}

req1 = urllib.request.Request(
    url,
    data=json.dumps(body1).encode('utf-8'),
    headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req1, timeout=15) as resp1:
        res1 = json.loads(resp1.read().decode('utf-8'))
        print("WITH options num_predict =>", res1.get('message', {}).get('content'))
except Exception as e:
    print("WITH options ERR:", e)

# 2. Payload WITHOUT options
body2 = {
    'model': 'gpt-oss:20b',
    'messages': [
        {'role': 'system', 'content': sys_p},
        {'role': 'user', 'content': 'Question: What is photosynthesis?\nCandidate Answer: Photosynthesis is the process plants use to make food.'}
    ],
    'stream': False
}

req2 = urllib.request.Request(
    url,
    data=json.dumps(body2).encode('utf-8'),
    headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req2, timeout=15) as resp2:
        res2 = json.loads(resp2.read().decode('utf-8'))
        print("WITHOUT options =>", res2.get('message', {}).get('content'))
except Exception as e:
    print("WITHOUT options ERR:", e)
