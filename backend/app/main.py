"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.routes import router
from app.core.config import settings
from app.core.logging import configure_logging

configure_logging(settings.log_level)
log = logging.getLogger("gridlock.api")

app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description=(
        "AI-Powered Parking Intelligence — illegal-parking hotspots (Getis-Ord Gi*), "
        "congestion impact (PCII), LightGBM forecasting, enforcement prioritization (EPS), "
        "and what-if enforcement simulation. See /docs."
    ),
    contact={"name": "Gridlock", "url": "https://github.com/Manshu555/gridlock-round2"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    log.info(
        "request",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/", tags=["meta"])
def root() -> dict:
    return {
        "name": settings.app_name,
        "version": __version__,
        "docs": "/docs",
        "endpoints": [
            "/health", "/hotspots", "/hotspots/{h3_id}", "/priority-zones",
            "/forecast", "/simulation", "/analytics",
        ],
    }


app.include_router(router)
