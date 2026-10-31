import os
import sys
import json
import shutil
from datetime import datetime
from typing import Dict, Any, List

print("==========================================================================")
print("GURUKUL AI — STRICT 1-TO-1 DATASET ISOLATION PROCESSOR (V16 - RECURSIVE SUBFOLDER FIX)")
print("==========================================================================\n")

REPO_ROOT = r"D:/GURUKUL"
CONTENTS_ROOT = os.path.join(REPO_ROOT, "Contents")
PROCESSED_ROOT = os.path.join(REPO_ROOT, "ProcessedContent")

def extract_chapters(data: Any) -> List[dict]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if "chapters" in data and isinstance(data["chapters"], list):
            return data["chapters"]
        if "units" in data and isinstance(data["units"], list):
            ch_list = []
            for u in data["units"]:
                if isinstance(u, dict):
                    if "chapters" in u and isinstance(u["chapters"], list):
                        ch_list.extend(u["chapters"])
                    elif "stories" in u and isinstance(u["stories"], list):
                        ch_list.extend(u["stories"])
                    else:
                        ch_list.append(u)
            if ch_list:
                return ch_list
        for k, v in data.items():
            if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict):
                return v
    return []

def match_chapter(chrs: List[dict], ch_num: int) -> dict:
    for idx, ch in enumerate(chrs):
        if not isinstance(ch, dict):
            continue
        c = (
            ch.get("chapter_number") or
            ch.get("chapterNumber") or
            ch.get("chapter_no") or
            ch.get("unit_number") or
            (idx + 1)
        )
        try:
            if int(c) == ch_num:
                return ch
        except:
            if (idx + 1) == ch_num:
                return ch
    if ch_num - 1 < len(chrs):
        return chrs[ch_num - 1]
    return {}

def run_strict_1to1():
    if not os.path.isdir(CONTENTS_ROOT):
        print("CRITICAL ERROR: Contents root does not exist.")
        sys.exit(1)

    subject_mapping = {
        "EVS": "Science",
        "Science": "Science",
        "English": "English",
        "Hindi": "Hindi",
        "Maths": "Maths",
        "Maths 1": "MathsI",
        "Maths 2": "MathsII",
        "Maths I": "MathsI",
        "Maths II": "MathsII",
        "Sanskrit": "Sanskrit",
        "Social": "Social",
        "Social 1": "SocialI",
        "Social 2": "SocialII",
        "Social I": "SocialI",
        "Social II": "SocialII",
        "Social_Science": "Social"
    }

    total_chapters_processed = 0

    for class_dir_name in os.listdir(CONTENTS_ROOT):
        class_path = os.path.join(CONTENTS_ROOT, class_dir_name)
        if not os.path.isdir(class_path) or not class_dir_name.startswith("Class"):
            continue

        grade = class_dir_name.replace("Class ", "").replace("Class_", "").replace("Class", "")

        for subj_dir_name in os.listdir(class_path):
            subj_path = os.path.join(class_path, subj_dir_name)
            if not os.path.isdir(subj_path):
                continue

            app_subj = subject_mapping.get(subj_dir_name, subj_dir_name)
            subj_code = "GEN"
            if app_subj == "Science":
                subj_code = "SCI"
            elif app_subj == "English":
                subj_code = "ENG"
            elif app_subj == "Hindi":
                subj_code = "HIN"
            elif "Maths" in app_subj:
                subj_code = "MAT"
            elif "Social" in app_subj:
                subj_code = "SOC"
            elif app_subj == "Sanskrit":
                subj_code = "SAN"

            target_subj_dir = os.path.join(PROCESSED_ROOT, f"Class{grade}", app_subj.replace(" ", ""))
            os.makedirs(target_subj_dir, exist_ok=True)

            search_dirs = [root for root, _, _ in os.walk(subj_path)]

            source_file_specs = [
                ("overview", ["overview", "overview.json"]),
                ("notes", ["notes", "notes.json"]),
                ("master", ["master", "subject_mastery"]),
                ("mindmaps", ["mindmap", "mindmaps"]),
                ("flashcards", ["flashcard", "flashcards"]),
                ("quiz", ["quiz"]),
                ("question_papers", ["question_paper", "questionpaper", "questionpapers"]),
                ("foundational", ["foundational", "language_foundational"])
            ]

            loaded_datasets = {}
            for sec_key, keywords in source_file_specs:
                if sec_key in loaded_datasets:
                    continue
                for s_dir in search_dirs:
                    if not os.path.isdir(s_dir):
                        continue
                    for fname in os.listdir(s_dir):
                        if fname.endswith(".json"):
                            clean_fname = fname.lower().replace("_", "").replace("-", "")
                            if any(kw in clean_fname for kw in keywords):
                                f_abs = os.path.join(s_dir, fname)
                                try:
                                    with open(f_abs, "r", encoding="utf-8") as jf:
                                        loaded_datasets[sec_key] = json.load(jf)
                                        break
                                except Exception as e:
                                    print(f"Error loading {f_abs}: {e}")

            chapter_numbers = set()
            for ds_val in loaded_datasets.values():
                chrs = extract_chapters(ds_val)
                for idx, ch in enumerate(chrs):
                    if isinstance(ch, dict):
                        c_num = (
                            ch.get("chapter_number") or
                            ch.get("chapterNumber") or
                            ch.get("chapter_no") or
                            ch.get("unit_number") or
                            (idx + 1)
                        )
                        try:
                            chapter_numbers.add(int(c_num))
                        except:
                            chapter_numbers.add(idx + 1)

            if not chapter_numbers:
                chapter_numbers = {1}

            for ch_num in sorted(chapter_numbers):
                ch_folder_name = f"G{grade}-{subj_code}-U01-C{ch_num:02d}"
                ch_proc_dir = os.path.join(target_subj_dir, ch_folder_name)
                os.makedirs(ch_proc_dir, exist_ok=True)

                ch_title = f"Chapter {ch_num}"

                for sec_key, keywords in source_file_specs:
                    ds = loaded_datasets.get(sec_key)
                    sec_data = {}
                    if ds is not None:
                        if sec_key == "foundational":
                            sec_data = ds
                        else:
                            chrs = extract_chapters(ds)
                            matched = match_chapter(chrs, ch_num)
                            if matched and len(matched) > 0:
                                title = matched.get("chapter_title") or matched.get("chapterTitle") or matched.get("title")
                                if title and isinstance(title, str) and "Exhaustive" not in title:
                                    ch_title = title

                                if sec_key == "flashcards":
                                    sec_data = matched.get("flashcards") or matched.get("cards") or matched.get("flashcard_database") or matched
                                    if isinstance(sec_data, dict) and "flashcards" in sec_data:
                                        sec_data = sec_data["flashcards"]
                                elif sec_key == "quiz":
                                    q_obj = matched.get("quiz") or matched.get("questions") or matched.get("quizzes") or matched
                                    if isinstance(q_obj, dict):
                                        sec_data = q_obj.get("questions") or q_obj.get("quiz") or q_obj.get("quizzes") or q_obj
                                    elif isinstance(q_obj, list):
                                        sec_data = q_obj
                                    else:
                                        sec_data = q_obj
                                else:
                                    sec_data = matched
                            else:
                                sec_data = ds

                    out_filename = f"{sec_key}.json"
                    out_path = os.path.join(ch_proc_dir, out_filename)
                    with open(out_path, "w", encoding="utf-8") as out_f:
                        json.dump(sec_data, out_f, ensure_ascii=False, indent=2)

                manifest_data = {
                    "grade": grade,
                    "class": grade,
                    "subject": app_subj,
                    "chapter_number": ch_num,
                    "chapter_title": ch_title,
                    "generated_at": datetime.now().isoformat()
                }
                with open(os.path.join(ch_proc_dir, "manifest.json"), "w", encoding="utf-8") as f:
                    json.dump(manifest_data, f, ensure_ascii=False, indent=2)

                total_chapters_processed += 1

    print(f"\nSuccessfully executed V16 recursive fix across {total_chapters_processed} chapters.")

if __name__ == "__main__":
    run_strict_1to1()
