import os
import shutil
import glob

def package_android_assets():
    print("=========================================================================")
    print("GURUKUL AI — PACKAGING ANDROID ASSET PIPELINE")
    print("Syncing Contents/ into android/app/src/main/assets/gurukul_contents/...")
    print("=========================================================================")

    src_contents = 'Contents'
    dst_assets = 'android/app/src/main/assets/gurukul_contents'

    os.makedirs(dst_assets, exist_ok=True)

    folders_to_copy = ['content', 'manifests', 'assets', 'media_integration', 'schemas']

    for folder in folders_to_copy:
        s = os.path.join(src_contents, folder)
        d = os.path.join(dst_assets, folder)

        if os.path.exists(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
            print(f"✅ Copied {s} -> {d}")

    print("\n=========================================================================")
    print("✅ ANDROID ASSET PACKAGING COMPLETE!")
    print("=========================================================================")

if __name__ == '__main__':
    package_android_assets()
