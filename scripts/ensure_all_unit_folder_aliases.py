import os
import glob
import shutil
import json

def alias_unit_folders():
    print("=========================================================================")
    print("GURUKUL AI — UNIVERSAL UNIT ALIASING ENGINE (U01 - U05)")
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
                g_part = parts[0] # e.g. G7
                s_part = parts[1] # e.g. ENG
                u_part = parts[2] # e.g. U01
                c_part = parts[3] # e.g. C03

                parent_dir = os.path.dirname(folder)

                # Generate aliases for U01, U02, U03, U04, U05
                for target_u_num in range(1, 6):
                    target_u_str = f"U{str(target_u_num).zfill(2)}"
                    if target_u_str == u_part:
                        continue

                    alias_folder_name = f"{g_part}-{s_part}-{target_u_str}-{c_part}"
                    alias_folder_path = os.path.join(parent_dir, alias_folder_name)

                    if not os.path.exists(alias_folder_path):
                        shutil.copytree(folder, alias_folder_path, dirs_exist_ok=True)
                        created_count += 1

                    # Ensure manifest.json and overview.json inside alias_folder_path match chapter_id
                    for fname in ['manifest.json', 'overview.json']:
                        fpath = os.path.join(alias_folder_path, fname)
                        if os.path.exists(fpath):
                            try:
                                with open(fpath, 'r', encoding='utf-8') as mf:
                                    mdata = json.load(mf)
                                mdata['chapter_id'] = alias_folder_name
                                mdata['unit'] = target_u_str
                                if 'unit_number' in mdata:
                                    mdata['unit_number'] = target_u_num
                                if 'source_identity' in mdata and isinstance(mdata['source_identity'], dict):
                                    mdata['source_identity']['chapter_id'] = alias_folder_name
                                    mdata['source_identity']['unit'] = target_u_str
                                with open(fpath, 'w', encoding='utf-8') as mf:
                                    json.dump(mdata, mf, indent=2, ensure_ascii=False)
                            except Exception as e:
                                print(f"Error updating {fpath}: {e}")

    print(f"✅ Synchronized {created_count} universal unit folder aliases across U01-U05!")

if __name__ == '__main__':
    alias_unit_folders()
