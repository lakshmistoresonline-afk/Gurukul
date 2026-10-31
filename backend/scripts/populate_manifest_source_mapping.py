import os
import sys
import json
import hashlib
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.curriculum.core.config import GurukulConfig
from src.curriculum.core.subject_registry import SubjectRegistry

CONTENTS_ROOT = GurukulConfig.get_content_root()
PROCESSED_ROOT = GurukulConfig.get_processed_root()

def compute_hash(path: Path) -> str:
    if not path.exists():
        return "MISSING"
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            hasher.update(chunk)
    return hasher.hexdigest()

def populate_mapping():
    print("Populating authoritative source mapping in processed manifests...")
    if not PROCESSED_ROOT.exists():
        print("ProcessedContent root does not exist.")
        return

    count = 0
    for class_dir in sorted([d for d in PROCESSED_ROOT.iterdir() if d.is_dir() and "class" in d.name.lower()]):
        grade = class_dir.name.replace("Class", "").strip()

        for subj_dir in sorted([d for d in class_dir.iterdir() if d.is_dir()]):
            raw_subj = subj_dir.name
            canonical_subject = SubjectRegistry.resolve_canonical_subject(raw_subj)

            content_subj_dir = CONTENTS_ROOT / f"Class {grade}" / raw_subj
            if not content_subj_dir.exists():
                content_subj_dir = CONTENTS_ROOT / f"Class{grade}" / raw_subj
            source_files_list = []
            source_hashes_map = {}
            if content_subj_dir.exists():
                for sf in content_subj_dir.glob("*.json"):
                    rel_sf = str(sf.relative_to(CONTENTS_ROOT))
                    source_files_list.append(rel_sf)
                    source_hashes_map[rel_sf] = compute_hash(sf)

            for ch_dir in sorted([d for d in subj_dir.iterdir() if d.is_dir()]):
                chapter_id = ch_dir.name
                manifest_file = ch_dir / "manifest.json"
                if not manifest_file.exists():
                    continue

                try:
                    with open(manifest_file, "r", encoding="utf-8") as mf:
                        md = json.load(mf)
                except:
                    md = {}

                md["source_files"] = source_files_list
                md["source_json_paths"] = source_files_list
                md["source_hashes"] = source_hashes_map
                md["source_identity"] = {
                    "grade": grade,
                    "canonical_subject": canonical_subject,
                    "book": md.get("book", canonical_subject),
                    "part": md.get("part", "main"),
                    "unit": md.get("unit", "U01"),
                    "chapter_id": chapter_id
                }

                with open(manifest_file, "w", encoding="utf-8") as mf:
                    json.dump(md, mf, ensure_ascii=False, indent=2)
                count += 1

    print(f"Successfully updated {count} processed manifests with authoritative source mapping.")

if __name__ == "__main__":
    populate_mapping()
