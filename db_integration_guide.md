# Database Integration Guide — Gridlock

> Your backend is **Python + FastAPI** (not Node.js). The right stack is:
> **PostgreSQL + SQLAlchemy 2.0 + Alembic** (already partially in `requirements.txt`!)
> — **NOT Prisma** (that's JavaScript-only).

---

## What You Already Have ✅

Your `requirements.txt` already includes:
```
sqlalchemy>=2.0
geoalchemy2>=0.14   ← for storing H3/geospatial data
psycopg2-binary>=2.9 ← PostgreSQL driver
```

**You do NOT need to install anything new.** Just wire them up.

---

## Recommended Stack

```
Frontend (Vercel - Next.js)
        ↓
Backend API (Render - FastAPI)
        ↓
PostgreSQL (Neon free tier)
        ↓
SQLAlchemy 2.0 ORM  +  Alembic migrations
```

---

## Step 1 — Create a Neon Database (Free)

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Create a new project → you'll get a connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Copy it — you'll use it in `.env`

---

## Step 2 — Add `DATABASE_URL` to Config

### `backend/app/core/config.py`

```python
"""Backend settings (env-overridable via pydantic-settings)."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GRIDLOCK_", env_file=".env", extra="ignore")

    app_name: str = "Gridlock Parking Intelligence API"
    version: str = "0.1.0"
    outputs_dir: Path = REPO_ROOT / "outputs"
    cors_origins: str = "*"
    log_level: str = "INFO"

    # ── NEW ──
    database_url: Optional[str] = None  # Set via GRIDLOCK_DATABASE_URL env var

    @property
    def cors_list(self) -> list[str]:
        return ["*"] if self.cors_origins.strip() == "*" else [
            o.strip() for o in self.cors_origins.split(",") if o.strip()
        ]


settings = Settings()
```

### Create `backend/.env` (never commit this!)
```env
GRIDLOCK_DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## Step 3 — Create Database Session Manager

### Create `backend/app/core/database.py` (NEW FILE)

```python
"""SQLAlchemy async-ready session factory."""
from __future__ import annotations

import logging
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

log = logging.getLogger("gridlock.db")


class Base(DeclarativeBase):
    pass


def _get_engine():
    if not settings.database_url:
        raise RuntimeError("GRIDLOCK_DATABASE_URL is not set.")
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,   # handles dropped connections on Neon
        echo=False,
    )


# Lazy engine — only created when first used
_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = _get_engine()
    return _engine


def get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autocommit=False, autoflush=False)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a DB session per request."""
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Step 4 — Define Your Database Models

### Create `backend/app/models/db_models.py` (NEW FILE)

These match the data your pipeline already produces:

```python
"""SQLAlchemy ORM models for Gridlock."""
from __future__ import annotations

import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HotspotCell(Base):
    """One H3 hexagonal cell with computed scores."""
    __tablename__ = "hotspot_cells"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    h3: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    # Scores
    hotspot_score: Mapped[float | None] = mapped_column(Float)
    is_hotspot: Mapped[bool | None] = mapped_column(Boolean)
    violations: Mapped[int | None] = mapped_column(Integer)
    eps: Mapped[float | None] = mapped_column(Float)
    pcii: Mapped[float | None] = mapped_column(Float)
    priority_rank: Mapped[int | None] = mapped_column(Integer)

    # Metadata
    police_station: Mapped[str | None] = mapped_column(String(200))
    road_class: Mapped[str | None] = mapped_column(String(50))
    hotspot_category: Mapped[str | None] = mapped_column(String(50))

    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ForecastPoint(Base):
    """One forecast data point (h3 cell + date + prediction)."""
    __tablename__ = "forecast_points"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    h3: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    violations: Mapped[int | None] = mapped_column(Integer)
    prediction: Mapped[float | None] = mapped_column(Float)
```

---

## Step 5 — Create Tables (Alembic or Direct)

### Option A — Quick Direct Push (for development)

```python
# Run once: backend/scripts/init_db.py
from app.core.database import Base, get_engine
from app.models import db_models  # noqa: F401  — import models so Base sees them

if __name__ == "__main__":
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("Tables created!")
```

Run it:
```bash
cd backend
python -m scripts.init_db
```

### Option B — Alembic (Recommended for production)

```bash
pip install alembic
cd backend
alembic init alembic
```

In `alembic/env.py`, add:
```python
from app.core.database import Base
from app.models import db_models  # noqa: F401
target_metadata = Base.metadata
```

Then:
```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

## Step 6 — Create a DB-Backed Route (Example)

### Modify `backend/app/api/routes.py` to add a DB route

```python
from sqlalchemy.orm import Session
from fastapi import Depends
from app.core.database import get_db
from app.models.db_models import HotspotCell

@router.get("/db/hotspots", tags=["database"], summary="Hotspots from PostgreSQL")
def get_hotspots_from_db(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[dict]:
    cells = (
        db.query(HotspotCell)
        .filter(HotspotCell.is_hotspot == True)
        .order_by(HotspotCell.eps.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "h3": c.h3,
            "hotspot_score": c.hotspot_score,
            "eps": c.eps,
            "violations": c.violations,
            "priority_rank": c.priority_rank,
        }
        for c in cells
    ]
```

---

## Step 7 — Seed DB from Existing Pipeline Outputs (Bridge)

This lets you populate the DB from your existing parquet/GeoJSON files:

### Create `backend/scripts/seed_db.py` (NEW FILE)

```python
"""Seed the database from existing pipeline outputs."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import Base, get_engine, get_session_factory
from app.models import db_models  # noqa: F401
from app.services.data_store import DataStore

engine = get_engine()
Base.metadata.create_all(engine)  # create tables if not exists

store = DataStore()
df = store.cells()

SessionLocal = get_session_factory()
with SessionLocal() as db:
    # Upsert-style: delete + re-insert
    db.query(db_models.HotspotCell).delete()

    for _, row in df.iterrows():
        cell = db_models.HotspotCell(
            h3=row.get("h3"),
            hotspot_score=row.get("hotspot_score"),
            is_hotspot=bool(row.get("is_hotspot", False)),
            violations=row.get("violations"),
            eps=row.get("eps"),
            pcii=row.get("pcii"),
            priority_rank=row.get("priority_rank"),
            police_station=row.get("police_station"),
            road_class=row.get("road_class"),
            hotspot_category=row.get("hotspot_category"),
        )
        db.add(cell)

    db.commit()
    print(f"Seeded {len(df)} cells into hotspot_cells table.")
```

Run it:
```bash
cd backend
python -m scripts.seed_db
```

---

## Step 8 — Add to `main.py` (Create Tables on Startup)

```python
# In backend/app/main.py — add this after imports:
from app.core.config import settings

@app.on_event("startup")
async def on_startup():
    if settings.database_url:
        from app.core.database import Base, get_engine
        from app.models import db_models  # noqa: F401
        Base.metadata.create_all(get_engine())
        log.info("Database tables ensured.")
```

---

## Step 9 — Set Env Vars on Render

In your **Render service dashboard**:

| Key | Value |
|-----|-------|
| `GRIDLOCK_DATABASE_URL` | `postgresql://...neon.tech/...?sslmode=require` |

> [!IMPORTANT]
> Use the **pooled connection string** from Neon for production (it handles serverless cold starts better).

---

## Step 10 — Update `.gitignore`

```gitignore
# Already should be there, but double-check:
.env
backend/.env
```

---

## File Change Summary

| File | Action |
|------|--------|
| [config.py](file:///E:/flipkart%20round%202/backend/app/core/config.py) | Add `database_url` field |
| `backend/app/core/database.py` | **NEW** — engine + session factory + `get_db()` dependency |
| `backend/app/models/db_models.py` | **NEW** — ORM models (`HotspotCell`, `ForecastPoint`) |
| `backend/scripts/init_db.py` | **NEW** — create tables script |
| `backend/scripts/seed_db.py` | **NEW** — seed from pipeline outputs |
| [routes.py](file:///E:/flipkart%20round%202/backend/app/api/routes.py) | Add `/db/hotspots` example route |
| [main.py](file:///E:/flipkart%20round%202/backend/app/main.py) | Add startup event to create tables |

---

## Quick Checklist

- [ ] Create Neon project → copy `DATABASE_URL`
- [ ] Add `GRIDLOCK_DATABASE_URL=...` to `backend/.env`
- [ ] Create `database.py` and `db_models.py`
- [ ] Run `python -m scripts.init_db` to create tables
- [ ] Run `python -m scripts.seed_db` to populate from pipeline outputs
- [ ] Test `/db/hotspots` endpoint locally
- [ ] Add `GRIDLOCK_DATABASE_URL` to Render env vars
- [ ] Deploy to Render
