import urllib.request
import json

key = 'fce4d2c167d446f48a8eff9a35db95ba.qSup05JaLWRJszdnP3EIKCjb'
url = 'https://ollama.com/api/chat'

# 1. Generation Test with gemma4:31b
gen_body = {
    'model': 'gemma4:31b',
    'messages': [{'role': 'user', 'content': 'What is photosynthesis in 2 simple sentences?'}],
    'stream': False
}
req1 = urllib.request.Request(
    url,
    data=json.dumps(gen_body).encode('utf-8'),
    headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req1, timeout=20) as resp1:
    res1 = json.loads(resp1.read().decode('utf-8'))
    gen_text = res1.get('message', {}).get('content', '')
    print("=== GEMMA GENERATION RESPONSE ===")
    print(gen_text)

# 2. Validation Test with gpt-oss:20b
val_body = {
    'model': 'gpt-oss:20b',
    'messages': [
        {'role': 'system', 'content': 'You are an auditor. Return JSON only: {"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'},
        {'role': 'user', 'content': f'Answer to validate: {gen_text}'}
    ],
    'stream': False
}
req2 = urllib.request.Request(
    url,
    data=json.dumps(val_body).encode('utf-8'),
    headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req2, timeout=20) as resp2:
    res2 = json.loads(resp2.read().decode('utf-8'))
    val_text = res2.get('message', {}).get('content', '')
    print("\n=== VALIDATION RESPONSE ===")
    print(val_text)
