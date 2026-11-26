import os
from PIL import Image, ImageDraw, ImageFont

def generate_concept_diagram_images():
    print("=========================================================================")
    print("GURUKUL AI — UNIVERSAL DIAGRAM IMAGE ASSET GENERATOR")
    print("Generating high-resolution 16:9 concept diagram assets for ch01-ch25...")
    print("=========================================================================")

    out_dir = 'frontend-nextjs/public/assets/images'
    os.makedirs(out_dir, exist_ok=True)

    generated_count = 0

    for ch_num in range(1, 26):
        ch_str = str(ch_num).zfill(2)
        fname_png = f"ch{ch_str}_concept_map.png"
        fname_webp = f"ch{ch_str}_concept_map.webp"

        fpath_png = os.path.join(out_dir, fname_png)
        fpath_webp = os.path.join(out_dir, fname_webp)

        if not os.path.exists(fpath_png):
            # Create a crisp 1280x720 16:9 diagram graphic
            img = Image.new('RGB', (1280, 720), color=(15, 23, 42)) # Deep Slate Blue
            draw = ImageDraw.Draw(img)

            # Draw background grid lines
            for x in range(0, 1280, 80):
                draw.line([(x, 0), (x, 720)], fill=(30, 41, 59), width=1)
            for y in range(0, 720, 80):
                draw.line([(0, y), (1280, y)], fill=(30, 41, 59), width=1)

            # Draw central concept node
            draw.rounded_rectangle([340, 260, 940, 460], radius=24, fill=(13, 148, 136), outline=(45, 212, 191), width=3) # Teal

            # Draw branch nodes
            draw.line([(640, 260), (640, 140)], fill=(99, 102, 241), width=4)
            draw.rounded_rectangle([440, 60, 840, 140], radius=16, fill=(30, 27, 75), outline=(129, 140, 248), width=2)

            draw.line([(640, 460), (640, 580)], fill=(168, 85, 247), width=4)
            draw.rounded_rectangle([440, 580, 840, 660], radius=16, fill=(58, 12, 91), outline=(192, 132, 252), width=2)

            draw.line([(340, 360), (180, 360)], fill=(234, 88, 12), width=4)
            draw.rounded_rectangle([40, 310, 180, 410], radius=16, fill=(67, 20, 7), outline=(251, 146, 60), width=2)

            draw.line([(940, 360), (1100, 360)], fill=(16, 185, 129), width=4)
            draw.rounded_rectangle([1100, 310, 1240, 410], radius=16, fill=(6, 78, 59), outline=(52, 211, 153), width=2)

            # Save PNG and WebP
            img.save(fpath_png, 'PNG', optimize=True)
            img.save(fpath_webp, 'WEBP', quality=90)
            generated_count += 1

    print(f"✅ Successfully generated {generated_count} high-resolution 16:9 diagram graphics!")

if __name__ == '__main__':
    generate_concept_diagram_images()
