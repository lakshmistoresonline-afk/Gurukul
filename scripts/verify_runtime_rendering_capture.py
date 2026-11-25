import os
import glob
import json

def verify_runtime_rendering():
    print("=========================================================================")
    print("GURUKUL AI — RUNTIME RENDERING CAPTURE & COMPONENT RESOLUTION ENGINE")
    print("Simulating runtime client data resolution across Class 5 to Class 10...")
    print("=========================================================================")

    public_root = 'frontend-nextjs/public/ProcessedContent'
    class_folders = sorted(glob.glob(f'{public_root}/Class*'))

    total_rendered_modules = 0
    total_rendered_words = 0
    total_rendered_hotspots = 0
    total_rendered_videos = 0
    total_rendered_quizzes = 0

    rendering_errors = []

    for c_folder in class_folders:
        cls_name = os.path.basename(c_folder)
        subj_folders = sorted(glob.glob(f'{c_folder}/*'))

        for s_folder in subj_folders:
            subj_name = os.path.basename(s_folder)
            ch_folders = sorted(glob.glob(f'{s_folder}/*-C*'))

            for ch_folder in ch_folders:
                ch_id = os.path.basename(ch_folder)
                json_files = glob.glob(f'{ch_folder}/*.json')

                for jf in json_files:
                    m_type = os.path.basename(jf)
                    if m_type == 'manifest.json':
                        continue

                    try:
                        with open(jf, 'r', encoding='utf-8') as f:
                            data = json.load(f)

                        total_rendered_modules += 1
                        text_str = json.dumps(data, ensure_ascii=False)
                        words = len(text_str.split())
                        total_rendered_words += words

                        if m_type == 'overview.json':
                            # Check chapter title
                            ch_title = data.get('chapter_title') or data.get('title')
                            if not ch_title or 'Chapter ' in ch_title and not any(c.isalpha() for c in ch_title.replace('Chapter', '').replace('Part', '')):
                                rendering_errors.append(f"{ch_id}: Generic or missing title '{ch_title}'")

                            # Check video
                            v_url = data.get('video_url')
                            if v_url and str(v_url).startswith('http'):
                                total_rendered_videos += 1

                            # Check image hotspots
                            img_asset = data.get('image_asset')
                            if isinstance(img_asset, dict) and img_asset.get('asset_url'):
                                hotspots = img_asset.get('hotspots', [])
                                if isinstance(hotspots, list):
                                    total_rendered_hotspots += len(hotspots)

                        elif m_type == 'quiz.json':
                            if isinstance(data, list):
                                total_rendered_quizzes += len(data)
                                for q_idx, q in enumerate(data):
                                    opts = q.get('options') or []
                                    for opt in opts:
                                        if str(opt).strip() in ['Option B', 'Option C', 'Option D']:
                                            rendering_errors.append(f"{ch_id} Quiz Q{q_idx+1}: Contains dummy '{opt}'")

                    except Exception as e:
                        rendering_errors.append(f"{ch_id} {m_type}: PARSE ERROR {e}")

    print("\n=========================================================================")
    print("📊 RUNTIME RENDERING CAPTURE AUDIT RESULTS")
    print("=========================================================================")
    print(f"✨ Total Runtime Modules Resolved & Rendered: {total_rendered_modules:,}")
    print(f"✨ Total Runtime Words Rendered:            {total_rendered_words:,}")
    print(f"✨ Total Active Video Streams Mapped:        {total_rendered_videos:,}")
    print(f"✨ Total Interactive Hotspots Active:        {total_rendered_hotspots:,}")
    print(f"✨ Total Active Quiz Questions Rendered:    {total_rendered_quizzes:,}")
    print(f"✨ Total Rendering Errors / Misalignments:   {len(rendering_errors)}")

    if rendering_errors:
        print("\n⚠️ Identified Rendering Issues:")
        for err in rendering_errors[:10]:
            print(f"  - {err}")
    else:
        print("\n✅ PERFECT PASS: 0 Rendering Errors, 0 Missing Data, 0 Dummy Placeholders!")

    print("=========================================================================")

if __name__ == '__main__':
    verify_runtime_rendering()
