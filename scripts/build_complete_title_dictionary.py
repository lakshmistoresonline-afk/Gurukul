import glob
import json
import os

def build_complete_title_dictionary():
    print("Collecting all authentic chapter titles from all ProcessedContent and Source files...")

    master_map = {}

    # 1. From extracted_chapter_titles.json
    if os.path.exists('scripts/extracted_chapter_titles.json'):
        with open('scripts/extracted_chapter_titles.json', 'r', encoding='utf-8') as f:
            ext = json.load(f)
            for k, v in ext.items():
                if v and not v.startswith('Class') and not 'Chapter' in v:
                    master_map[k] = v

    # 2. From ProcessedContent
    ov_files = glob.glob('backend/ProcessedContent/**/*.json', recursive=True) + glob.glob('frontend-nextjs/public/ProcessedContent/**/*.json', recursive=True)

    for fpath in ov_files:
        if os.path.basename(fpath) in ['overview.json', 'manifest.json']:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                t = data.get('chapter_title') or data.get('title')
                ch_id = data.get('chapter_id') or os.path.basename(os.path.dirname(fpath))
                if t and not t.startswith('Class') and not 'Chapter' in t:
                    # Clean up ' - Chapter Overview'
                    clean_t = t.replace(' - Chapter Overview', '').strip()
                    master_map[ch_id] = clean_t
            except Exception as e:
                pass

    print(f"Total unique chapter IDs mapped: {len(master_map)}")

    # Update curriculumClient.ts with complete NCERT_CHAPTER_TITLES map
    curr_client_path = 'frontend-nextjs/src/lib/curriculumClient.ts'
    with open(curr_client_path, 'r', encoding='utf-8') as f:
        code = f.read()

    map_json = json.dumps(master_map, indent=2, ensure_ascii=False)
    new_dict_code = f"const NCERT_CHAPTER_TITLES: Record<string, string> = {map_json};\n\n"

    import re
    updated_code = re.sub(r'const NCERT_CHAPTER_TITLES: Record<string, string> = \{[\s\S]*?\};\n\n', new_dict_code, code)

    with open(curr_client_path, 'w', encoding='utf-8') as f:
        f.write(updated_code)

    print("✅ Successfully updated curriculumClient.ts with complete NCERT_CHAPTER_TITLES map!")

if __name__ == '__main__':
    build_complete_title_dictionary()
