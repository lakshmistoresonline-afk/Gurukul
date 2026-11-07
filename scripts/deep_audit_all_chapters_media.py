import os
import json
from pathlib import Path

content_root = Path("D:/GURUKUL/Contents")

report = {
    "total_classes": 3,
    "class_details": {}
}

for grade in ["5", "6", "7"]:
    grade_dir = content_root / f"Class {grade}"
    manifest_path = grade_dir / "media-manifest.json"

    if not manifest_path.exists():
        continue

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)

    assets = manifest_data.get("assets", [])

    # Index assets by chapter_id & chapter_number
    media_by_ch = {}
    for asset in assets:
        ch_id = asset.get("chapter_id", "").upper().strip()
        ch_num = str(asset.get("chapter_number", "")).strip()
        subj = asset.get("subject", "").lower().strip()

        key = f"{subj}:{ch_id}"
        if key not in media_by_ch:
            media_by_ch[key] = {"images": [], "videos": []}

        rel_p = asset.get("relative_path", "")
        full_p = content_root / rel_p

        item = {
            "asset_id": asset.get("asset_id"),
            "filename": asset.get("filename"),
            "relative_path": rel_p,
            "chapter_number": ch_num,
            "exists_on_disk": full_p.exists()
        }

        if asset.get("media_type") == "image":
            media_by_ch[key]["images"].append(item)
        elif asset.get("media_type") == "video":
            media_by_ch[key]["videos"].append(item)

    report["class_details"][f"Class_{grade}"] = {
        "total_manifest_assets": len(assets),
        "unique_chapters_with_media": len(media_by_ch),
        "media_mapping_sample": {k: media_by_ch[k] for k in list(media_by_ch.keys())[:5]}
    }

print(json.dumps(report, indent=2))
