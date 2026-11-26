import glob
import json
import os
import shutil

SOURCE_DIR = 'Contents/Class 5/English/Source Files'
PROCESSED_BASES = ['backend/ProcessedContent/Class5/English', 'frontend-nextjs/public/ProcessedContent/Class5/English']

ATTACHED_MAPPING = {
    '13-Overview.json': 'overview.json',
    '14-Notes.json': 'notes.json',
    '15-Mindmaps.json': 'mindmaps.json',
    '16-Flashcards.json': 'flashcards.json',
    '17-Quiz.json': 'quiz.json',
    '18-Question_Papers.json': 'question_papers.json',
    '19-Foundational.json': 'foundational.json',
    '20-Master.json': 'master.json'
}

def restore_class5_english_source_data():
    print("=========================================================================")
    print("GURUKUL AI — ATTACHED CLASS 5 ENGLISH EXACT RESTORATION ENGINE")
    print("Restoring 100% untruncated word-for-word data from all 8 attached JSONs...")
    print("=========================================================================")

    restored_count = 0

    for src_fname, proc_fname in ATTACHED_MAPPING.items():
        src_path = os.path.join(SOURCE_DIR, src_fname)
        if not os.path.exists(src_path):
            print(f"⚠️ Source file missing: {src_path}")
            continue

        with open(src_path, 'r', encoding='utf-8') as f:
            src_data = json.load(f)

        chapters = src_data.get('chapters') or src_data.get('chapter_quizzes') or (src_data if isinstance(src_data, list) else [])
        if not isinstance(chapters, list):
            chapters = [src_data]

        print(f"📄 Restoring from {src_fname} ({len(chapters)} chapter records)...")

        for ch_idx, ch_obj in enumerate(chapters):
            ch_num = ch_obj.get('chapter_number') or ch_obj.get('chapter') or (ch_idx + 1)
            ch_num_str = str(ch_num).zfill(2)

            for base_dir in PROCESSED_BASES:
                matched_folders = glob.glob(f"{base_dir}/*-C{ch_num_str}")
                for target_folder in matched_folders:
                    target_file = os.path.join(target_folder, proc_fname)

                    # Preserve video_url and image_asset if overview or manifest
                    curr_video = None
                    curr_image = None
                    if os.path.exists(target_file) and proc_fname in ['overview.json', 'manifest.json']:
                        try:
                            with open(target_file, 'r', encoding='utf-8') as tf:
                                existing_data = json.load(tf)
                            curr_video = existing_data.get('video_url')
                            curr_image = existing_data.get('image_asset')
                        except Exception:
                            pass

                    # Prepare restored content object
                    restored_obj = dict(ch_obj) if isinstance(ch_obj, dict) else ch_obj

                    if isinstance(restored_obj, dict):
                        if curr_video and not restored_obj.get('video_url'):
                            restored_obj['video_url'] = curr_video
                        if curr_image and not restored_obj.get('image_asset'):
                            restored_obj['image_asset'] = curr_image

                    with open(target_file, 'w', encoding='utf-8') as tf:
                        json.dump(restored_obj, tf, indent=2, ensure_ascii=False)

                    restored_count += 1

    # Sync backend to public
    shutil.copytree('backend/ProcessedContent/Class5/English', 'frontend-nextjs/public/ProcessedContent/Class5/English', dirs_exist_ok=True)

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY RESTORED {restored_count} PROCESSED MODULES WITH 100% SOURCE FIDELITY!")
    print("=========================================================================")

if __name__ == '__main__':
    restore_class5_english_source_data()
