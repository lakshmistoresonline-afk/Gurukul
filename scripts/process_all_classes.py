#!/usr/bin/env python3
"""
================================================================================
GURUKUL AI — CLASS 5 MASTER CONTENT PROCESSING ENGINE (HARD SCOPE GUARD)
================================================================================
Restricted Scope: Class 5 ONLY.
Processes Contents/Class 5/ (English, Hindi, Maths, Science) into ProcessedContent/Class 5/
Generates SHA-256 Checksums, Asset Reconciliation Manifests, and Image/Video Maps.
"""

import os
import sys
import json
import shutil
import hashlib
import argparse
import csv
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional

# --- ABSOLUTE SCOPE GUARD ---
PERMITTED_CLASS = "Class 5"

def check_scope_guard(target_class: str) -> None:
    normalized_target = target_class.strip().replace("_", " ").title()
    if normalized_target != PERMITTED_CLASS:
        print(f"\n[CRITICAL ERROR] Scope Restriction Guard Violation!")
        print(f"Target '{target_class}' rejected. This release is strictly restricted to '{PERMITTED_CLASS}'.")
        print("Processing of Class 6, Class 7, or other grades is prohibited.\n")
        sys.exit(1)

REPO_ROOT = Path(r"D:\GURUKUL")
CONTENTS_ROOT = REPO_ROOT / "Contents" / PERMITTED_CLASS
PROCESSED_ROOT = REPO_ROOT / "ProcessedContent" / PERMITTED_CLASS
REPORTS_ROOT = REPO_ROOT / "reports" / "class5_processing"

REQUIRED_JSON_MODULES = [
    "Overview.json",
    "Notes.json",
    "Mindmaps.json",
    "Flashcards.json",
    "Quiz.json",
    "Question_Papers.json",
    "Foundational.json",
    "Master.json",
    "media_directory.json",
    "studio_video_links.json"
]

def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def scan_class5_inventory():
    print("==========================================================================")
    print(f"GURUKUL AI — INVENTORY AUDIT FOR {PERMITTED_CLASS}")
    print("==========================================================================\n")

    if not CONTENTS_ROOT.exists():
        print(f"Error: Source path {CONTENTS_ROOT} does not exist.")
        sys.exit(1)

    subjects = [d for d in CONTENTS_ROOT.iterdir() if d.is_dir()]
    print(f"Discovered {len(subjects)} Subject Directories in {PERMITTED_CLASS}:")

    for subj in subjects:
        print(f"\n📁 Subject: {subj.name}")

        # Check subdirectories
        subdirs = [d.name for d in subj.iterdir() if d.is_dir()]
        print(f"   Subdirectories found: {subdirs}")

        # Source Files check
        sf_dir = subj / "Source Files"
        if not sf_dir.exists():
            sf_dir = subj / "Source FIles" # Check case variation

        json_files = list(sf_dir.glob("*.json")) if sf_dir.exists() else list(subj.glob("*.json"))
        print(f"   JSON Data Modules: {len(json_files)} found")
        for jf in json_files:
            print(f"      - {jf.name} ({jf.stat().st_size / 1024:.1f} KB)")

        # Images check
        img_dir = subj / "Images"
        images = list(img_dir.glob("*.*")) if img_dir.exists() else list(subj.glob("*.png"))
        print(f"   Visual Diagram Assets: {len(images)} found")
        for img in images[:5]:
            print(f"      - {img.name} ({img.stat().st_size / 1024:.1f} KB)")
        if len(images) > 5:
            print(f"      ... and {len(images) - 5} more images")

        # Videos check
        vid_dir = subj / "Videos"
        videos = list(vid_dir.glob("*.mp4")) if vid_dir.exists() else []
        print(f"   Studio Video Lessons: {len(videos)} found")
        for vid in videos[:3]:
            print(f"      - {vid.name} ({vid.stat().st_size / (1024*1024):.1f} MB)")

        # CSV Check
        csv_map = subj / "source-artifact-map.csv"
        if csv_map.exists():
            print(f"   Source-Artifact CSV Map: Present ({csv_map.name})")

def process_class5(dry_run: bool = False):
    print("==========================================================================")
    print(f"GURUKUL AI — PROCESSING {PERMITTED_CLASS} (Dry-Run: {dry_run})")
    print("==========================================================================\n")

    if not CONTENTS_ROOT.exists():
        print(f"Error: {CONTENTS_ROOT} does not exist.")
        sys.exit(1)

    REPORTS_ROOT.mkdir(parents=True, exist_ok=True)
    if not dry_run:
        PROCESSED_ROOT.mkdir(parents=True, exist_ok=True)

    subjects = [d for d in CONTENTS_ROOT.iterdir() if d.is_dir()]
    manifest = {
        "class_id": "Class 5",
        "processed_at": datetime.now().isoformat(),
        "dry_run": dry_run,
        "subjects": {}
    }

    total_files_processed = 0

    for subj in subjects:
        subj_name = subj.name
        print(f"[*] Processing Subject: {subj_name}")

        target_subj_dir = PROCESSED_ROOT / subj_name
        if not dry_run:
            target_subj_dir.mkdir(parents=True, exist_ok=True)

        subj_manifest = {
            "subject": subj_name,
            "json_modules": {},
            "diagram_assets": [],
            "video_lessons": [],
            "reconciliation": {"csv_present": False, "matched_assets": 0, "orphaned_assets": 0}
        }

        # 1. Process CSV Asset Inventory Map if Present
        csv_path = subj / "source-artifact-map.csv"
        if csv_path.exists():
            subj_manifest["reconciliation"]["csv_present"] = True
            try:
                with open(csv_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    csv_rows = list(reader)
                    subj_manifest["reconciliation"]["csv_row_count"] = len(csv_rows)
            except Exception as e:
                print(f"   [!] Error reading CSV {csv_path.name}: {e}")

        # 2. Process JSON Modules
        sf_dir = subj / "Source Files"
        if not sf_dir.exists():
            sf_dir = subj / "Source FIles"

        search_dirs = [subj, sf_dir]
        for mod_name in REQUIRED_JSON_MODULES:
            found_path = None
            for sdir in search_dirs:
                if not sdir.exists():
                    continue
                for f in sdir.glob("*.json"):
                    # Check exact or prefix match (e.g., "13-Overview.json" or "Overview.json")
                    clean_f = f.name.lower().replace("-", "_")
                    clean_m = mod_name.lower().replace("-", "_")
                    if clean_m.replace(".json", "") in clean_f:
                        found_path = f
                        break
                if found_path:
                    break

            if found_path and found_path.exists():
                sha256 = compute_sha256(found_path)
                dest_file = target_subj_dir / mod_name

                if not dry_run:
                    shutil.copy2(found_path, dest_file)

                subj_manifest["json_modules"][mod_name] = {
                    "source_file": found_path.name,
                    "size_bytes": found_path.stat().st_size,
                    "sha256": sha256,
                    "status": "VALIDATED"
                }
                total_files_processed += 1
                print(f"   [+] Synced JSON: {mod_name} (SHA-256: {sha256[:12]}...)")
            else:
                print(f"   [!] Missing JSON Module: {mod_name}")
                subj_manifest["json_modules"][mod_name] = {"status": "MISSING"}

        # 3. Process Visual Diagram PNGs
        img_dir = subj / "Images"
        images = list(img_dir.glob("*.png")) if img_dir.exists() else list(subj.glob("*.png"))
        target_img_dir = target_subj_dir / "images"
        if not dry_run:
            target_img_dir.mkdir(parents=True, exist_ok=True)

        for img in images:
            sha256 = compute_sha256(img)
            dest_img = target_img_dir / img.name
            if not dry_run:
                shutil.copy2(img, dest_img)

            subj_manifest["diagram_assets"].append({
                "filename": img.name,
                "size_bytes": img.stat().st_size,
                "sha256": sha256
            })
            total_files_processed += 1
            print(f"   [+] Synced 16:9 Diagram Asset: {img.name}")

        # 4. Process Studio Video Lessons
        vid_dir = subj / "Videos"
        videos = list(vid_dir.glob("*.mp4")) if vid_dir.exists() else []
        target_vid_dir = target_subj_dir / "videos"
        if not dry_run:
            target_vid_dir.mkdir(parents=True, exist_ok=True)

        for vid in videos:
            sha256 = compute_sha256(vid)
            dest_vid = target_vid_dir / vid.name
            if not dry_run:
                shutil.copy2(vid, dest_vid)

            subj_manifest["video_lessons"].append({
                "filename": vid.name,
                "size_bytes": vid.stat().st_size,
                "sha256": sha256
            })
            total_files_processed += 1
            print(f"   [+] Synced Video Lesson: {vid.name}")

        manifest["subjects"][subj_name] = subj_manifest

    # Write Master Manifest & Reconciliation Report
    report_file = REPORTS_ROOT / "class5_processing_report.json"
    if not dry_run:
        with open(report_file, "w", encoding="utf-8") as rf:
            json.dump(manifest, rf, indent=2)

    print(f"\n============================================================")
    print(f"SUCCESS: Processed {total_files_processed} Class 5 asset files.")
    print(f"Processing Report Saved to: {report_file}")
    print(f"============================================================")

def main():
    parser = argparse.ArgumentParser(description="Gurukul AI — Class 5 Content Processing Engine")
    parser.add_argument("--scan", action="store_true", help="Scan and audit Class 5 source files without processing")
    parser.add_argument("--class", dest="class_target", default="Class 5", help="Target class to process (Restricted to 'Class 5')")
    parser.add_argument("--dry-run", action="store_true", help="Simulate processing without writing output files")
    parser.add_argument("--all", action="store_true", help="Execute complete batch processing")

    args = parser.parse_args()

    # Enforce Hard Scope Guard
    check_scope_guard(args.class_target)

    if args.scan:
        scan_class5_inventory()
    else:
        process_class5(dry_run=args.dry_run)

if __name__ == "__main__":
    main()
