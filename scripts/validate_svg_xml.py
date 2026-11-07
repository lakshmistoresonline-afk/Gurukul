import os
import glob
import xml.etree.ElementTree as ET

illustrations_dir = r'D:\GURUKUL\frontend-nextjs\public\illustrations'
svg_files = glob.glob(os.path.join(illustrations_dir, '*.svg'))

print("=== PHASE 5: SVG XML FORENSIC VALIDATION ===")
for svg_path in svg_files:
    fname = os.path.basename(svg_path)
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        viewbox = root.get('viewBox')
        tag = root.tag
        print(f"✓ {fname}: Valid XML ({tag}) | viewBox='{viewbox}' | File Size: {os.path.getsize(svg_path)} bytes")
    except Exception as e:
        print(f"✗ {fname}: XML Parse Error - {e}")
