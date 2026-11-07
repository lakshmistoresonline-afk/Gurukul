import urllib.request
import json
import time
import psutil

url = 'http://127.0.0.1:11434/api/chat'

questions = [
    ('Cold Start Test (Gemma)', 'What is 5 + 5? Answer in one sentence.'),
    ('Warm Request 1 (Science)', 'What is photosynthesis? Answer in one simple sentence.'),
    ('Warm Request 2 (Language)', 'What is an adjective? Answer in one simple sentence.')
]

print('=== PHASE 2 & 3: DIRECT OLLAMA GEMMA4 BENCHMARK ===')
for idx, (label, q_text) in enumerate(questions):
    ram_mb = psutil.virtual_memory().available / (1024 * 1024)
    cpu_pct = psutil.cpu_percent(interval=0.1)
    print(f"\n[{idx+1}/3] {label} (RAM Available: {ram_mb:.0f} MB | CPU: {cpu_pct}%)")

    t0 = time.time()
    payload = json.dumps({
        'model': 'gemma4:e2b-it-qat',
        'messages': [{'role': 'user', 'content': q_text}],
        'options': {'num_predict': 100},
        'stream': False
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            t1 = time.time()
            msg = data.get('message', {})
            text = msg.get('content', '').strip()
            print(f"  ✓ HTTP Status: {resp.status}")
            print(f"  ✓ Wall Time: {t1-t0:.2f}s | Total Duration: {data.get('total_duration', 0)/1e9:.2f}s | Load Duration: {data.get('load_duration', 0)/1e9:.2f}s")
            print(f"  ✓ Eval Count: {data.get('eval_count')} tokens")
            print(f"  ✓ Response Length: {len(text)} chars")
            print(f"  ✓ Non-Empty Output: \"{text}\"")
    except Exception as e:
        print(f"  ✗ Failed: {e}")
