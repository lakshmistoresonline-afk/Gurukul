import sys
from pathlib import Path

sys.path.insert(0, str(Path("D:/GURUKUL/backend")))

from src.curriculum.security.auth_service import get_current_user, HTTPAuthorizationCredentials

accounts = [
    ("student5@test.com", "mock-token-student5", "5"),
    ("student6@test.com", "mock-token-student6", "6"),
    ("student7@test.com", "mock-token-student7", "7"),
    ("student8@test.com", "mock-token-student8", "8"),
    ("student9@test.com", "mock-token-student9", "9"),
    ("admin@gurukul.com", "mock-token-admin", "admin"),
]

for email, tok, expected in accounts:
    cred = HTTPAuthorizationCredentials(scheme="Bearer", credentials=tok)
    user = get_current_user(cred)
    print(f"AUTHENTICATED: Email={user.email}, UID={user.uid}, ClassId={user.class_id}, Role={user.role}")
