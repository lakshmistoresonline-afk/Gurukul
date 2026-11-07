import urllib.request
import json
import time

url = 'http://127.0.0.1:11434/api/chat'

payload = json.dumps({
    'model': 'gemma4:e2b-it-qat',
    'messages': [
        {'role': 'system', 'content': 'You are an expert NCERT Class 5 AI Tutor.'},
        {'role': 'user', 'content': 'What is photosynthesis? Explain in two short sentences.'}
    ],
    'stream': False
}).encode('utf-8')

print("=== PHASE 3: FRESH LIVE OLLAMA /api/chat REQUEST ===")
t0 = time.time()
req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        t1 = time.time()
        msg = data.get('message', {})
        text = msg.get('content', '').strip()
        thinking = msg.get('thinking', '')
        print(f"HTTP Status: {resp.status}")
        print(f"Model Name: {data.get('model')}")
        print(f"Wall-Clock Duration: {t1-t0:.2f}s")
        print(f"Done: {data.get('done')} | Done Reason: {data.get('done_reason')}")
        print(f"Prompt Eval Count: {data.get('prompt_eval_count')}")
        print(f"Eval Count: {data.get('eval_count')}")
        print(f"Response Length: {len(text)} chars")
        print(f"Thinking Present?: {bool(thinking)}")
        print(f"Raw Message Content:\n\"{text}\"")
except Exception as e:
    print(f"Live Ollama Request Error: {e}")
