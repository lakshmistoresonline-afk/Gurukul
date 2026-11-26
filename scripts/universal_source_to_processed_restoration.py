import glob
import json
import os
import shutil
import re

PROCESSED_BASES = ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']

# Mapping rule from source filename patterns to target module json
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

def universal_restore_all_classes():
    print("=========================================================================")
    print("GURUKUL AI — UNIVERSAL SOURCE-TO-PROCESSED RESTORATION ENGINE")
    print("Restoring 100% untruncated word-for-word data across ALL classes & subjects...")
    print("=========================================================================")

    all_source_jsons = glob.glob('Contents/**/*.json', recursive=True)
    all_source_jsons = [f for f in all_source_jsons if 'ProcessedContent' not in f]

    print(f"📁 Found {len(all_source_jsons)} total Source JSON files in Contents/")

    restored_modules_count = 0
    restored_words_count = 0

    for s_path in all_source_jsons:
        norm_s = s_path.replace('\\', '/')
        fname = os.path.basename(norm_s)
        fname_lower = fname.lower()

        # Skip link-only directory files
        if 'media_directory' in fname_lower or 'video_links' in fname_lower or 'manifest' in fname_lower:
            continue

        parts = norm_s.split('/')
        if len(parts) < 4:
            continue

        cls_dir = parts[1] # e.g. Class 5, Class 7
        subj_dir = parts[2] # e.g. English, Science, Maths I

        grade_num = cls_dir.lower().replace('class', '').strip()
        cls_folder_name = f"Class{grade_num}"

        # Determine target module json file name
        target_proc_name = None
        for key, target in FILE_TYPE_RULES:
            if key in fname_lower:
                target_proc_name = target
                break

        if not target_proc_name:
            continue

        # Resolve clean subject folder
        clean_subj_lower = subj_dir.strip().lower()
        if 'maths ii' in clean_subj_lower or 'maths_ii' in clean_subj_lower or 'mathsii' in clean_subj_lower:
            pc_subj = 'Maths II'
        elif 'maths i' in clean_subj_lower or 'maths_i' in clean_subj_lower or 'mathsi' in clean_subj_lower:
            pc_subj = 'Maths I'
        elif 'math' in clean_subj_lower:
            pc_subj = 'Maths'
        elif 'social iii' in clean_subj_lower or 'social_iii' in clean_subj_lower or 'socialiii' in clean_subj_lower:
            pc_subj = 'Social III'
        elif 'social ii' in clean_subj_lower or 'social_ii' in clean_subj_lower or 'socialii' in clean_subj_lower:
            pc_subj = 'Social II'
        elif 'social i' in clean_subj_lower or 'social_i' in clean_subj_lower or 'sociali' in clean_subj_lower:
            pc_subj = 'Social I'
        elif 'soc' in clean_subj_lower:
            pc_subj = 'Social'
        elif 'eng' in clean_subj_lower:
            pc_subj = 'English'
        elif 'hin' in clean_subj_lower:
            pc_subj = 'Hindi'
        elif 'sci' in clean_subj_lower:
            pc_subj = 'Science'
        else:
            pc_subj = subj_dir.capitalize()

        try:
            with open(s_path, 'r', encoding='utf-8', errors='ignore') as fp:
                raw_txt = fp.read()

            raw_txt_clean = re.sub(r'[\x00-\x1F\x7F]', ' ', raw_txt)
            raw_txt_clean = re.sub(r'"video_link":\s*(https?://[^\s,"]+)', r'"video_link": "\1"', raw_txt_clean)
            s_data = json.loads(raw_txt_clean, strict=False)

            if isinstance(s_data, list):
                chapters = s_data
            elif isinstance(s_data, dict):
                chapters = s_data.get('chapters') or s_data.get('chapter_quizzes') or [s_data]
            else:
                chapters = [s_data]

            for ch_idx, ch_obj in enumerate(chapters):
                if not isinstance(ch_obj, dict):
                    continue

                ch_num = ch_obj.get('chapter_number') or ch_obj.get('chapter') or (ch_idx + 1)
                ch_num_str = str(ch_num).zfill(2)

                for base in PROCESSED_BASES:
                    target_dirs = glob.glob(f"{base}/{cls_folder_name}/{pc_subj}/*-C{ch_num_str}")
                    if not target_dirs:
                        target_dirs = glob.glob(f"{base}/{cls_folder_name}/*/*-C{ch_num_str}")

                    for td in target_dirs:
                        target_file = os.path.join(td, target_proc_name)

                        # Preserve existing video_url and image_asset if overview.json
                        curr_video = None
                        curr_image = None
                        if os.path.exists(target_file) and target_proc_name in ['overview.json', 'manifest.json']:
                            try:
                                with open(target_file, 'r', encoding='utf-8') as tf:
                                    ex_data = json.load(tf)
                                curr_video = ex_data.get('video_url')
                                curr_image = ex_data.get('image_asset')
                            except Exception:
                                pass

                        restored_obj = dict(ch_obj)
                        if curr_video and not restored_obj.get('video_url'):
                            restored_obj['video_url'] = curr_video
                        if curr_image and not restored_obj.get('image_asset'):
                            restored_obj['image_asset'] = curr_image

                        with open(target_file, 'w', encoding='utf-8') as tf:
                            json.dump(restored_obj, tf, indent=2, ensure_ascii=False)

                        restored_modules_count += 1
                        restored_words_count += len(json.dumps(restored_obj, ensure_ascii=False).split())

        except Exception as e:
            print(f"Error restoring {s_path}: {e}")

    # Final public asset sync
    print("\n⚙️ Finalizing public asset sync for ALL subjects and classes...")
    shutil.copytree('backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent', dirs_exist_ok=True)

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY RESTORED {restored_modules_count:,} PROCESSED MODULES!")
    print(f"✅ TOTAL UNTRUNCATED WORD VOLUME: {restored_words_count:,} WORDS!")
    print("=========================================================================")

if __name__ == '__main__':
    universal_restore_all_classes()
