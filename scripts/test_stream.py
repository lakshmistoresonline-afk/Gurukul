import sys
import asyncio
sys.path.insert(0, 'D:/GURUKUL/backend')

from src.curriculum.api.chapters import stream_local_media
from src.curriculum.security.auth_service import AuthenticatedUser

user = AuthenticatedUser(uid="user-c-uid", email="userc@gurukul.ai", role="student", class_id="6")

async def main():
    try:
        res = await stream_local_media(subject="social_science", filename="14-ch1_earth_coordinate_grid.png", grade="6", user=user)
        print("STREAM_RESULT_PATH:", res.path)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
