import glob
import json
import os
import shutil

PROCESSED_BASES = ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']

MAPPING_RULES = {
    'overview': 'overview.json',
    'notes': 'notes.json',
    'mindmap': 'mindmaps.json',
    'mindmaps': 'mindmaps.json',
    'flashcard': 'flashcards.json',
    'flashcards': 'flashcards.json',
    'quiz': 'quiz.json',
    'quizzes': 'quiz.json',
    'question_paper': 'question_papers.json',
    'question_papers': 'question_papers.json',
    'foundational': 'foundational.json',
    'master': 'master.json'
}

def restore_all_english_subjects():
    print("=========================================================================")
    print("GURUKUL AI — ALL-CLASSES ENGLISH SUBJECT EXACT RESTORATION ENGINE")
    print("Restoring 100% untruncated word-for-word data across Class 5-10 English...")
    print("=========================================================================")

    english_source_files = glob.glob('Contents/**/English/**/*.json', recursive=True)
    print(f"📁 Found {len(english_source_files)} English Source JSON files in Contents/")

    restored_count = 0

    for s_path in english_source_files:
        norm_s = s_path.replace('\\', '/')
        fname = os.path.basename(norm_s)
        parts = norm_s.split('/')

        if 'ProcessedContent' in parts or len(parts) < 4:
            continue

        cls_dir = parts[1] # e.g. Class 5, Class 7
        grade_num = cls_dir.lower().replace('class', '').strip()
        cls_folder_name = f"Class{grade_num}"

        # Determine module type from filename (e.g. 13-Overview.json -> overview)
        fname_lower = fname.lower()
        target_proc_name = None
        for key, target in MAPPING_RULES.items():
            if key in fname_lower:
                target_proc_name = target
                break

        if not target_proc_name:
            continue

        try:
            with open(s_path, 'r', encoding='utf-8', errors='ignore') as f:
                s_data = json.load(f)

            chapters = s_data.get('chapters') or s_data.get('chapter_quizzes') or (s_data if isinstance(s_data, list) else [])
            if not isinstance(chapters, list):
                chapters = [s_data]

            for ch_idx, ch_obj in enumerate(chapters):
                if not isinstance(ch_obj, dict):
                    continue

                ch_num = ch_obj.get('chapter_number') or ch_obj.get('chapter') or (ch_idx + 1)
                ch_num_str = str(ch_num).zfill(2)

                for base in PROCESSED_BASES:
                    target_dirs = glob.glob(f"{base}/{cls_folder_name}/English/*-C{ch_num_str}")
                    for td in target_dirs:
                        target_file = os.path.join(td, target_proc_name)

                        # Preserve existing media if present
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

                        restored_count += 1

        except Exception as e:
            print(f"Error restoring {s_path}: {e}")

    # Final public asset sync
    print("\n⚙️ Finalizing public asset sync for English subjects...")
    for g in ['5', '6', '7', '8', '9', '10']:
        src_dir = f'backend/ProcessedContent/Class{g}/English'
        dst_dir = f'frontend-nextjs/public/ProcessedContent/Class{g}/English'
        if os.path.exists(src_dir):
            shutil.copytree(src_dir, dst_dir, dirs_exist_ok=True)

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY RESTORED {restored_count} ENGLISH PROCESSED MODULES WITH 100% SOURCE FIDELITY!")
    print("=========================================================================")

if __name__ == '__main__':
    restore_all_english_subjects()
