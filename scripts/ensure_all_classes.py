import os
import zipfile
from pathlib import Path

print("Ensuring Class 6 and Class 7 are unpacked into Contents/ for full test suite compliance...")

ncert_files_dir = Path(r"C:\Users\srina\Downloads\Gurukul\Ncert Files\Ncert Pdf")
contents_dir = Path("Contents")

subject_mapping = {
    "ENGLISH": "English",
    "HINDI": "Hindi",
    "MATHS": "Maths",
    "MATHS 1": "Maths 1",
    "MATHS 2": "Maths 2",
    "SCIENCE": "Science",
    "SOCIAL": "Social",
    "SOCIAL 1": "Social 1",
    "SOCIAL 2": "Social 2"
}

for folder_name, grade_num in [("CLASS 6 NCERT", 6), ("CLASS 7 NCERT", 7)]:
    c_folder = ncert_files_dir / folder_name
    if c_folder.exists():
        target_dir = contents_dir / f"Class {grade_num}"
        target_dir.mkdir(parents=True, exist_ok=True)
        for zf in c_folder.glob("*.zip"):
            sub_canonical = subject_mapping.get(zf.stem, zf.stem)
            sub_dir = target_dir / sub_canonical
            sub_dir.mkdir(parents=True, exist_ok=True)
            try:
                with zipfile.ZipFile(zf, 'r') as z_ref:
                    z_ref.extractall(sub_dir)
            except Exception as e:
                print(f"Error extracting {zf.name}: {e}")

print("Ensured Class 6 and Class 7 in Contents/.")
