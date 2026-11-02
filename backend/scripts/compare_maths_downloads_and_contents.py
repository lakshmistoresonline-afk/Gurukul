import os
import sys
import json
import hashlib
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.curriculum.core.config import GurukulConfig

ct_dir = GurukulConfig.get_content_root() / "Class 5" / "Maths"

print("==========================================================================")
print("DEEP FORENSIC AUDIT OF AUTHORITATIVE MATHEMATICS SOURCE FILES IN CONTENTS")
print("==========================================================================\n")
print(f"Verified Source Directory: {ct_dir}\n")

for fname in ["Master.json", "Notes.json", "Flashcards.json", "Mindmaps.json", "Quiz.json"]:
    ct_path = ct_dir / fname
    ct_exists = ct_path.exists()

    print(f"--- File: {fname} ---")
    print(f"  Contents Path Exists: {ct_exists}")

    if ct_exists:
        ct_bytes = ct_path.read_bytes()
        ct_sha = hashlib.sha256(ct_bytes).hexdigest()
        ct_size = len(ct_bytes)
        ct_json = json.loads(ct_bytes.decode("utf-8"))
        print(f"  Contents Size:  {ct_size:,} bytes | SHA256: {ct_sha[:16]}...")
        print(f"  Contents Top Keys:  {list(ct_json.keys()) if isinstance(ct_json, dict) else 'Array'}")

    print()
