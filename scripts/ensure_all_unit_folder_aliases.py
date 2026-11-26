import os
import glob
import json
import shutil
import re

PROCESSED_BASES = ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']

def create_unit_folder_aliases():
    print("=========================================================================")
    print("GURUKUL AI — UNIT FOLDER ALIAS GENERATOR")
    print("Ensuring U01 to U05 unit aliases exist for every single chapter...")
    print("=========================================================================")

    created_aliases = 0

    for base in PROCESSED_BASES:
        if not os.path.exists(base):
            continue

        for cls_dir in glob.glob(f"{base}/Class*"):
            g_num = os.path.basename(cls_dir).replace('Class', '').strip()
            for subj_dir in glob.glob(f"{cls_dir}/*"):
                pc_subj = os.path.basename(subj_dir)

                # Find all chapter folders
                ch_dirs = [d for d in glob.glob(f"{subj_dir}/*") if os.path.isdir(d)]
                for cd in ch_dirs:
                    ch_folder_name = os.path.basename(cd)

                    c_match = re.search(r'-C(\d+)$', ch_folder_name)
                    if not c_match:
                        continue

                    ch_num_int = int(c_match.group(1))
                    ch_num_str = str(ch_num_int).zfill(2)

                    s_code = 'ENG' if 'eng' in pc_subj.lower() else 'HIN' if 'hin' in pc_subj.lower() else 'MAT' if 'mat' in pc_subj.lower() else 'SCI' if 'sci' in pc_subj.lower() else 'SOC'

                    for u_num in range(1, 6):
                        unit_str = f"U{str(u_num).zfill(2)}"
                        alias_ch_id = f"G{g_num}-{s_code}-{unit_str}-C{ch_num_str}"
                        alias_dir = os.path.join(subj_dir, alias_ch_id)

                        if not os.path.exists(alias_dir):
                            shutil.copytree(cd, alias_dir, dirs_exist_ok=True)

                            # Update chapter_id and unit in overview.json & manifest.json inside alias_dir
                            for fname in ['overview.json', 'manifest.json']:
                                fpath = os.path.join(alias_dir, fname)
                                if os.path.exists(fpath):
                                    try:
                                        with open(fpath, 'r', encoding='utf-8') as f:
                                            fdata = json.load(f)
                                        fdata['chapter_id'] = alias_ch_id
                                        fdata['unit'] = unit_str
                                        fdata['unit_number'] = u_num
                                        fdata['unit_title'] = f"Unit {u_num}"
                                        if 'source_identity' in fdata and isinstance(fdata['source_identity'], dict):
                                            fdata['source_identity']['chapter_id'] = alias_ch_id
                                            fdata['source_identity']['unit'] = unit_str

                                        with open(fpath, 'w', encoding='utf-8') as f:
                                            json.dump(fdata, f, indent=2, ensure_ascii=False)
                                    except Exception:
                                        pass
                            created_aliases += 1

    print(f"✅ Created {created_aliases:,} unit folder aliases!")

if __name__ == '__main__':
    create_unit_folder_aliases()
