import os
import glob
import shutil
import json

def alias_unit_folders():
    print("=========================================================================")
    print("GURUKUL AI — CHAPTER UNIT FOLDER ALIASING & MANIFEST RECOVERY ENGINE")
    print("Creating folder aliases so U01, U02, U03, U04, U05 URLs resolve 100% on disk...")
    print("=========================================================================")

    bases = ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']
    created_count = 0

    for base in bases:
        all_ch_folders = glob.glob(f'{base}/*/*/*-C*', recursive=True)
        for folder in all_ch_folders:
            folder_name = os.path.basename(folder)
            parts = folder_name.split('-')
            if len(parts) >= 4:
                g_part = parts[0] # e.g. G5
                s_part = parts[1] # e.g. ENG
                u_part = parts[2] # e.g. U05
                c_part = parts[3] # e.g. C10

                parent_dir = os.path.dirname(folder)

                # Create alias for U01 if the source is U02/U03/U04/U05
                if u_part != 'U01':
                    u01_folder_name = f"{g_part}-{s_part}-U01-{c_part}"
                    u01_folder_path = os.path.join(parent_dir, u01_folder_name)

                    if not os.path.exists(u01_folder_path):
                        shutil.copytree(folder, u01_folder_path, dirs_exist_ok=True)
                        created_count += 1

                    # Ensure manifest.json and overview.json inside u01_folder_path match chapter_id
                    for fname in ['manifest.json', 'overview.json']:
                        fpath = os.path.join(u01_folder_path, fname)
                        if os.path.exists(fpath):
                            try:
                                with open(fpath, 'r', encoding='utf-8') as mf:
                                    mdata = json.load(mf)
                                mdata['chapter_id'] = u01_folder_name
                                mdata['unit'] = 'U01'
                                if 'unit_number' in mdata:
                                    mdata['unit_number'] = 1
                                if 'source_identity' in mdata and isinstance(mdata['source_identity'], dict):
                                    mdata['source_identity']['chapter_id'] = u01_folder_name
                                    mdata['source_identity']['unit'] = 'U01'
                                with open(fpath, 'w', encoding='utf-8') as mf:
                                    json.dump(mdata, mf, indent=2, ensure_ascii=False)
                            except Exception as e:
                                print(f"Error updating {fpath}: {e}")

    print(f"✅ Synchronized {created_count} unit folder aliases and manifest chapter IDs!")

if __name__ == '__main__':
    alias_unit_folders()
