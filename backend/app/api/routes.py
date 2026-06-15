"""REST API routes."""
from __future__ import annotations

import math

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app import __version__
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
    return HealthResponse(
        status="ok", version=__version__, data_available=store.available, n_cells=n
    )


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
