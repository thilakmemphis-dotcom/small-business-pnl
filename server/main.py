"""
Ledger Book API - FastAPI backend.
Run: uvicorn server.main:app --reload
Production: uvicorn server.main:app --host 0.0.0.0 --port 3001
"""
import os
from pathlib import Path

# Load .env from project root
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import FileResponse, JSONResponse

from server.db import init_db
from server.auth import router as auth_router
from server.ledger import router as ledger_router

app = FastAPI(
    title="Ledger P&L API",
    version="1.0.0",
    description="API for kirana shop ledger and P&L tracking.",
    docs_url=None,  # We serve Swagger at /api-docs explicitly (below) so it works with SPA catch-all
    redoc_url=None,
)

# CORS - frontend origin must be in allowed list
def _norm_url(s):
    if not s or not isinstance(s, str):
        return None
    u = s.strip().rstrip("/")
    return u if u.startswith("http") else None

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
for key in ("APP_URL", "VITE_API_URL", "CORS_ORIGIN"):
    val = _norm_url(os.getenv(key))
    if val and val not in origins:
        origins.append(val)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ledger_router)


# Explicit Swagger UI routes (must be before catch-all so they match first)
@app.get("/api-docs", include_in_schema=False)
@app.get("/api-docs/", include_in_schema=False)
def swagger_ui():
    return get_swagger_ui_html(openapi_url="/openapi.json", title="Ledger P&L API")


@app.on_event("startup")
def startup():
    init_db()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return { error } for compatibility with frontend."""
    msg = exc.errors()[0].get("msg", "Validation error") if exc.errors() else "Validation error"
    return JSONResponse(status_code=400, content={"error": msg})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Convert HTTPException and others to { error }."""
    from fastapi import HTTPException as FastAPIHTTPException

    if isinstance(exc, FastAPIHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": (exc.detail if isinstance(exc.detail, str) else str(exc.detail))},
        )
    return JSONResponse(status_code=500, content={"error": str(exc)})


# Static files and SPA fallback (production)
_dist = Path(__file__).resolve().parent.parent / "dist"
if _dist.exists():

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API routes: return 404 (fallback if routers miss)
        if full_path.startswith("api/") or full_path.startswith("api-docs"):
            return JSONResponse(status_code=404, content={"error": "Not found"})
        file_path = _dist / full_path
        if file_path.is_file() and str(file_path.resolve()).startswith(str(_dist.resolve())):
            return FileResponse(file_path)
        return FileResponse(_dist / "index.html")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "3001"))
    print(f"Ledger API: http://localhost:{port}")
    print(f"Swagger docs: http://localhost:{port}/api-docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
