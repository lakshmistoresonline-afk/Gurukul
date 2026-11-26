import json
import glob
import os
import shutil
import re

def process_class8_class9_videos():
    print("=========================================================================")
    print("GURUKUL AI — CLASS 8 & CLASS 9 NOTEBOOKLM VIDEO PROCESSING ENGINE")
    print("Processing Class 8 and Class 9 studio_video_links_notebook.json files...")
    print("=========================================================================")

    link_files = (
        glob.glob('Contents/Class 8/**/studio_video_links_notebook.json', recursive=True) +
        glob.glob('Contents/Class 9/**/studio_video_links_notebook.json', recursive=True)
    )

    print(f"Found {len(link_files)} studio video link files for Class 8 & Class 9")

    merged_count = 0

    for fpath in link_files:
        norm_f = fpath.replace('\\', '/')
        parts = norm_f.split('/')
        if len(parts) < 3:
            continue

        cls_dir = parts[1] # e.g. Class 8, Class 9
        subj_dir = parts[2] # e.g. English, Hindi, Science, Maths I

        grade_num = cls_dir.lower().replace('class', '').strip()
        cls_folder_name = f"Class{grade_num}"

        # Resolve subject folder name
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
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                data = json.load(fp)

            chapters = data.get('chapters') if isinstance(data, dict) else data
            if not isinstance(chapters, list):
                continue

            for ch in chapters:
                if not isinstance(ch, dict):
                    continue

                ch_num = ch.get('chapter_number') or ch.get('chapter') or ch.get('chapter_num')
                v_link = ch.get('video_link') or ch.get('video_url')
                v_title = ch.get('video_title') or ch.get('chapter_title')

                if not v_link or not str(v_link).startswith('http'):
                    continue

                if not ch_num:
                    continue

                ch_num_int = int(ch_num)
                ch_num_str = str(ch_num_int).zfill(2)

                # Search target chapter directories in ProcessedContent
                for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
                    target_dirs = glob.glob(f'{base}/{cls_folder_name}/{pc_subj}/*-C{ch_num_str}')
                    if not target_dirs:
                        target_dirs = glob.glob(f'{base}/{cls_folder_name}/*/*-C{ch_num_str}')

                    for td in target_dirs:
                        ov_path = os.path.join(td, 'overview.json')
                        mf_path = os.path.join(td, 'manifest.json')

                        if os.path.exists(ov_path):
                            try:
                                with open(ov_path, 'r', encoding='utf-8') as ov_f:
                                    ov_data = json.load(ov_f)
                                ov_data['video_url'] = v_link
                                if v_title:
                                    ov_data['video_title'] = v_title
                                with open(ov_path, 'w', encoding='utf-8') as ov_f:
                                    json.dump(ov_data, ov_f, indent=2, ensure_ascii=False)
                                merged_count += 1
                            except Exception as e:
                                print(f"Error updating {ov_path}: {e}")

                        if os.path.exists(mf_path):
                            try:
                                with open(mf_path, 'r', encoding='utf-8') as mf_f:
                                    mf_data = json.load(mf_f)
                                mf_data['video_url'] = v_link
                                if v_title:
                                    mf_data['video_title'] = v_title
                                with open(mf_path, 'w', encoding='utf-8') as mf_f:
                                    json.dump(mf_data, mf_f, indent=2, ensure_ascii=False)
                            except Exception as e:
                                print(f"Error updating {mf_path}: {e}")

        except Exception as e:
            print(f"⚠️ Error processing {fpath}: {e}")

    # Final Sync
    print("\n⚙️ Finalizing public asset sync...")
    shutil.copytree('backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent', dirs_exist_ok=True)

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY PROCESSED & MERGED CLASS 8 & CLASS 9 NOTEBOOKLM LINKS INTO {merged_count} CHAPTERS!")
    print("=========================================================================")

if __name__ == '__main__':
    process_class8_class9_videos()
