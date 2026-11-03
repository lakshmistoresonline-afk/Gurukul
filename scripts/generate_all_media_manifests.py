import os
import sys
import json
import re
import csv
import hashlib
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.curriculum.core.config import GurukulConfig

CONTENTS_ROOT = GurukulConfig.get_content_root()

def get_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def extract_chapter_from_source_title(source_title: str) -> int:
    if not source_title:
        return 1
    for st in source_title.split('|'):
        st_clean = st.strip()
        m = re.search(r'([a-z]+)(\d{3,4})\.pdf', st_clean, re.IGNORECASE)
        if m:
            val = int(m.group(2)[-2:])
            if val > 0:
                return val
    return 1

def extract_chapter_num_from_filename(filename: str) -> int:
    fn_lower = filename.lower()
    m_ch = re.search(r'ch[_\-]?(\d+)', fn_lower)
    if m_ch:
        return int(m_ch.group(1))

    m_num = re.search(r'^(\d+)[_\-]', fn_lower)
    if m_num:
        return int(m_num.group(1))

    m_c = re.search(r'c(\d+)', fn_lower)
    if m_c:
        return int(m_c.group(1))

    return 1

def build_media_manifests():
    subject_code_map = {
        "english": "ENG",
        "hindi": "HIN",
        "maths": "MAT",
        "mathematics": "MAT",
        "maths i": "MAT",
        "maths ii": "MAT",
        "maths_i": "MAT",
        "maths_ii": "MAT",
        "science": "SCI",
        "evs": "SCI",
        "social": "SOC",
        "social_science": "SOC",
        "social i": "SOC",
        "social ii": "SOC",
        "social_i": "SOC",
        "social_ii": "SOC"
    }

    for grade_dir_name in sorted(os.listdir(CONTENTS_ROOT)):
        grade_path = CONTENTS_ROOT / grade_dir_name
        if not grade_path.is_dir() or not grade_dir_name.startswith("Class"):
            continue

        grade_num = grade_dir_name.replace("Class ", "").replace("Class_", "").replace("Class", "").strip()
        manifest_assets = []
        seen_filenames = set()

        print(f"\nProcessing media assets via source-artifact-map.csv for Class {grade_num} in {grade_path}...")

        for subj_dir_name in sorted(os.listdir(grade_path)):
            subj_path = grade_path / subj_dir_name
            if not subj_path.is_dir():
                continue

            canon_subj = subj_dir_name.lower().replace(" ", "_")
            if "maths" in canon_subj:
                canon_subj = "mathematics"
            elif "social" in canon_subj:
                canon_subj = "social_science"
            elif canon_subj == "evs":
                canon_subj = "science"

            subj_code = subject_code_map.get(canon_subj, "GEN")

            # 1. Primary Mapping via source-artifact-map.csv
            csv_file = subj_path / "source-artifact-map.csv"
            if csv_file.exists():
                try:
                    with open(csv_file, 'r', encoding='utf-8-sig') as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            rel_file = row.get('file', '').strip()
                            art_type = row.get('artifact_type', '').strip()
                            art_title = row.get('artifact_title', '').strip()
                            src_titles = row.get('source_titles', '').strip()

                            if not rel_file:
                                continue

                            full_p = subj_path / rel_file
                            if not full_p.exists():
                                continue

                            ext = full_p.name.lower().split('.')[-1]
                            if ext in ['png', 'jpg', 'jpeg', 'mp4']:
                                fname = full_p.name
                                unique_key = f"{grade_num}:{canon_subj}:{fname.lower()}"
                                if unique_key in seen_filenames:
                                    continue
                                seen_filenames.add(unique_key)

                                ch_num = extract_chapter_from_source_title(src_titles)
                                if ch_num == 1:
                                    ch_num = extract_chapter_num_from_filename(fname)

                                ch_id = f"G{grade_num}-{subj_code}-U01-C{ch_num:02d}"
                                is_img = ext in ['png', 'jpg', 'jpeg']
                                media_type = "image" if is_img else "video"
                                mime = "image/png" if ext == 'png' else "image/jpeg" if ext in ['jpg', 'jpeg'] else "video/mp4"
                                rel_to_contents = os.path.relpath(full_p, CONTENTS_ROOT).replace("\\", "/")

                                asset_item = {
                                    "asset_id": f"CLASS{grade_num}_{canon_subj.upper()}_{re.sub(r'[^a-zA-Z0-9]', '_', fname)}",
                                    "grade": str(grade_num),
                                    "subject": canon_subj,
                                    "textbook": subj_dir_name,
                                    "chapter_number": ch_num,
                                    "chapter_id": ch_id,
                                    "chapter_title": art_title or f"Chapter {ch_num}",
                                    "media_type": media_type,
                                    "filename": fname,
                                    "relative_path": rel_to_contents,
                                    "mime_type": mime,
                                    "file_size_bytes": full_p.stat().st_size,
                                    "sha256": get_sha256(full_p),
                                    "verification_status": "VERIFIED"
                                }
                                manifest_assets.append(asset_item)
                except Exception as e:
                    print(f"Error reading CSV {csv_file}: {e}")

            # 2. Secondary Folder Scan for remaining assets
            for root, dirs, files in os.walk(subj_path):
                for fname in sorted(files):
                    ext = fname.lower().split('.')[-1]
                    if ext in ['png', 'jpg', 'jpeg', 'mp4']:
                        full_p = Path(root) / fname
                        unique_key = f"{grade_num}:{canon_subj}:{fname.lower()}"
                        if unique_key in seen_filenames:
                            continue
                        seen_filenames.add(unique_key)

                        ch_num = extract_chapter_num_from_filename(fname)
                        ch_id = f"G{grade_num}-{subj_code}-U01-C{ch_num:02d}"
                        is_img = ext in ['png', 'jpg', 'jpeg']
                        media_type = "image" if is_img else "video"
                        mime = "image/png" if ext == 'png' else "image/jpeg" if ext in ['jpg', 'jpeg'] else "video/mp4"
                        rel_to_contents = os.path.relpath(full_p, CONTENTS_ROOT).replace("\\", "/")

                        asset_item = {
                            "asset_id": f"CLASS{grade_num}_{canon_subj.upper()}_{re.sub(r'[^a-zA-Z0-9]', '_', fname)}",
                            "grade": str(grade_num),
                            "subject": canon_subj,
                            "textbook": subj_dir_name,
                            "chapter_number": ch_num,
                            "chapter_id": ch_id,
                            "chapter_title": f"Chapter {ch_num}",
                            "media_type": media_type,
                            "filename": fname,
                            "relative_path": rel_to_contents,
                            "mime_type": mime,
                            "file_size_bytes": full_p.stat().st_size,
                            "sha256": get_sha256(full_p),
                            "verification_status": "VERIFIED"
                        }
                        manifest_assets.append(asset_item)

        manifest_data = {
            "grade": str(grade_num),
            "total_assets": len(manifest_assets),
            "assets": manifest_assets
        }

        manifest_out = grade_path / "media-manifest.json"
        with open(manifest_out, "w", encoding="utf-8") as f:
            json.dump(manifest_data, f, ensure_ascii=False, indent=2)

        print(f"Generated {manifest_out} with {len(manifest_assets)} media assets.")

if __name__ == "__main__":
    build_media_manifests()
