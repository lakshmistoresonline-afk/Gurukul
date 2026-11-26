import os
import glob
import shutil

KEEP_SCRIPTS = {
    'build_master_title_map_all_classes.py',
    'copy_and_map_all_chapter_images.py',
    'compress_images_webp.py',
    'merge_all_classes_notebook_links.py',
    'process_class8_class9_video_links.py',
    'only_cleanup_purge.py',
    'generate_universal_diagram_assets.py',
    'secret_scanner.py',
    'clean_production_build.ps1',
    'watch_and_sync_contents.py',
    'validate_svg_xml.py',
    'setup_test_users.py',
    'test_user_auth.py',
    'delete_unwanted_scripts_and_reports.py'
}

def purge_unwanted_scripts_and_reports():
    print("=========================================================================")
    print("GURUKUL AI — UNWANTED SCRIPTS & REPORTS PURGE ENGINE")
    print("Deleting temporary scratch scripts and outdated report files...")
    print("=========================================================================")

    deleted_scripts = 0
    deleted_reports = 0

    # 1. Clean scripts directory
    script_files = glob.glob('scripts/*')
    for sf in script_files:
        fname = os.path.basename(sf)
        if os.path.isfile(sf) and fname not in KEEP_SCRIPTS:
            try:
                os.remove(sf)
                deleted_scripts += 1
            except Exception as e:
                print(f"Error deleting script {sf}: {e}")

    # 2. Clean reports directory
    if os.path.exists('reports'):
        report_entries = glob.glob('reports/*')
        for re in report_entries:
            try:
                if os.path.isdir(re):
                    shutil.rmtree(re)
                    deleted_reports += 1
                elif os.path.isfile(re):
                    os.remove(re)
                    deleted_reports += 1
            except Exception as e:
                print(f"Error deleting report entry {re}: {e}")

        # Keep a clean empty reports directory with .gitkeep
        os.makedirs('reports', exist_ok=True)
        with open('reports/.gitkeep', 'w') as f:
            f.write('')

    print(f"\n=========================================================================")
    print(f"✅ SUCCESSFULLY DELETED {deleted_scripts} UNWANTED SCRIPTS!")
    print(f"✅ SUCCESSFULLY DELETED {deleted_reports} OUTDATED REPORT FILES/FOLDERS!")
    print("=========================================================================")

if __name__ == '__main__':
    purge_unwanted_scripts_and_reports()
