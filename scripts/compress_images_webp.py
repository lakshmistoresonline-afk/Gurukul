import glob
import os
from PIL import Image

def compress_images_webp():
    print("=========================================================================")
    print("GURUKUL AI — WEBP NEXT-GEN IMAGE COMPRESSION PIPELINE")
    print("Compressing diagram PNG images to WebP format...")
    print("=========================================================================")

    img_dir = 'frontend-nextjs/public/assets/images'
    png_files = glob.glob(f'{img_dir}/*.png') + glob.glob(f'{img_dir}/*.jpg')

    converted_count = 0
    saved_bytes = 0

    for pf in png_files:
        try:
            orig_size = os.path.getsize(pf)
            base_name = os.path.splitext(pf)[0]
            webp_path = f"{base_name}.webp"

            if not os.path.exists(webp_path):
                with Image.open(pf) as img:
                    img.save(webp_path, 'WEBP', quality=85, optimize=True)

                new_size = os.path.getsize(webp_path)
                saved_bytes += (orig_size - new_size)
                converted_count += 1

        except Exception as e:
            pass

    print(f"✅ Successfully converted {converted_count} diagram images to WebP!")
    print(f"✅ Saved total bandwidth: {saved_bytes / (1024 * 1024):.2f} MB!")

if __name__ == '__main__':
    compress_images_webp()
