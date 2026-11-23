import json
import glob
import os
import shutil

def process_and_build_all_classes_content():
    print("=========================================================================")
    print("GURUKUL AI — MASTER 8-MODULE AUTHENTIC SOURCE CONTENT BUILDER")
    print("Processing 13-Overview, 14-Notes, 15-Mindmaps, 16-Flashcards, 17-Quiz,")
    print("18-Question_Papers, 19-Foundational, 20-Master JSON files across ALL Classes...")
    print("=========================================================================")

    # Find all Source Files directories in Contents/
    source_dirs = glob.glob('Contents/**/Source Files', recursive=True) + glob.glob('Contents/**/Source FIles', recursive=True)
    print(f"Found {len(source_dirs)} Source Files directories in Contents/")

    total_chapters_processed = 0
    total_modules_written = 0

    module_file_mapping = {
        '13-Overview.json': 'overview.json',
        '14-Notes.json': 'notes.json',
        '15-Mindmaps.json': 'mindmaps.json',
        '16-Flashcards.json': 'flashcards.json',
        '17-Quiz.json': 'quiz.json',
        '18-Question_Papers.json': 'question_papers.json',
        '19-Foundational.json': 'foundational.json',
        '20-Master.json': 'master.json'
    }

    for s_dir in source_dirs:
        norm_dir = s_dir.replace('\\', '/')
        parts = norm_dir.split('/')
        # Example parts: ['Contents', 'Class 5', 'English', 'Source Files']
        if len(parts) < 4:
            continue

        cls_dir = parts[1] # e.g. Class 5, Class 10
        subj_dir = parts[2] # e.g. English, Hindi, Maths, Science, Social I

        cls_name = cls_dir.replace(' ', '') # e.g. Class5, Class10

        # Determine ProcessedContent subject name
        pc_subj = subj_dir
        if 'math' in subj_dir.lower():
            pc_subj = 'MathsI' if 'Maths I' in subj_dir else 'Maths' if 'Maths' in subj_dir else subj_dir
        elif 'soc' in subj_dir.lower():
            pc_subj = 'Social' if 'Social' in subj_dir else subj_dir

        print(f"\n📂 Processing {cls_dir} -> {subj_dir}...")

        # Process each of the 8 module files
        for src_file_name, target_file_name in module_file_mapping.items():
            # Handle case variations in file names (e.g. 09-quiz.json, 17-Quiz.json)
            src_file_candidates = glob.glob(os.path.join(s_dir, f"*{target_file_name.split('.')[0]}*.json"))
            if not src_file_candidates:
                src_file_candidates = glob.glob(os.path.join(s_dir, f"*{src_file_name.split('-')[1]}"))

            for src_path in src_file_candidates:
                try:
                    with open(src_path, 'r', encoding='utf-8') as sf:
                        src_data = json.load(sf)

                    chapters = src_data.get('chapters') or src_data.get('chapter_quizzes') or []
                    if isinstance(src_data, list):
                        chapters = src_data

                    for ch in chapters:
                        if not isinstance(ch, dict):
                            continue

                        ch_num = ch.get('chapter_number') or ch.get('chapter') or ch.get('chapter_num') or ch.get('unit_number')
                        if not ch_num:
                            continue

                        ch_num_str = str(ch_num).zfill(2)

                        # Match target chapter folders in ProcessedContent
                        search_pattern = f'backend/ProcessedContent/{cls_name}/*/*-C{ch_num_str}'
                        matching_folders = glob.glob(search_pattern)

                        if not matching_folders:
                            # Search in specific subject
                            search_pattern = f'backend/ProcessedContent/{cls_name}/{pc_subj}/*-C{ch_num_str}'
                            matching_folders = glob.glob(search_pattern)

                        if not matching_folders:
                            # Create folder if it doesn't exist
                            prefix = 'ENG' if 'eng' in subj_dir.lower() else 'HIN' if 'hin' in subj_dir.lower() else 'MAT' if 'mat' in subj_dir.lower() else 'SCI' if 'sci' in subj_dir.lower() else 'SOC'
                            cls_num_digit = cls_name.replace('Class', '')
                            folder_name = f"G{cls_num_digit}-{prefix}-U01-C{ch_num_str}"
                            target_backend_dir = os.path.join('backend/ProcessedContent', cls_name, pc_subj, folder_name)
                            os.makedirs(target_backend_dir, exist_ok=True)
                            matching_folders = [target_backend_dir]

                        for backend_folder in matching_folders:
                            rel_path = os.path.relpath(backend_folder, 'backend/ProcessedContent')
                            public_folder = os.path.join('frontend-nextjs/public/ProcessedContent', rel_path)

                            for target_folder in [backend_folder, public_folder]:
                                os.makedirs(target_folder, exist_ok=True)
                                out_json_path = os.path.join(target_folder, target_file_name)

                                # Extract exact, full, untruncated content payload
                                payload = ch.get('quizzes') or ch.get('questions') or ch.get('quiz') or ch.get('notes') or ch.get('mindmap') or ch.get('flashcards') or ch.get('foundational') or ch.get('master') or ch.get('overview') or ch

                                with open(out_json_path, 'w', encoding='utf-8') as out_f:
                                    json.dump(payload, out_f, indent=2, ensure_ascii=False)

                                total_modules_written += 1

                except Exception as e:
                    print(f"⚠️ Error processing {src_path}: {e}")

    # Step 2: Run NotebookLM video links merger and MP4 path mapper
    print("\n⚙️ Step 2: Merging NotebookLM video links...")
    os.system('python scripts/merge_notebook_links.py')

    print("\n⚙️ Step 3: Mapping direct MP4 video paths...")
    os.system('python scripts/map_direct_mp4_videos.py')

    # Step 3: Sync ProcessedContent to public static assets
    print("\n⚙️ Step 4: Syncing backend/ProcessedContent -> frontend-nextjs/public/ProcessedContent...")
    shutil.copytree('backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent', dirs_exist_ok=True)

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY PROCESSED & SYNCED ALL 8 MODULES FOR ALL CLASSES & SUBJECTS!")
    print(f"✅ Written {total_modules_written} total module JSON files!")
    print("=========================================================================")

if __name__ == '__main__':
    process_and_build_all_classes_content()
