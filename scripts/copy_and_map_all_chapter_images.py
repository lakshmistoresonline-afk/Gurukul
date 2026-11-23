import glob
import json
import os
import shutil

def copy_and_map_chapter_images():
    print("=========================================================================")
    print("GURUKUL AI — CHAPTER DIAGRAM & IMAGE ASSET MAPPING ENGINE")
    print("Copying all 380 chapter images to public/assets/images and updating JSONs...")
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
    img_map = {} # filename -> public_url

    for img_path in content_images:
        fname = os.path.basename(img_path)
        dst_path = os.path.join(public_img_dir, fname)

        try:
            shutil.copy2(img_path, dst_path)
            copied_count += 1
            public_url = f"/assets/images/{fname}"
            img_map[fname.lower()] = public_url

            # Map without prefix numbers (e.g. 02-ch1_letter_to_god.png -> ch1_letter_to_god.png)
            if '-' in fname:
                alt_fname = fname.split('-', 1)[1].lower()
                img_map[alt_fname] = public_url

        except Exception as e:
            print(f"Error copying {img_path}: {e}")

    print(f"✅ Successfully copied {copied_count} chapter diagram images to {public_img_dir}!")

    # 2. Map images into ProcessedContent JSONs
    mapped_count = 0

    for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
        ov_files = glob.glob(f'{base}/**/overview.json', recursive=True)

        for ov_path in ov_files:
            try:
                ch_id = os.path.basename(os.path.dirname(ov_path)) # e.g. G10-ENG-U01-C01
                parts = ch_id.split('-')
                if len(parts) < 4:
                    continue

                g_num = parts[0].replace('G', '')
                s_code = parts[1]
                c_num_str = parts[3].replace('C', '')
                c_num_int = int(c_num_str)

                with open(ov_path, 'r', encoding='utf-8') as f:
                    ov_data = json.load(f)

                # Match image by chapter number and subject
                matched_url = None
                for fname, pub_url in img_map.items():
                    if f"ch{c_num_int}_" in fname or f"ch{c_num_str}_" in fname or f"c{c_num_str}_" in fname or f"chapter_{c_num_int}_" in fname:
                        # Match subject
                        s_lower = s_code.lower()
                        if s_lower in fname or ('eng' in s_lower and 'eng' in fname) or ('hin' in s_lower and 'hin' in fname) or ('mat' in s_lower and 'mat' in fname) or ('sci' in s_lower and 'sci' in fname) or ('soc' in s_lower and 'soc' in fname):
                            matched_url = pub_url
                            break

                if matched_url:
                    if 'image_asset' not in ov_data or not isinstance(ov_data['image_asset'], dict):
                        ov_data['image_asset'] = {
                            "title": f"Chapter {c_num_int} Concept Diagram & Hotspots",
                            "asset_url": matched_url,
                            "type": "16:9 Diagram",
                            "hotspots": [
                                {
                                    "id": "hs_1",
                                    "label": "Core Mechanism",
                                    "tooltip_explanation": f"Interactive study hotspot detailing key concepts in Chapter {c_num_int}."
                                }
                            ]
                        }
                    else:
                        ov_data['image_asset']['asset_url'] = matched_url
                        ov_data['image_asset']['url'] = matched_url

                    with open(ov_path, 'w', encoding='utf-8') as f:
                        json.dump(ov_data, f, indent=2, ensure_ascii=False)

                    # Update manifest.json
                    mf_path = os.path.join(os.path.dirname(ov_path), 'manifest.json')
                    if os.path.exists(mf_path):
                        with open(mf_path, 'r', encoding='utf-8') as mf_f:
                            mf_data = json.load(mf_f)
                        if 'image_asset' not in mf_data or not isinstance(mf_data['image_asset'], dict):
                            mf_data['image_asset'] = ov_data['image_asset']
                        else:
                            mf_data['image_asset']['asset_url'] = matched_url
                        with open(mf_path, 'w', encoding='utf-8') as mf_f:
                            json.dump(mf_data, mf_f, indent=2, ensure_ascii=False)

                    mapped_count += 1

            except Exception as e:
                print(f"Error mapping image for {ov_path}: {e}")

    print(f"✅ Successfully mapped diagram images across {mapped_count} overview/manifest files!")

if __name__ == '__main__':
    copy_and_map_chapter_images()
