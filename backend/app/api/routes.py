"""REST API routes."""
from __future__ import annotations

import math

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import __version__
from app.core.config import settings
from app.models.schemas import (
    ForecastPoint,
    HealthResponse,
    PriorityZone,
    SimulationResponse,
)
from app.services.data_store import get_store
from app.services.simulation import simulate_top_k

router = APIRouter()


def _clean_records(df: pd.DataFrame) -> list[dict]:
    """NaN/inf -> None so the response is valid JSON."""
    return df.replace([float("inf"), float("-inf")], pd.NA).where(pd.notna(df), None).to_dict(
        orient="records"
    )


@router.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    store = get_store()
    n = None
    try:
        n = int(len(store.cells())) if store.available else None
    except Exception:
        n = None

    # Check DB connectivity (only when configured)
    db_status: str | None = None
    if settings.db_enabled:
        try:
            from app.core.database import db_ping
            db_status = "connected" if db_ping() else "unreachable"
        except Exception:
            db_status = "error"

    response = HealthResponse(
        status="ok", version=__version__, data_available=store.available, n_cells=n
    )
    # Attach db_status as extra field via model_extra (Pydantic v2 allows this)
    return JSONResponse(content={
        **response.model_dump(),
        "db_status": db_status,
        "db_enabled": settings.db_enabled,
    })


@router.get("/hotspots", tags=["hotspots"], summary="GeoJSON of all hotspot cells")
def get_hotspots(
    min_score: float = Query(0.0, ge=0, le=100, description="Min hotspot_score filter"),
    significant_only: bool = Query(False, description="Only Gi* significant (95%) cells"),
) -> dict:
    store = get_store()
    fc = store.hotspots_geojson()
    feats = fc.get("features", [])
    if significant_only:
        feats = [f for f in feats if f["properties"].get("is_hotspot") == 1]
    if min_score > 0:
        feats = [f for f in feats if (f["properties"].get("hotspot_score") or 0) >= min_score]
    return {"type": "FeatureCollection", "features": feats}


@router.get("/hotspots/{h3_id}", tags=["hotspots"], summary="Detail for one H3 cell")
def get_hotspot(h3_id: str) -> dict:
    store = get_store()
    df = store.cells()
    row = df[df["h3"] == h3_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Hotspot {h3_id} not found")
    rec = _clean_records(row)[0]
    # attach PCII factor breakdown if components present
    breakdown = {}
    weights = {"violation_density": 0.35, "road_capacity_reduction": 0.25,
               "junction_importance": 0.20, "vehicle_footprint": 0.10,
               "temporal_persistence": 0.10}
    comp_map = {"violation_density": "pcii_density", "road_capacity_reduction": "pcii_capacity",
                "junction_importance": "pcii_junction", "vehicle_footprint": "pcii_footprint",
                "temporal_persistence": "pcii_persistence"}
    for k, col in comp_map.items():
        if col in rec and rec[col] is not None and not (isinstance(rec[col], float) and math.isnan(rec[col])):
            breakdown[k] = round(100 * weights[k] * float(rec[col]), 2)
    if breakdown:
        rec["pcii_breakdown"] = breakdown
    return rec


@router.get("/priority-zones", response_model=list[PriorityZone], tags=["enforcement"],
            summary="Ranked enforcement queue (EPS)")
def get_priority_zones(limit: int = Query(50, ge=1, le=500)) -> list[dict]:
    store = get_store()
    df = store.cells()
    if "eps" not in df.columns:
        raise HTTPException(status_code=503, detail="EPS not computed; run the pipeline.")
    cols = [c for c in [
        "priority_rank", "h3", "police_station", "eps", "pcii", "violations",
        "hotspot_category", "road_class", "eps_pcii_component", "eps_freq_component",
        "eps_crit_component",
    ] if c in df.columns]
    out = df.sort_values("eps", ascending=False).head(limit)[cols]
    return _clean_records(out)


@router.get("/forecast", tags=["forecast"], summary="Forecast results (optionally per cell)")
def get_forecast(
    h3_id: str | None = Query(None, description="Filter to a single H3 cell"),
    limit: int = Query(500, ge=1, le=5000),
) -> dict:
    store = get_store()
    df = store.forecast()
    if df.empty:
        return {"available": False, "metrics": store.metrics().get("forecast", {}), "points": []}
    if h3_id:
        df = df[df["h3"] == h3_id]
    cols = [c for c in ["h3", "date", "violations", "prediction"] if c in df.columns]
    df = df[cols].copy()
    if "date" in df.columns:
        df["date"] = df["date"].astype(str)
    return {
        "available": True,
        "metrics": store.metrics().get("forecast", {}),
        "points": _clean_records(df.head(limit)),
    }


@router.get("/simulation", response_model=SimulationResponse, tags=["simulation"],
            summary="What-if: enforce top-K zones -> projected city-impact reduction")
def get_simulation(
    k: int = Query(5, ge=1, le=100),
    compliance: float = Query(0.85, ge=0.0, le=1.0),
) -> dict:
    store = get_store()
    df = store.cells()
    try:
        return simulate_top_k(df, k=k, compliance=compliance, rank_col="eps")
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e


@router.get("/analytics", tags=["analytics"], summary="Summary metrics + profile for dashboards")
def get_analytics() -> dict:
    store = get_store()
    return {
        "metrics": store.metrics(),
        "data_profile": store.data_profile(),
    }


# =============================================================================
# Database-backed routes  (prefix: /db/*)
# These query PostgreSQL directly when GRIDLOCK_DATABASE_URL is configured.
# They return 503 gracefully when the DB is not set up yet.
# =============================================================================

def _require_db() -> Session:
    """Return a DB session or raise 503 if DB is not configured."""
    if not settings.db_enabled:
        raise HTTPException(
            status_code=503,
            detail="Database not configured. Set GRIDLOCK_DATABASE_URL env var.",
        )
    from app.core.database import get_db
    return next(get_db())


@router.get("/db/hotspots", tags=["database"], summary="Hotspot cells from PostgreSQL")
def db_get_hotspots(
    limit: int = Query(50, ge=1, le=500),
    significant_only: bool = Query(False, description="Only Gi* significant cells"),
    min_score: float = Query(0.0, ge=0, le=100, description="Min hotspot_score"),
) -> list[dict]:
    """Query hotspot cells directly from PostgreSQL."""
    from app.models.db_models import HotspotCell
    db = _require_db()
    try:
        q = db.query(HotspotCell)
        if significant_only:
            q = q.filter(HotspotCell.is_hotspot.is_(True))
        if min_score > 0:
            q = q.filter(HotspotCell.hotspot_score >= min_score)
        q = q.order_by(HotspotCell.hotspot_score.desc().nullslast()).limit(limit)
        cells = q.all()
        return [
            {
                "h3": c.h3,
                "hotspot_score": c.hotspot_score,
                "hotspot_category": c.hotspot_category,
                "is_hotspot": c.is_hotspot,
                "violations": c.violations,
                "pcii": c.pcii,
                "eps": c.eps,
                "priority_rank": c.priority_rank,
                "police_station": c.police_station,
                "road_class": c.road_class,
            }
            for c in cells
        ]
    finally:
        db.close()


@router.get("/db/hotspots/{h3_id}", tags=["database"], summary="Single H3 cell detail from PostgreSQL")
def db_get_hotspot(h3_id: str) -> dict:
    """Fetch a single hotspot cell by H3 ID from PostgreSQL."""
    from app.models.db_models import HotspotCell
    db = _require_db()
    try:
        cell = db.query(HotspotCell).filter(HotspotCell.h3 == h3_id).first()
        if not cell:
            raise HTTPException(status_code=404, detail=f"H3 cell {h3_id!r} not found in database.")
        weights = {"violation_density": 0.35, "road_capacity_reduction": 0.25,
                   "junction_importance": 0.20, "vehicle_footprint": 0.10, "temporal_persistence": 0.10}
        comp_map = {"violation_density": cell.pcii_density, "road_capacity_reduction": cell.pcii_capacity,
                    "junction_importance": cell.pcii_junction, "vehicle_footprint": cell.pcii_footprint,
                    "temporal_persistence": cell.pcii_persistence}
        breakdown = {
            k: round(100 * weights[k] * float(v), 2)
            for k, v in comp_map.items()
            if v is not None and not (isinstance(v, float) and math.isnan(v))
        }
        return {
            "h3": cell.h3,
            "hotspot_score": cell.hotspot_score,
            "hotspot_category": cell.hotspot_category,
            "is_hotspot": cell.is_hotspot,
            "violations": cell.violations,
            "top_violation": cell.top_violation,
            "pcii": cell.pcii,
            "pcii_breakdown": breakdown or None,
            "eps": cell.eps,
            "eps_pcii_component": cell.eps_pcii_component,
            "eps_freq_component": cell.eps_freq_component,
            "eps_crit_component": cell.eps_crit_component,
            "priority_rank": cell.priority_rank,
            "police_station": cell.police_station,
            "road_class": cell.road_class,
            "road_criticality": cell.road_criticality,
            "gi_z": cell.gi_z,
            "gi_p": cell.gi_p,
        }
    finally:
        db.close()


@router.get("/db/priority-zones", tags=["database"], summary="Ranked enforcement queue from PostgreSQL")
def db_get_priority_zones(limit: int = Query(50, ge=1, le=500)) -> list[dict]:
    """Return enforcement priority queue sorted by EPS from PostgreSQL."""
    from app.models.db_models import HotspotCell
    db = _require_db()
    try:
        cells = (
            db.query(HotspotCell)
            .filter(HotspotCell.eps.isnot(None))
            .order_by(HotspotCell.eps.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "priority_rank": c.priority_rank,
                "h3": c.h3,
                "police_station": c.police_station,
                "eps": c.eps,
                "pcii": c.pcii,
                "violations": c.violations,
                "hotspot_category": c.hotspot_category,
                "road_class": c.road_class,
                "eps_pcii_component": c.eps_pcii_component,
                "eps_freq_component": c.eps_freq_component,
                "eps_crit_component": c.eps_crit_component,
            }
            for c in cells
        ]
    finally:
        db.close()


@router.get("/db/forecast", tags=["database"], summary="Forecast records from PostgreSQL")
def db_get_forecast(
    h3_id: str | None = Query(None, description="Filter to a single H3 cell"),
    limit: int = Query(2000, ge=1, le=20000),
) -> dict:
    """Return LightGBM forecast from PostgreSQL plus model metrics.

    Without ``h3_id`` it returns a **city-wide daily series aggregated by date** (sum of
    violations/predictions across all cells) so the time-series chart renders a proper line.
    With ``h3_id`` it returns that single cell's daily points.
    """
    from sqlalchemy import func

    from app.models.db_models import ForecastRecord

    db = _require_db()
    metrics = get_store().metrics().get("forecast", {})
    try:
        if h3_id:
            rows = (
                db.query(ForecastRecord)
                .filter(ForecastRecord.h3 == h3_id)
                .order_by(ForecastRecord.date.asc())
                .limit(limit)
                .all()
            )
            points = [
                {"h3": r.h3, "date": str(r.date),
                 "violations": float(r.violations or 0), "prediction": float(r.prediction or 0)}
                for r in rows
            ]
        else:
            rows = (
                db.query(
                    ForecastRecord.date.label("date"),
                    func.sum(ForecastRecord.violations).label("violations"),
                    func.sum(ForecastRecord.prediction).label("prediction"),
                )
                .group_by(ForecastRecord.date)
                .order_by(ForecastRecord.date.asc())
                .all()
            )
            points = [
                {"h3": "ALL", "date": str(d),
                 "violations": round(float(v or 0), 2), "prediction": round(float(p or 0), 2)}
                for d, v, p in rows
            ]
        return {
            "available": len(points) > 0,
            "count": len(points),
            "metrics": metrics,
            "points": points,
        }
    finally:
        db.close()


@router.get("/db/simulate", tags=["database"],
            summary="What-if simulation using PostgreSQL data (logs result)")
def db_get_simulation(
    k: int = Query(5, ge=1, le=100),
    compliance: float = Query(0.85, ge=0.0, le=1.0),
) -> dict:
    """Run what-if simulation on PostgreSQL data and log the result."""
    from app.models.db_models import HotspotCell, SimulationLog
    db = _require_db()
    try:
        cells = db.query(HotspotCell).filter(
            HotspotCell.eps.isnot(None),
            HotspotCell.pcii.isnot(None),
            HotspotCell.violations.isnot(None),
        ).all()
        if not cells:
            raise HTTPException(status_code=503,
                                detail="No seeded data in DB. Run: python -m scripts.seed_db")
        import pandas as pd
        df = pd.DataFrame([
            {"h3": c.h3, "pcii": c.pcii, "violations": c.violations, "eps": c.eps}
            for c in cells
        ])
        result = simulate_top_k(df, k=k, compliance=compliance, rank_col="eps")

        # Persist simulation result for audit
        log_entry = SimulationLog(
            k=k,
            compliance=compliance,
            city_impact_before=result["city_impact_before"],
            city_impact_after=result["city_impact_after"],
            absolute_reduction=result["absolute_reduction"],
            reduction_pct=result["reduction_pct"],
            violations_addressed=result["violations_addressed"],
            cells_cleared=result["cells_cleared"],
            cleared_cell_ids=",".join(result["cleared_cell_ids"]),
        )
        db.add(log_entry)
        db.commit()
        return {**result, "simulation_id": log_entry.id}
    finally:
        db.close()
