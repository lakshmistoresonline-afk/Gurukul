from typing import Dict, List, Optional

class SubjectRegistry:
    """
    SubjectRegistry strictly canonicalizes the subject itself.
    Book and part are separate identity dimensions and are not encoded here.
    """
    CANONICAL_MAPPING = {
        "english": "english",
        "hindi": "hindi",
        "maths": "mathematics",
        "math": "mathematics",
        "mathematics": "mathematics",
        "maths i": "mathematics",
        "mathsi": "mathematics",
        "maths ii": "mathematics",
        "mathsii": "mathematics",
        "science": "science",
        "evs": "science",
        "social": "social_science",
        "social science": "social_science",
        "social i": "social_science",
        "sociali": "social_science",
        "social ii": "social_science",
        "socialii": "social_science",
        "social iii": "social_science",
        "socialiii": "social_science",
        "sanskrit": "sanskrit"
    }

    @classmethod
    def resolve_canonical_subject(cls, raw_subject: str) -> str:
        key = raw_subject.strip().lower()
        return cls.CANONICAL_MAPPING.get(key, key)

    @classmethod
    def get_display_name(cls, canonical_id: str) -> str:
        display_map = {
            "english": "English",
            "hindi": "Hindi",
            "mathematics": "Mathematics",
            "science": "Science",
            "social_science": "Social Science",
            "sanskrit": "Sanskrit"
        }
        return display_map.get(canonical_id, canonical_id.capitalize())
