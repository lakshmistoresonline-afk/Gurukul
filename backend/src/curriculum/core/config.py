import os
from pathlib import Path

class GurukulConfig:
    """
    Centralized configuration for Gurukul AI paths.
    Consumes environment variables GURUKUL_CONTENT_ROOT, GURUKUL_PROCESSED_ROOT, GURUKUL_REPORTS_ROOT,
    with safe repository-relative defaults using pathlib.Path throughout.
    Works seamlessly on Windows and Linux.
    """
    REPO_ROOT = Path(__file__).resolve().parents[4]

    @classmethod
    def get_content_root(cls) -> Path:
        env_val = os.getenv("GURUKUL_CONTENT_ROOT")
        if env_val:
            return Path(env_val).resolve()
        return (cls.REPO_ROOT / "Contents").resolve()

    @classmethod
    def get_processed_root(cls) -> Path:
        env_val = os.getenv("GURUKUL_PROCESSED_ROOT")
        if env_val:
            return Path(env_val).resolve()

        backend_processed = (Path(__file__).resolve().parents[3] / "ProcessedContent").resolve()
        if backend_processed.exists():
            return backend_processed

        return (cls.REPO_ROOT / "ProcessedContent").resolve()

    @classmethod
    def get_reports_root(cls) -> Path:
        env_val = os.getenv("GURUKUL_REPORTS_ROOT")
        if env_val:
            return Path(env_val).resolve()
        return (cls.REPO_ROOT / "reports").resolve()
