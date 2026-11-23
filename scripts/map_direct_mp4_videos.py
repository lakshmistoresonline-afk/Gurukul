import json
import glob
import os

def map_mp4_videos():
    print("Mapping direct MP4 video files into ProcessedContent overview/manifest JSONs...")

    mp4_files = glob.glob('Contents/**/*.mp4', recursive=True)
    print(f"Found {len(mp4_files)} total MP4 video files in Contents/")

    updated_count = 0

    for base in ['backend/ProcessedContent', 'frontend-nextjs/public/ProcessedContent']:
        ov_files = glob.glob(f'{base}/**/overview.json', recursive=True)
        for ov_path in ov_files:
            try:
                ch_id = os.path.basename(os.path.dirname(ov_path)) # e.g. G5-ENG-U01-C01
                if '-C' not in ch_id:
                    continue

                ch_num_str = ch_id.split('-C')[-1] # e.g. "01"
                try:
                    ch_num_int = int(ch_num_str)
                except ValueError:
                    continue

                with open(ov_path, 'r', encoding='utf-8') as f:
                    ov_data = json.load(f)

                # Get grade and subject from path
                # Example ov_path: backend/ProcessedContent/Class5/English/G5-ENG-U01-C01/overview.json
                parts = ov_path.replace('\\', '/').split('/')
                cls_folder = parts[parts.index('ProcessedContent') + 1] # e.g. Class5
                subj_folder = parts[parts.index('ProcessedContent') + 2] # e.g. English

                matched_video = None
                for mp4 in mp4_files:
                    norm_mp4 = mp4.replace('\\', '/')
                    filename = os.path.basename(norm_mp4)

                    norm_mp4_lower = norm_mp4.lower()
                    cls_match = cls_folder.lower().replace('class', 'class ') in norm_mp4_lower or cls_folder.lower() in norm_mp4_lower
                    subj_match = subj_folder.lower() in norm_mp4_lower or ('math' in subj_folder.lower() and 'math' in norm_mp4_lower) or ('soc' in subj_folder.lower() and 'social' in norm_mp4_lower)

                    if cls_match and subj_match:
                        prefix = f"{ch_num_int:02d}-"
                        prefix_alt = f"{ch_num_int}-"
                        if filename.startswith(prefix) or filename.startswith(prefix_alt) or f"-C{ch_num_str}" in filename:
                            matched_video = f"/videos/{cls_folder}/{subj_folder}/{filename}"
                            break

                if matched_video:
                    # Store local_video_path for local dev, but do NOT overwrite live NotebookLM video_url if present!
                    if not ov_data.get('video_url') or not str(ov_data.get('video_url')).startswith('http'):
                        ov_data['video_url'] = matched_video
                    ov_data['local_video_path'] = matched_video
                    ov_data['video_type'] = 'mp4'
                    with open(ov_path, 'w', encoding='utf-8') as f:
                        json.dump(ov_data, f, indent=2, ensure_ascii=False)

                    mf_path = os.path.join(os.path.dirname(ov_path), 'manifest.json')
                    if os.path.exists(mf_path):
                        with open(mf_path, 'r', encoding='utf-8') as mf_f:
                            mf_data = json.load(mf_f)
                        if not mf_data.get('video_url') or not str(mf_data.get('video_url')).startswith('http'):
                            mf_data['video_url'] = matched_video
                        mf_data['local_video_path'] = matched_video
                        with open(mf_path, 'w', encoding='utf-8') as mf_f:
                            json.dump(mf_data, mf_f, indent=2, ensure_ascii=False)

                    updated_count += 1

            except Exception as e:
                print(f"Error mapping {ov_path}: {e}")

    print(f"Successfully updated {updated_count} overview/manifest files with direct MP4 video paths!")

if __name__ == '__main__':
    map_mp4_videos()
