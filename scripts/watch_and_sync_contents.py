"""
GURUKUL AI — Automated Content File-Watcher & Synchronizer
Monitors the Contents/ directory for any source file changes or updates (.json, .csv, .mp4),
automatically executes the content merger/mapping scripts, and syncs updated JSON payloads
to frontend-nextjs/public/ProcessedContent/ without affecting existing data.
"""

import os
import sys
import time
import shutil
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WATCH_DIR = "Contents"
BACKEND_PROCESSED_DIR = "backend/ProcessedContent"
FRONTEND_PUBLIC_DIR = "frontend-nextjs/public/ProcessedContent"

class ContentChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self.last_sync = 0
        self.cooldown_seconds = 2 # Prevent rapid multi-triggering

    def on_modified(self, event):
        self.handle_event(event)

    def on_created(self, event):
        self.handle_event(event)

    def handle_event(self, event):
        if event.is_directory:
            return

        ext = os.path.splitext(event.src_path)[1].lower()
        if ext not in ['.json', '.csv', '.mp4']:
            return

        now = time.time()
        if now - self.last_sync < self.cooldown_seconds:
            return
        self.last_sync = now

        print(f"\n⚡ [Auto-Sync] Detected change in: {event.src_path}")
        self.run_sync_pipeline()

    def run_sync_pipeline(self):
        try:
            print("⚙️ [Auto-Sync] Step 1: Merging NotebookLM links...")
            subprocess.run([sys.executable, "scripts/merge_notebook_links.py"], check=False)

            print("⚙️ [Auto-Sync] Step 2: Mapping direct MP4 video paths...")
            subprocess.run([sys.executable, "scripts/map_direct_mp4_videos.py"], check=False)

            print("⚙️ [Auto-Sync] Step 3: Syncing to public/ProcessedContent...")
            if os.path.exists(BACKEND_PROCESSED_DIR):
                shutil.copytree(BACKEND_PROCESSED_DIR, FRONTEND_PUBLIC_DIR, dirs_exist_ok=True)
                print("✅ [Auto-Sync] Successfully updated frontend static assets!")

        except Exception as e:
            print(f"❌ [Auto-Sync Error] {e}")

def run_one_shot_sync():
    print("🚀 [Gurukul Content Sync] Executing one-shot content synchronization...")
    handler = ContentChangeHandler()
    handler.run_sync_pipeline()

def start_watching():
    print(f"👀 [Gurukul Content Watcher] Monitoring '{WATCH_DIR}' for file changes...")
    event_handler = ContentChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, path=WATCH_DIR, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n🛑 [Gurukul Content Watcher] Stopped monitoring.")
    observer.join()

if __name__ == '__main__':
    run_one_shot_sync()
