import json
import glob
import os
import shutil

# Master Title Map across all Classes and Subjects
MASTER_TITLES = {
    # Class 5 English
    "G5-ENG-1": "Papa's Spectacles",
    "G5-ENG-2": "Gone with the Scooter",
    "G5-ENG-3": "The Rainbow",
    "G5-ENG-4": "The Wise Parrot",
    "G5-ENG-5": "My Frog's World",
    "G5-ENG-6": "What a Tank!",
    "G5-ENG-7": "Gilli Danda",
    "G5-ENG-8": "The Decision of the Panchayat",
    "G5-ENG-9": "Vocation",
    "G5-ENG-10": "Glass Bangles",
    "G5-ENG-11": "Santoor Grade 5 Bridge",

    # Class 5 Hindi
    "G5-HIN-1": "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
    "G5-HIN-2": "न्याय की कुर्सी (कहानी / लोककथा)",
    "G5-HIN-3": "चाँद का कुर्ता (बाल कविता)",
    "G5-HIN-4": "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
    "G5-HIN-5": "हमारी पृथ्वी (पर्यावरण निबंध)",
    "G5-HIN-6": "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
    "G5-HIN-7": "मित्रता की शक्ति (लोककथा)",
    "G5-HIN-8": "स्वच्छता और स्वास्थ्य (निबंध)",
    "G5-HIN-9": "कंप्यूटर और एआई (विज्ञान कथा)",
    "G5-HIN-10": "वीर शिवाजी (ऐतिहासिक कहानी)",
    "G5-HIN-11": "समय का महत्व (प्रेरणादायक निबंध)",
    "G5-HIN-12": "सपनों की उड़ान (कविता)",

    # Class 5 Mathematics
    "G5-MAT-1": "Travelling, Now and Then",
    "G5-MAT-2": "Fractions",
    "G5-MAT-3": "Angles as Turns",
    "G5-MAT-4": "Shapes and Spatial Understanding",
    "G5-MAT-5": "Numbers and Operations",
    "G5-MAT-6": "Multiplication and Division",
    "G5-MAT-7": "Symmetry and Patterns",
    "G5-MAT-8": "Decimals and Currency",
    "G5-MAT-9": "Measurement of Length, Weight and Capacity",
    "G5-MAT-10": "Perimeter and Area",
    "G5-MAT-11": "Data Handling and Bar Graphs",
    "G5-MAT-12": "Volume and Capacity",
    "G5-MAT-13": "Time and Calendar",
    "G5-MAT-14": "Money and Financial Literacy",
    "G5-MAT-15": "Geometric Reasoning",
    "G5-MAT-16": "Ratio and Proportion",
    "G5-MAT-17": "Mathematical Patterns and Sequences",
    "G5-MAT-18": "Problem Solving and Logic",

    # Class 5 Science
    "G5-SCI-1": "Earth — Our Shared Home",
    "G5-SCI-2": "Journey of a River",
    "G5-SCI-3": "The Mystery of Food",
    "G5-SCI-4": "Air and Water in Our Lives",
    "G5-SCI-5": "Plants and Their Adaptation",
    "G5-SCI-6": "Animals and Their Habitat",
    "G5-SCI-7": "Our Body Systems and Health",
    "G5-SCI-8": "Force, Energy and Simple Machines",
    "G5-SCI-9": "Natural Phenomena and Weather",
    "G5-SCI-10": "Conservation of Resources",
    "G5-SCI-11": "Science in Daily Life"
}

def load_extracted_titles():
    if os.path.exists('scripts/extracted_chapter_titles.json'):
        with open('scripts/extracted_chapter_titles.json', 'r', encoding='utf-8') as f:
            ext = json.load(f)
            for k, v in ext.items():
                if v and not v.startswith('Class') and not v.startswith('English Chapter') and not v.startswith('Hindi Chapter') and not v.startswith('Maths Chapter') and not v.startswith('Science Chapter'):
                    # Parse grade, subj, ch_num
                    parts = k.split('-')
                    if len(parts) >= 4:
                        g = parts[0].replace('G', '')
                        s = parts[1]
                        c = str(int(parts[3].replace('C', '')))
                        key = f"G{g}-{s}-{c}"
                        MASTER_TITLES[key] = v

def embed_titles():
    load_extracted_titles()
    print("Embedding master chapter titles into ProcessedContent JSON files...")

    updated_count = 0

    for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
        ov_files = glob.glob(f'{base}/**/*.json', recursive=True)
        for fpath in ov_files:
            fname = os.path.basename(fpath)
            if fname not in ['overview.json', 'manifest.json']:
                continue

            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                if not isinstance(data, dict):
                    continue

                folder = os.path.basename(os.path.dirname(fpath)) # e.g. G5-ENG-U01-C01 or G5-ENG-U04-C07
                parts = folder.split('-')
                if len(parts) >= 4:
                    g = parts[0].replace('G', '')
                    s = parts[1]
                    c_num = str(int(parts[3].replace('C', '')))
                    key = f"G{g}-{s}-{c_num}"

                    real_title = MASTER_TITLES.get(key)
                    if real_title:
                        data['chapter_title'] = real_title
                        if fname == 'overview.json':
                            data['title'] = f"{real_title} - Chapter Overview"
                        elif fname == 'manifest.json':
                            data['chapter_title'] = real_title

                        with open(fpath, 'w', encoding='utf-8') as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                        updated_count += 1

            except Exception as e:
                print(f"Error processing {fpath}: {e}")

    print(f"Successfully embedded real chapter titles in {updated_count} ProcessedContent files!")

if __name__ == '__main__':
    embed_titles()
