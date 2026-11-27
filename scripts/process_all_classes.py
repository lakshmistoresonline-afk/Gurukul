import os
import glob
import json
import shutil
import re
import hashlib

from build_master_title_map_all_classes import MASTER_EXHAUSTIVE_TITLES

PROCESSED_DIRS = ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']

FILE_TYPE_RULES = [
    ('overview', 'overview.json'),
    ('notes', 'notes.json'),
    ('mindmap', 'mindmaps.json'),
    ('flashcard', 'flashcards.json'),
    ('quiz', 'quiz.json'),
    ('quizzes', 'quiz.json'),
    ('question_paper', 'question_papers.json'),
    ('foundational', 'foundational.json'),
    ('master', 'master.json')
]

def get_file_sha256(filepath):
    if os.path.exists(filepath):
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()
    return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

def process_all_contents():
    print("=========================================================================")
    print("GURUKUL AI — PRISTINE SOURCE INGESTION PIPELINE")
    print("=========================================================================")

    # 1. Video Map
    video_map = {}
    link_files = glob.glob('Contents/**/studio_video_links*.json', recursive=True) + glob.glob('Contents/**/*video_links*.json', recursive=True)

    for fpath in link_files:
        norm_f = fpath.replace('\\', '/')
        parts = norm_f.split('/')
        if len(parts) < 3: continue
        cls_dir = parts[1]
        subj_dir = parts[2]
        grade_num = cls_dir.lower().replace('class', '').strip()

        clean_subj_lower = subj_dir.strip().lower()
        if 'maths ii' in clean_subj_lower or 'maths_ii' in clean_subj_lower: pc_subj = 'Maths II'
        elif 'maths i' in clean_subj_lower or 'maths_i' in clean_subj_lower: pc_subj = 'Maths I'
        elif 'math' in clean_subj_lower: pc_subj = 'Maths'
        elif 'social iii' in clean_subj_lower or 'social_iii' in clean_subj_lower: pc_subj = 'Social III'
        elif 'social ii' in clean_subj_lower or 'social_ii' in clean_subj_lower: pc_subj = 'Social II'
        elif 'social i' in clean_subj_lower or 'social_i' in clean_subj_lower: pc_subj = 'Social I'
        elif 'soc' in clean_subj_lower: pc_subj = 'Social'
        elif 'eng' in clean_subj_lower: pc_subj = 'English'
        elif 'hin' in clean_subj_lower: pc_subj = 'Hindi'
        elif 'sci' in clean_subj_lower: pc_subj = 'Science'
        else: pc_subj = subj_dir.capitalize()

        try:
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp: raw_txt = fp.read()
            raw_txt = re.sub(r'[\x00-\x1F\x7F]', ' ', raw_txt)
            raw_txt = re.sub(r'"video_link":\s*(https?://[^\s,"]+)', r'"video_link": "\1"', raw_txt)
            data = json.loads(raw_txt, strict=False)

            chs = data.get('chapters') if isinstance(data, dict) else data
            if isinstance(chs, list):
                for ch in chs:
                    if isinstance(ch, dict):
                        c_num = ch.get('chapter_number') or ch.get('chapter') or ch.get('chapter_num')
                        v_link = ch.get('video_link') or ch.get('video_url')
                        v_title = ch.get('video_title') or ch.get('chapter_title')
                        if c_num and v_link and str(v_link).startswith('http'):
                            video_map[(grade_num, pc_subj.lower(), int(c_num))] = (v_link, v_title)
        except Exception: pass

    # 2. Image Map
    image_map = {}
    img_files = glob.glob('frontend-nextjs/public/assets/images/*.png') + glob.glob('frontend-nextjs/public/assets/images/*.webp')
    for img_path in img_files:
        fname = os.path.basename(img_path)
        pub_url = f"/assets/images/{fname}"
        ch_match = re.search(r'ch(?:apter)?_?(\d+)', fname.lower()) or re.search(r'-c(\d+)_', fname.lower())
        if ch_match:
            c_num_int = int(ch_match.group(1))
            f_lower = fname.lower()
            s_key = 'english' if 'eng' in f_lower else 'hindi' if 'hin' in f_lower else 'maths' if 'mat' in f_lower else 'science' if 'sci' in f_lower else 'social' if 'soc' in f_lower else 'general'
            for g in ['5', '6', '7', '8', '9', '10']:
                if (g, s_key, c_num_int) not in image_map:
                    image_map[(g, s_key, c_num_int)] = pub_url

    # 3. Source JSON ingestion
    all_source_jsons = [f for f in glob.glob('Contents/**/*.json', recursive=True) if 'ProcessedContent' not in f]
    ingested_modules = 0

    for s_path in all_source_jsons:
        norm_s = s_path.replace('\\', '/')
        fname = os.path.basename(norm_s)
        fname_lower = fname.lower()

        if 'media_directory' in fname_lower or 'video_links' in fname_lower or 'manifest' in fname_lower: continue

        parts = norm_s.split('/')
        if parts[1] == 'content' and len(parts) >= 5:
            subj_dir = parts[3]
        elif len(parts) >= 4:
            subj_dir = parts[2]
        else:
            continue

        cls_match = re.search(r'Class\s*(\d+)', norm_s, re.IGNORECASE)
        if not cls_match:
            continue
        grade_num = cls_match.group(1)
        cls_folder_name = f"Class{grade_num}"

        target_proc_name = None
        for key, target in FILE_TYPE_RULES:
            if key in fname_lower:
                target_proc_name = target
                break
        if not target_proc_name: continue

        clean_subj_lower = subj_dir.strip().lower()
        if 'maths ii' in clean_subj_lower or 'maths_ii' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Maths II', 'MAT', 'maths_ii', 'part2'
        elif 'maths i' in clean_subj_lower or 'maths_i' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Maths I', 'MAT', 'maths_i', 'part1'
        elif 'math' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Maths', 'MAT', 'mathematics', 'main'
        elif 'social iii' in clean_subj_lower or 'social_iii' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Social III', 'SOC', 'social_iii', 'part3'
        elif 'social ii' in clean_subj_lower or 'social_ii' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Social II', 'SOC', 'social_ii', 'part2'
        elif 'social i' in clean_subj_lower or 'social_i' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Social I', 'SOC', 'social_i', 'part1'
        elif 'soc' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Social', 'SOC', 'social_science', 'main'
        elif 'eng' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'English', 'ENG', 'english', 'main'
        elif 'hin' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Hindi', 'HIN', 'hindi', 'main'
        elif 'sci' in clean_subj_lower:
            pc_subj, s_code, book_id, book_part = 'Science', 'SCI', 'science', 'main'
        else:
            pc_subj, s_code, book_id, book_part = subj_dir.capitalize(), 'GEN', clean_subj_lower, 'main'

        try:
            with open(s_path, 'r', encoding='utf-8', errors='ignore') as fp: raw_txt = fp.read()
            raw_txt_clean = re.sub(r'[\x00-\x1F\x7F]', ' ', raw_txt)
            raw_txt_clean = re.sub(r'"video_link":\s*(https?://[^\s,"]+)', r'"video_link": "\1"', raw_txt_clean)
            s_data = json.loads(raw_txt_clean, strict=False)

            if isinstance(s_data, dict) and 'source_data' in s_data and isinstance(s_data['source_data'], (dict, list)):
                s_data = s_data['source_data']

            chapters = s_data if isinstance(s_data, list) else (s_data.get('chapters') or s_data.get('chapter_notes') or s_data.get('chapters_master_data') or s_data.get('chapter_quizzes') or [s_data])

            for ch_idx, ch_obj in enumerate(chapters):
                if not isinstance(ch_obj, dict): continue

                ch_num = ch_obj.get('chapter_number') or ch_obj.get('chapter')
                if isinstance(ch_num, dict):
                    ch_num = ch_num.get('chapter_number') or ch_num.get('chapter') or (ch_idx + 1)
                if not ch_num: ch_num = ch_idx + 1

                try: ch_num_int = int(re.search(r'\d+', str(ch_num)).group())
                except Exception: ch_num_int = ch_idx + 1

                ch_num_str = str(ch_num_int).zfill(2)
                real_title = ch_obj.get('chapter_title') or ch_obj.get('title') or MASTER_EXHAUSTIVE_TITLES.get((grade_num, s_code, ch_num_int)) or f"{pc_subj} Chapter {ch_num_int}"

                unit_str = ch_obj.get('unit') or 'U01'
                if isinstance(unit_str, int):
                    unit_str = f"U{str(unit_str).zfill(2)}"
                unit_str = re.sub(r'[:*?"<>|]', '', str(unit_str))

                ch_id = ch_obj.get('chapter_id') or f"G{grade_num}-{s_code}-{unit_str}-C{ch_num_str}"
                ch_id = re.sub(r'[:*?"<>|]', '', ch_id)
                ch_id_unit_match = re.search(r'-(U\d+)-', ch_id)
                if ch_id_unit_match:
                    unit_str = ch_id_unit_match.group(1)

                u_num = int(re.search(r'\d+', unit_str).group()) if re.search(r'\d+', unit_str) else 1

                for base in PROCESSED_DIRS:
                    target_dir = os.path.join(base, cls_folder_name, pc_subj, ch_id)
                    os.makedirs(target_dir, exist_ok=True)

                    target_file = os.path.join(target_dir, target_proc_name)

                    clean_ch_obj = dict(ch_obj)
                    clean_ch_obj['grade'] = grade_num
                    clean_ch_obj['subject'] = pc_subj
                    clean_ch_obj['chapter_id'] = ch_id
                    clean_ch_obj['chapter_number'] = ch_num_int
                    clean_ch_obj['chapter_title'] = real_title

                    if target_proc_name == 'overview.json':
                        clean_ch_obj['title'] = f"{real_title} - Chapter Overview"

                        v_tuple = video_map.get((grade_num, pc_subj.lower(), ch_num_int))
                        v_url = v_tuple[0] if v_tuple else f"https://notebooklm.link.google/v{grade_num}{s_code.lower()}{ch_num_str}"
                        v_title = v_tuple[1] if v_tuple else f"{real_title} Interactive Video Studio"
                        clean_ch_obj['video_url'] = v_url
                        clean_ch_obj['video_title'] = v_title

                        img_filename = f"ch{ch_num_str}_concept_map.png"
                        img_url = image_map.get((grade_num, pc_subj.lower(), ch_num_int)) or f"/assets/images/{img_filename}"
                        clean_ch_obj['image_asset'] = {
                            "title": f"{real_title} Concept Diagram",
                            "asset_url": img_url,
                            "url": img_url,
                            "filename": os.path.basename(img_url),
                            "type": "16:9 Diagram",
                            "hotspots": [
                                {
                                    "id": f"hs_{ch_num_int}_1",
                                    "label": "Core Mechanism",
                                    "tooltip_explanation": f"Interactive concept hotspot detailing key mechanisms and conceptual architecture of {real_title}."
                                },
                                {
                                    "id": f"hs_{ch_num_int}_2",
                                    "label": "Practical Application",
                                    "tooltip_explanation": f"Real-world application and exam synthesis for {real_title}."
                                }
                            ]
                        }

                    with open(target_file, 'w', encoding='utf-8') as tf:
                        json.dump(clean_ch_obj, tf, indent=2, ensure_ascii=False)

                    mf_path = os.path.join(target_dir, 'manifest.json')
                    if not os.path.exists(mf_path):
                        rel_src_file = fname
                        abs_src_file = s_path
                        src_hash = get_file_sha256(abs_src_file)
                        rel_json_path = s_path.replace('\\', '/').replace('Contents/', '')

                        mf_data = {
                            "grade": grade_num,
                            "subject": pc_subj,
                            "book": book_id,
                            "part": book_part,
                            "unit": unit_str,
                            "chapter_id": ch_id,
                            "chapter_number": ch_num_int,
                            "chapter_title": real_title,
                            "unit_number": u_num,
                            "unit_title": f"Unit {u_num}",
                            "source_files": [rel_src_file],
                            "source_json_paths": [rel_json_path],
                            "source_hashes": {
                                rel_json_path: src_hash
                            },
                            "source_identity": {
                                "grade": grade_num,
                                "subject": pc_subj,
                                "book": book_id,
                                "part": book_part,
                                "unit": unit_str,
                                "chapter_id": ch_id
                            },
                            "video_url": f"https://notebooklm.link.google/v{grade_num}{s_code.lower()}{ch_num_str}",
                            "image_asset": {
                                "title": f"{real_title} Concept Diagram",
                                "asset_url": f"/assets/images/ch{ch_num_str}_concept_map.png",
                                "url": f"/assets/images/ch{ch_num_str}_concept_map.png",
                                "filename": f"ch{ch_num_str}_concept_map.png"
                            }
                        }
                        with open(mf_path, 'w', encoding='utf-8') as mf_f:
                            json.dump(mf_data, mf_f, indent=2, ensure_ascii=False)

                    ingested_modules += 1

        except Exception as e:
            print(f"Error ingesting {s_path}: {e}")

    print("\n⚙️ Synchronizing backend/ProcessedContent -> frontend-nextjs/public/ProcessedContent...")
    shutil.copytree('backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent', dirs_exist_ok=True)

    print(f"✅ Ingested {ingested_modules:,} modules!")

if __name__ == '__main__':
    process_all_contents()
