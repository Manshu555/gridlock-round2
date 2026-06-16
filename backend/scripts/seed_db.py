"""Seed PostgreSQL from existing pipeline output files (parquet / GeoJSON).

Run from the backend/ directory:
    python -m scripts.seed_db

This reads whatever files the ML pipeline produced in outputs/ and upserts
them into PostgreSQL. Safe to re-run — clears existing rows before re-inserting.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend/ is on the path when run directly
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import Base, get_engine, get_session_factory
from app.models import db_models  # noqa: F401 — registers all ORM models with Base
from app.models.db_models import ForecastRecord, HotspotCell
from app.services.data_store import DataStore


def _safe_float(val) -> float | None:
    """Return float or None, swallowing NaN / inf."""
    try:
        import math
        f = float(val)
        return None if (math.isnan(f) or math.isinf(f)) else f
    except (TypeError, ValueError):
        return None


def _safe_int(val) -> int | None:
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def _safe_str(val, maxlen: int = 200) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s[:maxlen] if s else None


def seed_hotspot_cells(db, store: DataStore) -> int:
    print("Loading pipeline cells...")
    df = store.cells()
    print(f"  Found {len(df)} rows.")

    print("  Clearing existing hotspot_cells...")
    db.query(HotspotCell).delete()
    db.flush()

    count = 0
    for _, row in df.iterrows():
        cell = HotspotCell(
            h3=str(row["h3"]),
            # Gi* scores
            gi_z=_safe_float(row.get("gi_z")),
            gi_p=_safe_float(row.get("gi_p")),
            is_hotspot=bool(row.get("is_hotspot")) if row.get("is_hotspot") is not None else None,
            hotspot_score=_safe_float(row.get("hotspot_score")),
            hotspot_category=_safe_str(row.get("hotspot_category")),
            # Violation counts
            violations=_safe_int(row.get("violations")),
            top_violation=_safe_str(row.get("top_violation")),
            # PCII
            pcii=_safe_float(row.get("pcii")),
            pcii_density=_safe_float(row.get("pcii_density")),
            pcii_capacity=_safe_float(row.get("pcii_capacity")),
            pcii_junction=_safe_float(row.get("pcii_junction")),
            pcii_footprint=_safe_float(row.get("pcii_footprint")),
            pcii_persistence=_safe_float(row.get("pcii_persistence")),
            # EPS
            eps=_safe_float(row.get("eps")),
            eps_pcii_component=_safe_float(row.get("eps_pcii_component")),
            eps_freq_component=_safe_float(row.get("eps_freq_component")),
            eps_crit_component=_safe_float(row.get("eps_crit_component")),
            priority_rank=_safe_int(row.get("priority_rank")),
            # Location metadata
            police_station=_safe_str(row.get("police_station")),
            road_class=_safe_str(row.get("road_class"), maxlen=50),
            road_criticality=_safe_float(row.get("road_criticality")),
        )
        db.add(cell)
        count += 1

    db.commit()
    print(f"  Seeded {count} cells into hotspot_cells.")
    return count


def seed_forecast_records(db, store: DataStore) -> int:
    print("Loading forecast records...")
    df = store.forecast()
    if df.empty:
        print("  No forecast data found (outputs/forecast_results.parquet missing). Skipping.")
        return 0

    print(f"  Found {len(df)} rows.")
    print("  Clearing existing forecast_records...")
    db.query(ForecastRecord).delete()
    db.flush()

    count = 0
    for _, row in df.iterrows():
        rec = ForecastRecord(
            h3=str(row["h3"]),
            date=str(row["date"]) if "date" in row else "",
            violations=_safe_float(row.get("violations")),
            prediction=_safe_float(row.get("prediction")),
        )
        db.add(rec)
        count += 1

    db.commit()
    print(f"  Seeded {count} forecast records into forecast_records.")
    return count


def main() -> None:
    if not settings.database_url:
        print(
            "ERROR: GRIDLOCK_DATABASE_URL is not set.\n"
            "Add it to backend/.env:\n"
            "  GRIDLOCK_DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require"
        )
        sys.exit(1)

    print(f"Database: {settings.database_url[:50]}...")
    engine = get_engine()
    Base.metadata.create_all(engine)  # ensure tables exist
    print("Tables ensured.\n")

    store = DataStore()
    if not store.available:
        print(
            "ERROR: No pipeline outputs found.\n"
            f"Expected files in: {store.dir}\n"
            "Run the ML pipeline first: python -m parking_intel.pipeline"
        )
        sys.exit(1)

    SessionLocal = get_session_factory()
    with SessionLocal() as db:
        n_cells = seed_hotspot_cells(db, store)
        n_forecast = seed_forecast_records(db, store)

    print(f"\nSeeding complete: {n_cells} cells + {n_forecast} forecast records.")
    print("You can now query /db/hotspots, /db/priority-zones, /db/forecast etc.")


if __name__ == "__main__":
    main()
