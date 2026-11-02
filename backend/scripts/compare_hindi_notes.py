import os
import sys
import json
import hashlib
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.curriculum.core.config import GurukulConfig

ct_path = GurukulConfig.get_content_root() / "Class 5" / "Hindi" / "Notes.json"
if ct_path.exists():
    ct_bytes = ct_path.read_bytes()
    ct_sha = hashlib.sha256(ct_bytes).hexdigest()
    print(f"Contents Hindi Notes.json: {len(ct_bytes):,} bytes | SHA256: {ct_sha}")
