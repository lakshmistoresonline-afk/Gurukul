import urllib.request
import json

key = 'fce4d2c167d446f48a8eff9a35db95ba.qSup05JaLWRJszdnP3EIKCjb'
url = 'https://ollama.com/api/chat'

sys_prompt = 'You are an NCERT Curriculum Auditor. Validate if candidate answer is accurate. Return strict raw JSON format ONLY:\n{\n  "decision": "APPROVED",\n  "accuracy": "PASS",\n  "curriculum_alignment": "PASS",\n  "age_appropriateness": "PASS",\n  "evidence_support": "PASS",\n  "issues": []\n}'

val_body = {
    'model': 'nemotron-3-nano:30b',
    'messages': [
        {'role': 'system', 'content': sys_prompt},
        {'role': 'user', 'content': 'Student Question: What is photosynthesis?\nCandidate Answer: Photosynthesis is the process plants use to make food using sunlight, water, and carbon dioxide.'}
    ],
    'options': {'num_predict': 150},
    'stream': False
}

req = urllib.request.Request(
    url,
    data=json.dumps(val_body).encode('utf-8'),
    headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        val_output = res.get('message', {}).get('content', '')
        print("=== NEMOTRON CLOUD VALIDATION OUTPUT ===")
        print(val_output)
except Exception as e:
    print("VAL_ERROR:", e)
