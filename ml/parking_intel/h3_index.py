"""H3 hexagonal spatial indexing and per-cell feature aggregation (Phase 2).

Uses h3 v4 API (latlng_to_cell, cell_to_boundary, cell_to_latlng, grid_disk).
"""
from __future__ import annotations

import h3
import numpy as np
import pandas as pd

from .config import (
    DEFAULT_FOOTPRINT,
    DEFAULT_SEVERITY,
    VEHICLE_FOOTPRINT,
    VIOLATION_SEVERITY,
)


def assign_cells(df: pd.DataFrame, resolution: int) -> pd.DataFrame:
    """Add an h3 index column at the given resolution."""
    df = df.copy()
    df["h3"] = [
        h3.latlng_to_cell(lat, lon, resolution)
        for lat, lon in zip(df["latitude"].to_numpy(), df["longitude"].to_numpy(), strict=False)
    ]
    return df


def _severity(types: list[str]) -> float:
    if not types:
        return DEFAULT_SEVERITY
    return float(np.mean([VIOLATION_SEVERITY.get(t, DEFAULT_SEVERITY) for t in types]))


def aggregate(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate violation events to per-H3-cell features.

    Returns one row per cell with columns used by hotspot/PCII/EPS modules.
    """
    df = df.copy()
    df["severity"] = df["violation_types"].apply(_severity)
    df["footprint"] = df["vehicle_type"].map(VEHICLE_FOOTPRINT).fillna(DEFAULT_FOOTPRINT)

    n_days = max(df["date"].nunique(), 1)

    grouped = df.groupby("h3")
    agg = grouped.agg(
        violations=("id", "count"),
        severity_mean=("severity", "mean"),
        footprint_mean=("footprint", "mean"),
        near_junction_share=("near_junction", "mean"),
        active_days=("date", "nunique"),
        unique_vehicles=("vehicle_number", "nunique"),
        lat=("latitude", "mean"),
        lon=("longitude", "mean"),
    ).reset_index()

    # dominant police station + primary violation per cell
    agg["police_station"] = grouped["police_station"].agg(
        lambda s: s.mode().iat[0] if not s.mode().empty else "UNKNOWN"
    ).values
    agg["top_violation"] = grouped["primary_violation"].agg(
        lambda s: s.mode().iat[0] if not s.mode().empty else "UNKNOWN"
    ).values

    agg["temporal_persistence"] = (agg["active_days"] / n_days).clip(0, 1)
    agg["violations_per_day"] = agg["violations"] / n_days

    centroid = [h3.cell_to_latlng(c) for c in agg["h3"]]
    agg["cell_lat"] = [c[0] for c in centroid]
    agg["cell_lon"] = [c[1] for c in centroid]
    return agg


def cell_polygon(cell: str) -> list[list[float]]:
    """Return a GeoJSON-ready [[lon,lat], ...] ring for an H3 cell."""
    boundary = h3.cell_to_boundary(cell)  # list of (lat, lon) in h3 v4
    ring = [[lon, lat] for lat, lon in boundary]
    ring.append(ring[0])  # close the ring
    return ring


def neighbor_weights(cells: list[str], k: int = 1) -> dict[str, list[str]]:
    """For each cell, its k-ring neighbours that are present in `cells` (incl. self)."""
    present = set(cells)
    return {c: [n for n in h3.grid_disk(c, k) if n in present] for c in cells}
