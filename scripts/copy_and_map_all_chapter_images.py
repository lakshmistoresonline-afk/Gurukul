import glob
import json
import os
import shutil
import re

def copy_and_map_chapter_images():
    print("=========================================================================")
    print("GURUKUL AI — DIRECTORY-AWARE CHAPTER DIAGRAM & IMAGE MAPPING ENGINE")
    print("Mapping 380+ chapter images directly from parent Class/Subject/Images...")
    print("=========================================================================")

    # 1. Find all image files in Contents/
    content_images = (
        glob.glob('Contents/**/*.png', recursive=True) +
        glob.glob('Contents/**/*.jpg', recursive=True) +
        glob.glob('Contents/**/*.jpeg', recursive=True) +
        glob.glob('Contents/**/*.svg', recursive=True)
    )

    public_img_dir = 'frontend-nextjs/public/assets/images'
    os.makedirs(public_img_dir, exist_ok=True)

    copied_count = 0
    mapped_count = 0

    for img_path in content_images:
        fname = os.path.basename(img_path)
        norm_img_path = img_path.replace('\\', '/')
        parts = norm_img_path.split('/')

        # Example parts: ['Contents', 'Class 7', 'English', 'Images', '13-ch3_anand_alarm_boats.png']
        if 'Images' not in parts or parts.index('Images') < 2:
            continue

        cls_dir = parts[parts.index('Images') - 2] # e.g. Class 7
        subj_dir = parts[parts.index('Images') - 1] # e.g. English

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

        # Parse chapter number from filename (e.g. 13-ch3_anand_alarm_boats.png -> 3)
        ch_num_match = re.search(r'ch(?:apter)?_?(\d+)', fname.lower()) or re.search(r'-c(\d+)_', fname.lower()) or re.search(r'^(\d+)-', fname.lower())
        if not ch_num_match:
            continue

        ch_num_int = int(ch_num_match.group(1))
        ch_num_str = str(ch_num_int).zfill(2)

        # Copy image file under multiple public filenames for 100% HTTP resolution
        pub_url_orig = f"/assets/images/{fname}"
        dst_orig = os.path.join(public_img_dir, fname)
        shutil.copy2(img_path, dst_orig)
        copied_count += 1

        clean_fname = fname
        if '-' in fname:
            clean_fname = fname.split('-', 1)[1]
            dst_clean = os.path.join(public_img_dir, clean_fname)
            shutil.copy2(img_path, dst_clean)
            copied_count += 1

        pub_url_clean = f"/assets/images/{clean_fname}"

        # Map to ProcessedContent overview and manifest JSON files
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

                        ch_title = ov_data.get('chapter_title') or f"Chapter {ch_num_int}"

                        ov_data['image_asset'] = {
                            "title": f"{ch_title} Concept Diagram",
                            "asset_url": pub_url_clean,
                            "url": pub_url_clean,
                            "filename": clean_fname,
                            "type": "16:9 Diagram",
                            "hotspots": [
                                {
                                    "id": f"hs_{ch_num_int}_1",
                                    "label": "Core Mechanism",
                                    "tooltip_explanation": f"Interactive concept hotspot for {ch_title}."
                                },
                                {
                                    "id": f"hs_{ch_num_int}_2",
                                    "label": "Key Takeaway",
                                    "tooltip_explanation": f"Essential learning takeaway for {ch_title}."
                                }
                            ]
                        }

                        with open(ov_path, 'w', encoding='utf-8') as ov_f:
                            json.dump(ov_data, ov_f, indent=2, ensure_ascii=False)
                        mapped_count += 1

                    except Exception as e:
                        print(f"Error updating {ov_path}: {e}")

                if os.path.exists(mf_path):
                    try:
                        with open(mf_path, 'r', encoding='utf-8') as mf_f:
                            mf_data = json.load(mf_f)

                        mf_data['image_asset'] = {
                            "title": f"Chapter {ch_num_int} Concept Diagram",
                            "asset_url": pub_url_clean,
                            "url": pub_url_clean,
                            "filename": clean_fname
                        }

                        with open(mf_path, 'w', encoding='utf-8') as mf_f:
                            json.dump(mf_data, mf_f, indent=2, ensure_ascii=False)

                    except Exception as e:
                        print(f"Error updating {mf_path}: {e}")

    print(f"✅ Successfully copied {copied_count} image files to {public_img_dir}!")
    print(f"✅ Successfully mapped diagram images across {mapped_count} overview/manifest files!")

if __name__ == '__main__':
    copy_and_map_chapter_images()
