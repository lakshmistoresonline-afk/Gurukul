import os
import shutil
from pathlib import Path

print("==========================================================================")
print("GURUKUL AI — CLASS 5 ANDROID ASSET SYNCHRONIZATION WORKER")
print("==========================================================================\n")

GURUKUL_ROOT = Path(r"D:\GURUKUL")
PROCESSED_CLASS5 = GURUKUL_ROOT / "ProcessedContent" / "Class 5"
ANDROID_ASSETS_DATA = GURUKUL_ROOT / "android" / "app" / "src" / "main" / "assets" / "data" / "class_5"
ANDROID_ASSETS_IMAGES = GURUKUL_ROOT / "android" / "app" / "src" / "main" / "assets" / "images" / "class_5"

ANDROID_ASSETS_DATA.mkdir(parents=True, exist_ok=True)
ANDROID_ASSETS_IMAGES.mkdir(parents=True, exist_ok=True)

if not PROCESSED_CLASS5.exists():
    print(f"Error: Processed Class 5 data not found at {PROCESSED_CLASS5}")
    exit(1)

synced_data_files = 0
synced_image_files = 0

for subject_dir in PROCESSED_CLASS5.iterdir():
    if not subject_dir.is_dir():
        continue

    subject_name = subject_dir.name.lower() # e.g. "english", "hindi", "maths", "science"
    target_data_sub = ANDROID_ASSETS_DATA / subject_name
    target_img_sub = ANDROID_ASSETS_IMAGES / subject_name

    target_data_sub.mkdir(parents=True, exist_ok=True)
    target_img_sub.mkdir(parents=True, exist_ok=True)

    # 1. Sync JSON Data Modules
    for jf in subject_dir.glob("*.json"):
        dest_f = target_data_sub / jf.name
        shutil.copy2(jf, dest_f)
        synced_data_files += 1

    # 2. Sync Diagram Images
    img_dir = subject_dir / "images"
    if img_dir.exists():
        for img in img_dir.glob("*.png"):
            dest_img = target_img_sub / img.name
            shutil.copy2(img, dest_img)
            synced_image_files += 1

print(f"Successfully synchronized Class 5 Android Assets:")
print(f"  - Data Modules Synced: {synced_data_files} files -> {ANDROID_ASSETS_DATA}")
print(f"  - Diagram Assets Synced: {synced_image_files} files -> {ANDROID_ASSETS_IMAGES}\n")
