import os
import shutil

PROCESSED_DIRS = [
    'backend/ProcessedContent',
    'frontend-nextjs/public/ProcessedContent'
]

def purge_all_processed_data():
    print("=========================================================================")
    print("GURUKUL AI — PRISTINE CLEANUP & PURGE ENGINE")
    print("Deleting all processed data folders (ZERO RE-INGESTION)...")
    print("=========================================================================")

    for pdir in PROCESSED_DIRS:
        if os.path.exists(pdir):
            shutil.rmtree(pdir)
            os.makedirs(pdir, exist_ok=True)
            # Create a clean .gitkeep file
            with open(os.path.join(pdir, '.gitkeep'), 'w') as f:
                f.write('')
            print(f"🧹 Completely purged and reset: {pdir}")

    print("\n=========================================================================")
    print("✅ PRISTINE CLEANUP COMPLETE — ALL PROCESSED DATA ERASED!")
    print("=========================================================================")

if __name__ == '__main__':
    purge_all_processed_data()
