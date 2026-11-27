# 📋 UNRESOLVED ISSUES & SOURCE PACKAGE BACKLOG

1. **Class 10 Video Backlog**:
   - **Status**: Declared unavailable in `Contents/README_ANDROID_INTEGRATION.md` and `Contents/media_integration/class10_video_generation_backlog.json`.
   - **Handling**: The UI cleanly hides the video player component for Class 10 chapters without fabricating URLs or showing broken player containers.

2. **Unresolved Media References**:
   - **Status**: Handled via `VideoOverrideManager.kt` and `GurukulContentLoader.getAssetImagePath`.
   - **Handling**: All 380 diagram PNG files are mapped to `gurukul_contents/assets/`.
