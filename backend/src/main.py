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

def ensure_ollama_auto_started():
    import urllib.request
    import subprocess
    import time
    ollama_url = (os.getenv("OLLAMA_URL") or "http://127.0.0.1:11434").strip()
    ollama_model = (os.getenv("OLLAMA_MODEL") or "qwen3.5:2b-q4_K_M").strip()

    is_online = False
    try:
        req = urllib.request.Request(f"{ollama_url}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                is_online = True
    except Exception:
        is_online = False

    if not is_online:
        print(f"[OllamaAutoStart] Local Ollama offline on {ollama_url}. Auto-launching 'ollama serve' in background...")
        try:
            subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            print("[OllamaAutoStart] Auto-started background 'ollama serve' process successfully.")
        except Exception as err:
            print(f"[OllamaAutoStart] Failed to auto-launch ollama serve: {err}")

        # Poll up to 10 seconds for Ollama service readiness
        for _ in range(10):
            time.sleep(1)
            try:
                req = urllib.request.Request(f"{ollama_url}/api/tags")
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        print(f"[OllamaAutoStart] Ollama service confirmed online at {ollama_url}!")
                        is_online = True
                        break
            except Exception:
                pass

    # Pre-warm and lock model in memory
    try:
        warm_payload = json.dumps({
            "model": ollama_model,
            "prompt": "hello",
            "stream": False,
            "keep_alive": -1
        }).encode("utf-8")
        req_warm = urllib.request.Request(f"{ollama_url}/api/generate", data=warm_payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req_warm, timeout=30) as resp:
            if resp.status == 200:
                print(f"[OllamaAutoStart] Model '{ollama_model}' pre-warmed and locked in memory!")
    except Exception as e:
        print(f"[OllamaAutoStart] Model pre-warming notice: {e}")

@app.get("/api/v1/tutor/health")
def tutor_health_check():
    import urllib.request
    ollama_url = (os.getenv("OLLAMA_URL") or "http://127.0.0.1:11434").strip()
    ollama_model = (os.getenv("OLLAMA_MODEL") or "qwen3.5:2b-q4_K_M").strip()
    try:
        req = urllib.request.Request(f"{ollama_url}/api/tags")
        with urllib.request.urlopen(req, timeout=2) as resp:
            if resp.status == 200:
                return {
                    "status": "ONLINE",
                    "ollama_running": True,
                    "model": ollama_model,
                    "message": "Local Ollama AI engine is online and active."
                }
    except Exception:
        pass

    asyncio.create_task(asyncio.to_thread(ensure_ollama_auto_started))
    return {
        "status": "OFFLINE",
        "ollama_running": False,
        "model": ollama_model,
        "message": "Local Ollama AI background service is currently starting. AI Tutor will activate automatically once Ollama finishes initializing."
    }

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(asyncio.to_thread(ensure_ollama_auto_started))

CONTENT_ROOT = str(GurukulConfig.get_content_root())

secure_ws_mgr = SecureWebSocketManager()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
