"""SQLAlchemy engine + session factory for Gridlock.

The engine is lazily initialised — the API continues to work without a
database (file-based DataStore fallback) when GRIDLOCK_DATABASE_URL is unset.
"""
from __future__ import annotations

import logging
from collections.abc import Generator
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

log = logging.getLogger("gridlock.db")


# ---------------------------------------------------------------------------
# ORM base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Lazy engine / session factory
# ---------------------------------------------------------------------------

_engine = None
_SessionLocal: Optional[sessionmaker] = None  # type: ignore[type-arg]


def get_engine():
    """Return (and lazily create) the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        # Import here to avoid circular imports at module load time
        from app.core.config import settings

        if not settings.database_url:
            raise RuntimeError(
                "GRIDLOCK_DATABASE_URL is not set. "
                "Add it to your .env file or Render environment variables."
            )

        _engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,  # handles dropped connections on Neon serverless
            pool_recycle=300,    # recycle connections every 5 min
            echo=False,
        )
        log.info("Database engine created.")
    return _engine


def get_session_factory() -> sessionmaker:  # type: ignore[type-arg]
    """Return (and lazily create) the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(),
            autocommit=False,
            autoflush=False,
        )
    return _SessionLocal


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db() -> Generator[Session, None, None]:
    """Yield a DB session per request; always closes on exit."""
    SessionLocal = get_session_factory()
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Utility: health-check ping
# ---------------------------------------------------------------------------

def db_ping() -> bool:
    """Return True if the database is reachable."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        log.warning("DB ping failed: %s", exc)
        return False
