import os
import json
import sys
import asyncio
from fastapi import FastAPI, HTTPException, Header, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List, Set

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Automatic .env environment loader
for env_candidate in [os.path.join(os.path.dirname(backend_dir), ".env"), os.path.join(backend_dir, ".env")]:
    if os.path.exists(env_candidate):
        try:
            with open(env_candidate, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() not in os.environ:
                            os.environ[k.strip()] = v.strip().strip("'\"")
        except Exception:
            pass

try:
    from src.curriculum.api import chapters as curriculum_chapters
    from src.curriculum.api import tutor as tutor_api
    from src.curriculum.core.config import GurukulConfig
    from src.curriculum.security.websocket_security import SecureWebSocketManager
except (ImportError, ValueError):
    try:
        from curriculum.api import chapters as curriculum_chapters
        from curriculum.api import tutor as tutor_api
        from curriculum.core.config import GurukulConfig
        from curriculum.security.websocket_security import SecureWebSocketManager
    except (ImportError, ValueError):
        from .curriculum.api import chapters as curriculum_chapters
        from .curriculum.api import tutor as tutor_api
        from .curriculum.core.config import GurukulConfig
        from .curriculum.security.websocket_security import SecureWebSocketManager

app = FastAPI(
    title="GURUKUL-AI API",
    description="Bridge server serving NCERT curriculum datasets with secure authentication, authorization, and WebSocket sync.",
    version="4.0.0"
)

cors_env = os.getenv("CORS_ALLOWED_ORIGINS")
if cors_env:
    origins = [o.strip() for o in cors_env.split(",")]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://10.0.2.2:8080",
        "tauri://localhost",
        "http://tauri.localhost"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    expose_headers=["Content-Length"]
)

app.include_router(curriculum_chapters.router)
app.include_router(tutor_api.router)

CONTENT_ROOT = str(GurukulConfig.get_content_root())

secure_ws_mgr = SecureWebSocketManager()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
