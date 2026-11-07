import os
import json
from pathlib import Path

content_root = Path("D:/GURUKUL/Contents")

report = {}

for grade in ["5", "6", "7"]:
    manifest_path = content_root / f"Class {grade}" / "media-manifest.json"
    if not manifest_path.exists():
        print(f"Manifest for Class {grade} missing!")
        continue

    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assets = data.get("assets", [])
    grade_summary = {
        "total_assets": len(assets),
        "verified_count": 0,
        "missing_files_on_disk": 0,
        "subjects": {}
    }

    for asset in assets:
        subj = asset.get("subject", "unknown").lower()
        m_type = asset.get("media_type", "unknown")
        rel_path = asset.get("relative_path", "")
        file_path = content_root / rel_path

        if subj not in grade_summary["subjects"]:
            grade_summary["subjects"][subj] = {
                "images": 0,
                "videos": 0,
                "chapters_with_media": set(),
                "missing_files": []
            }

        if m_type == "image":
            grade_summary["subjects"][subj]["images"] += 1
        elif m_type == "video":
            grade_summary["subjects"][subj]["videos"] += 1

        ch_id = asset.get("chapter_id", "")
        if ch_id:
            grade_summary["subjects"][subj]["chapters_with_media"].add(ch_id)

        if file_path.exists():
            grade_summary["verified_count"] += 1
        else:
            grade_summary["missing_files_on_disk"] += 1
            grade_summary["subjects"][subj]["missing_files"].append(rel_path)

    # Convert sets to count for JSON printing
    for subj in grade_summary["subjects"]:
        grade_summary["subjects"][subj]["chapters_with_media_count"] = len(grade_summary["subjects"][subj]["chapters_with_media"])
        del grade_summary["subjects"][subj]["chapters_with_media"]

    report[f"Class_{grade}"] = grade_summary

print(json.dumps(report, indent=2))
