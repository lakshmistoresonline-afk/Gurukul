import urllib.request
import json

key = 'fce4d2c167d446f48a8eff9a35db95ba.qSup05JaLWRJszdnP3EIKCjb'
url = 'https://ollama.com/api/chat'
models = ['glm-5.3-flash', 'glm-5.2', 'glm-5.3', 'deepseek-v4.1-flash', 'mimo-v2.6-flash', 'gpt-oss:20b', 'gpt-oss:120b', 'gemma4:31b', 'clef:27b']

for m in models:
    val_body = {
        'model': m,
        'messages': [
            {'role': 'user', 'content': 'Validate: Return JSON {"decision":"APPROVED","accuracy":"PASS","curriculum_alignment":"PASS","age_appropriateness":"PASS","evidence_support":"PASS","issues":[]}'}
        ],
        'stream': False
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(val_body).encode('utf-8'),
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            text = res.get('message', {}).get('content', '')
            print(f"Model: {m} => STATUS {resp.status} Output: '{text[:80]}'")
    except Exception as e:
        print(f"Model: {m} => ERR: {e}")
