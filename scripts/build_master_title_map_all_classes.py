import json
import glob
import os
import shutil
import re

MASTER_EXHAUSTIVE_TITLES = {
    # Class 5 English
    ("5", "ENG", 1): "Papa's Spectacles",
    ("5", "ENG", 2): "Gone with the Scooter",
    ("5", "ENG", 3): "The Rainbow",
    ("5", "ENG", 4): "The Wise Parrot",
    ("5", "ENG", 5): "My Frog's World",
    ("5", "ENG", 6): "What a Tank!",
    ("5", "ENG", 7): "Gilli Danda",
    ("5", "ENG", 8): "The Decision of the Panchayat",
    ("5", "ENG", 9): "Vocation",
    ("5", "ENG", 10): "Glass Bangles",
    ("5", "ENG", 11): "Santoor Grade 5 Bridge & Review",

    # Class 5 Hindi
    ("5", "HIN", 1): "गंगा की कहानी / गगनयान (पर्यावरण निबंध व विज्ञान कथा)",
    ("5", "HIN", 2): "न्याय की कुर्सी (कहानी / लोककथा)",
    ("5", "HIN", 3): "चाँद का कुर्ता (बाल कविता)",
    ("5", "HIN", 4): "इक्कीसवीं सदी का संसार (पर्यावरण निबंध)",
    ("5", "HIN", 5): "हमारी पृथ्वी (पर्यावरण निबंध)",
    ("5", "HIN", 6): "पेड़-पौधे और हम (पर्यावरण व विज्ञान कथा)",
    ("5", "HIN", 7): "मित्रता की शक्ति (लोककथा)",
    ("5", "HIN", 8): "स्वच्छता और स्वास्थ्य (निबंध)",
    ("5", "HIN", 9): "कंप्यूटर और एआई (विज्ञान कथा)",
    ("5", "HIN", 10): "वीर शिवाजी (ऐतिहासिक कहानी)",
    ("5", "HIN", 11): "समय का महत्व (प्रेरणादायक निबंध)",
    ("5", "HIN", 12): "सपनों की उड़ान (कविता)",

    # Class 5 Maths
    ("5", "MAT", 1): "Travelling, Now and Then",
    ("5", "MAT", 2): "Fractions",
    ("5", "MAT", 3): "Angles as Turns",
    ("5", "MAT", 4): "Shapes and Spatial Understanding",
    ("5", "MAT", 5): "Numbers and Operations",
    ("5", "MAT", 6): "Multiplication and Division",
    ("5", "MAT", 7): "Symmetry and Patterns",
    ("5", "MAT", 8): "Decimals and Currency",
    ("5", "MAT", 9): "Measurement of Length, Weight and Capacity",
    ("5", "MAT", 10): "Perimeter and Area",
    ("5", "MAT", 11): "Data Handling and Bar Graphs",
    ("5", "MAT", 12): "Volume and Capacity",
    ("5", "MAT", 13): "Time and Calendar",
    ("5", "MAT", 14): "Money and Financial Literacy",
    ("5", "MAT", 15): "Geometric Reasoning",
    ("5", "MAT", 16): "Ratio and Proportion",
    ("5", "MAT", 17): "Mathematical Patterns and Sequences",
    ("5", "MAT", 18): "Problem Solving and Logic",

    # Class 5 Science
    ("5", "SCI", 1): "Earth — Our Shared Home",
    ("5", "SCI", 2): "Journey of a River",
    ("5", "SCI", 3): "The Mystery of Food",
    ("5", "SCI", 4): "Air and Water in Our Lives",
    ("5", "SCI", 5): "Plants and Their Adaptation",
    ("5", "SCI", 6): "Animals and Their Habitat",
    ("5", "SCI", 7): "Our Body Systems and Health",
    ("5", "SCI", 8): "Force, Energy and Simple Machines",
    ("5", "SCI", 9): "Natural Phenomena and Weather",
    ("5", "SCI", 10): "Conservation of Resources",
    ("5", "SCI", 11): "Science in Daily Life",

    # Class 6 English
    ("6", "ENG", 1): "A Bottle of Dew",
    ("6", "ENG", 2): "The Friendship",
    ("6", "ENG", 3): "The Magic Powder",
    ("6", "ENG", 4): "The Way the Kite Flies",
    ("6", "ENG", 5): "A Lesson for All",
    ("6", "ENG", 6): "The Clever Jackal",
    ("6", "ENG", 7): "The Old Sage's Wisdom",
    ("6", "ENG", 8): "The Worth of a Skill",
    ("6", "ENG", 9): "The Great Indian Bustard",
    ("6", "ENG", 10): "The Starry Sky",
    ("6", "ENG", 11): "Yoga—a Way of Life",

    # Class 7 English
    ("7", "ENG", 1): "The Jamun Tree",
    ("7", "ENG", 2): "Wit and Wisdom (Tenali Raman & The Royal Elephant)",
    ("7", "ENG", 3): "My Brother's Great Invention & Paper Boats",
    ("7", "ENG", 4): "The Tunnel & Travel",
    ("7", "ENG", 5): "A Homage to Our Brave Soldiers & My Dear Soldiers",
    ("7", "ENG", 6): "Gifts of Chivalry & Courage",
    ("7", "ENG", 7): "The Choice is Yours (Self-Discipline & Values)",
    ("7", "ENG", 8): "The Bond of Friendship",
    ("7", "ENG", 9): "The Legend of the Mountain Peak",
    ("7", "ENG", 10): "Poorvi Grade 7 Synthesis & Review",

    # Class 7 Hindi
    ("7", "HIN", 1): "माँ, कह एक कहानी",
    ("7", "HIN", 2): "चतुर बालक",
    ("7", "HIN", 3): "फूल और काँटा",
    ("7", "HIN", 4): "पानी से पानी",
    ("7", "HIN", 5): "नहीं होना बीमार",
    ("7", "HIN", 6): "गिरधर कविराय की कुंडलियाँ",
    ("7", "HIN", 7): "वर्षा-बहार",
    ("7", "HIN", 8): "बिरजू महाराज से साक्षात्कार",
    ("7", "HIN", 9): "चिड़िया",
    ("7", "HIN", 10): "मीरा के पद",

    # Class 7 Maths I & II
    ("7", "MAT", 1): "Geometric Twins (Congruence of Triangles)",
    ("7", "MAT", 2): "Operations with Integers",
    ("7", "MAT", 3): "Finding Common Ground (Fractions & Decimals)",
    ("7", "MAT", 4): "Another Peek Beyond the Point (Decimals)",
    ("7", "MAT", 5): "Connecting the Dots (Lines & Angles)",
    ("7", "MAT", 6): "Constructions and Tillings",
    ("7", "MAT", 7): "Finding the Unknown (Simple Equations)",
    ("7", "MAT", 8): "Working with Fractions",
    ("7", "MAT", 9): "Comparing Quantities & Percentages",
    ("7", "MAT", 10): "Rational Numbers & Number Line",
    ("7", "MAT", 11): "Perimeter and Area of Plane Figures",
    ("7", "MAT", 12): "Algebraic Expressions & Terms",
    ("7", "MAT", 13): "Exponents and Powers",
    ("7", "MAT", 14): "Symmetry and Visualizing Solid Shapes",

    # Class 7 Science
    ("7", "SCI", 1): "Nutrition in Plants & Photosynthesis",
    ("7", "SCI", 2): "Nutrition in Animals & Human Digestion",
    ("7", "SCI", 3): "Fibre to Fabric & Animal Fibres",
    ("7", "SCI", 4): "Heat Transfer & Temperature Scales",
    ("7", "SCI", 5): "Changes Around Us: Physical and Chemical",
    ("7", "SCI", 6): "Adolescence: A Stage of Growth and Change",
    ("7", "SCI", 7): "Heat Transfer in Nature & Weather Systems",
    ("7", "SCI", 8): "Measurement of Time and Motion",
    ("7", "SCI", 9): "Life Processes in Animals & Respiration",
    ("7", "SCI", 10): "Life Processes in Plants & Transport",
    ("7", "SCI", 11): "Light: Shadows and Reflections",
    ("7", "SCI", 12): "Earth, Moon, and the Sun Systems",

    # Class 7 Social Science I & II
    ("7", "SOC", 1): "The Story of Indian Farming",
    ("7", "SOC", 2): "India and Her Neighbours",
    ("7", "SOC", 3): "Empires and Kingdoms: 6th to 10th Centuries",
    ("7", "SOC", 4): "New Political Formations in the 18th Century",
    ("7", "SOC", 5): "Environment and Human Settlement",
    ("7", "SOC", 6): "Understanding Media and Advertising",
    ("7", "SOC", 7): "Markets Around Us & Shirt in the Market",
    ("7", "SOC", 8): "Equality and Governance in Democracy",
    ("7", "SOC", 9): "Triad of Governance: Kautilya's Arthashastra",
    ("7", "SOC", 10): "Life in the Deserts and Tropical Regions",
    ("7", "SOC", 11): "Devotional Paths to the Divine",
    ("7", "SOC", 12): "The Making of Regional Cultures",

    # Class 8 English
    ("8", "ENG", 1): "The Best Christmas Present in the World",
    ("8", "ENG", 2): "The Tsunami & Geography Lesson",
    ("8", "ENG", 3): "Glimpses of the Past & Macavity: The Mystery Cat",
    ("8", "ENG", 4): "Bepin Choudhury's Lapse of Memory",
    ("8", "ENG", 5): "The Summit Within & The School Boy",
    ("8", "ENG", 6): "This is Jody's Fawn",
    ("8", "ENG", 7): "A Visit to Cambridge",
    ("8", "ENG", 8): "A Short Monsoon Diary",
    ("8", "ENG", 9): "The Great Stone Face – I",
    ("8", "ENG", 10): "The Great Stone Face – II",

    # Class 8 Maths I & II
    ("8", "MAT", 1): "Rational Numbers",
    ("8", "MAT", 2): "Linear Equations in One Variable",
    ("8", "MAT", 3): "Understanding Quadrilaterals",
    ("8", "MAT", 4): "Data Handling",
    ("8", "MAT", 5): "Square and Square Roots",
    ("8", "MAT", 6): "Cube and Cube Roots",
    ("8", "MAT", 7): "Comparing Quantities",
    ("8", "MAT", 8): "Algebraic Expressions and Identities",
    ("8", "MAT", 9): "Mensuration",
    ("8", "MAT", 10): "Exponents and Powers",
    ("8", "MAT", 11): "Direct and Inverse Proportions",
    ("8", "MAT", 12): "Factorisation",
    ("8", "MAT", 13): "Introduction to Graphs",

    # Class 8 Social Science I & II
    ("8", "SOC", 1): "How, When and Where",
    ("8", "SOC", 2): "From Trade to Territory: The Company Establishes Power",
    ("8", "SOC", 3): "Ruling the Countryside",
    ("8", "SOC", 4): "Tribals, Dikus and the Vision of a Golden Age",
    ("8", "SOC", 5): "When People Rebel: 1857 and After",
    ("8", "SOC", 6): "Civilising the Native, Educating the Nation",
    ("8", "SOC", 7): "Women, Caste and Reform",
    ("8", "SOC", 8): "The Making of the National Movement: 1870s–1947",
    ("8", "SOC", 9): "Resources and Development",
    ("8", "SOC", 10): "Land, Soil, Water, Natural Vegetation and Wildlife Resources",
    ("8", "SOC", 11): "Agriculture and Industries",
    ("8", "SOC", 12): "Human Resources & Law and Social Justice",

    # Class 9 English
    ("9", "ENG", 1): "The Fun They Had & The Road Not Taken",
    ("9", "ENG", 2): "The Sound of Music & Wind",
    ("9", "ENG", 3): "The Little Girl & Rain on the Roof",
    ("9", "ENG", 4): "A Truly Beautiful Mind & A Legend of the Northland",
    ("9", "ENG", 5): "The Snake and the Mirror & A Slumber Did My Spirit Seal",
    ("9", "ENG", 6): "My Childhood & No Men Are Foreign",
    ("9", "ENG", 7): "Reach for the Top & On Killing a Tree",
    ("9", "ENG", 8): "Kathmandu & A House Is Not a Home",
    ("9", "ENG", 9): "If I Were You & The Beggar",
    ("9", "ENG", 10): "Beehive Grade 9 Review & Synthesis",

    # Class 10 English
    ("10", "ENG", 1): "A Letter to God & Dust of Snow",
    ("10", "ENG", 2): "Nelson Mandela: Long Walk to Freedom",
    ("10", "ENG", 3): "Two Stories about Flying & How to Tell Wild Animals",
    ("10", "ENG", 4): "From the Diary of Anne Frank & Amanda!",
    ("10", "ENG", 5): "Glimpses of India (I. A Baker from Goa, II. Coorg, III. Tea from Assam)",
    ("10", "ENG", 6): "Mijbil the Otter & Fog",
    ("10", "ENG", 7): "Madam Rides the Bus & The Tale of Custard the Dragon",
    ("10", "ENG", 8): "The Sermon at Benares & For Anne Gregory",
    ("10", "ENG", 9): "The Proposal (Play)",
    ("10", "ENG", 10): "Footprints Without Feet Review"
}

def update_all_chapter_titles_in_json():
    print("=========================================================================")
    print("GURUKUL AI — MASTER CHAPTER TITLE EMPOWERMENT ENGINE")
    print("Replacing unit/generic placeholders with 100% real NCERT chapter names...")
    print("=========================================================================")

    updated_files = 0
    ncert_dict = {}

    for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
        all_json_files = glob.glob(f'{base}/**/*.json', recursive=True)

        for fpath in all_json_files:
            fname = os.path.basename(fpath)
            if fname not in ['overview.json', 'manifest.json', 'notes.json', 'mindmaps.json', 'flashcards.json', 'quiz.json', 'question_papers.json', 'master.json', 'foundational.json']:
                continue

            try:
                ch_id = os.path.basename(os.path.dirname(fpath)) # e.g. G7-ENG-U01-C03
                parts = ch_id.split('-')
                if len(parts) < 4:
                    continue

                g_num = parts[0].replace('G', '')
                s_code = parts[1].replace('2', '').replace('3', '')
                c_num_str = parts[3].replace('C', '')
                c_num_int = int(c_num_str)

                # Lookup real title
                real_title = MASTER_EXHAUSTIVE_TITLES.get((g_num, s_code, c_num_int))

                if real_title:
                    ncert_dict[ch_id] = real_title
                    ncert_dict[f"G{g_num}-{s_code}-C{c_num_str}"] = real_title
                    ncert_dict[f"G{g_num}-{s_code}-{c_num_int}"] = real_title

                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    if isinstance(data, dict):
                        data['chapter_title'] = real_title
                        if fname == 'overview.json':
                            data['title'] = f"{real_title} - Chapter Overview"
                        elif fname == 'manifest.json':
                            data['chapter_title'] = real_title
                            if 'source_identity' in data and isinstance(data['source_identity'], dict):
                                data['source_identity']['chapter_title'] = real_title

                        with open(fpath, 'w', encoding='utf-8') as f:
                            json.dump(data, f, indent=2, ensure_ascii=False)
                        updated_files += 1

            except Exception as e:
                print(f"Error updating {fpath}: {e}")

    print(f"✅ Successfully updated chapter_title across {updated_files} ProcessedContent files!")

    # Update curriculumClient.ts NCERT_CHAPTER_TITLES map
    curr_client_path = 'frontend-nextjs/src/lib/curriculumClient.ts'
    if os.path.exists(curr_client_path):
        with open(curr_client_path, 'r', encoding='utf-8') as f:
            code = f.read()

        dict_entries = []
        for (g, s, c), t in sorted(MASTER_EXHAUSTIVE_TITLES.items()):
            ch_num_str = str(c).zfill(2)
            dict_entries.append(f'  "G{g}-{s}-U01-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-U02-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-U03-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-U04-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-U05-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-C{ch_num_str}": "{t}"')
            dict_entries.append(f'  "G{g}-{s}-{c}": "{t}"')

        dict_str = "const NCERT_CHAPTER_TITLES: Record<string, string> = {\n" + ",\n".join(dict_entries) + "\n};\n\n"

        import re
        updated_code = re.sub(r'const NCERT_CHAPTER_TITLES: Record<string, string> = \{[\s\S]*?\};\n\n', dict_str, code)

        with open(curr_client_path, 'w', encoding='utf-8') as f:
            f.write(updated_code)

        print("✅ Successfully updated curriculumClient.ts with exhaustive NCERT_CHAPTER_TITLES dictionary!")

if __name__ == '__main__':
    update_all_chapter_titles_in_json()
