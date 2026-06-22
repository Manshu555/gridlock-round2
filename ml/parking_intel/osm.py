"""Module 1.5 — OpenStreetMap road enrichment (Phase 4).

Pulls the drivable road network for the area bounding box with OSMnx and spatial-joins
each H3 cell centroid to its nearest road edge to obtain lane count, road class, and a
junction-density estimate.

OSMnx requires network access and a heavy dependency tree. When it is unavailable
(offline / not installed), `enrich` transparently falls back to CLASS-BASED DEFAULTS
derived from the in-dataset `near_junction` signal, so the pipeline always completes.
This mirrors APPROACH.md §6.2 ("class-based defaults when OSM absent").
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import DEFAULT_ROAD_CLASS, ROAD_CLASS_DEFAULTS


def _fallback(agg: pd.DataFrame) -> pd.DataFrame:
    """Offline heuristic: infer road class from junction proximity ONLY.

    Deliberately does NOT use violation counts/intensity: deriving road criticality
    from violations and then using it to rank violations would be circular. Junction
    proximity is an independent structural signal, so the fallback stays defensible.
    """
    out = agg.copy()
    classes = []
    for share in out["near_junction_share"].to_numpy():
        if share > 0.4:
            classes.append("primary")
        elif share > 0.15:
            classes.append("secondary")
        else:
            classes.append("tertiary")
    out["road_class"] = classes
    out["lanes"] = out["road_class"].map(lambda c: ROAD_CLASS_DEFAULTS[c]["lanes"])
    out["road_criticality"] = out["road_class"].map(
        lambda c: ROAD_CLASS_DEFAULTS[c]["criticality"]
    )
    out["osm_source"] = "fallback"
    return out


def enrich(agg: pd.DataFrame, bbox: dict | None = None) -> pd.DataFrame:
    """Enrich cells with road attributes. Tries OSMnx, falls back to defaults."""
    try:
        import osmnx as ox  # type: ignore
        from shapely.geometry import Point  # type: ignore
    except Exception:
        return _fallback(agg)

    try:
        lat0, lat1 = agg["cell_lat"].min(), agg["cell_lat"].max()
        lon0, lon1 = agg["cell_lon"].min(), agg["cell_lon"].max()
        graph = ox.graph_from_bbox(lat1, lat0, lon1, lon0, network_type="drive")
        edges = ox.graph_to_gdfs(graph, nodes=False)

        def nearest_attrs(lat: float, lon: float) -> tuple[str, float]:
            u, v, _ = ox.distance.nearest_edges(graph, lon, lat)
            row = edges.loc[(u, v)] if (u, v) in edges.index else edges.iloc[0]
            hwy = row.get("highway", DEFAULT_ROAD_CLASS)
            if isinstance(hwy, list):
                hwy = hwy[0]
            lanes = row.get("lanes", None)
            try:
                lanes = float(lanes[0] if isinstance(lanes, list) else lanes)
            except (TypeError, ValueError):
                lanes = np.nan
            return str(hwy), lanes

        out = agg.copy()
        rc, ln = [], []
        for lat, lon in zip(out["cell_lat"], out["cell_lon"]):
            cls, lanes = nearest_attrs(lat, lon)
            cls = cls if cls in ROAD_CLASS_DEFAULTS else DEFAULT_ROAD_CLASS
            rc.append(cls)
            ln.append(lanes if not np.isnan(lanes) else ROAD_CLASS_DEFAULTS[cls]["lanes"])
        out["road_class"] = rc
        out["lanes"] = ln
        out["road_criticality"] = out["road_class"].map(
            lambda c: ROAD_CLASS_DEFAULTS[c]["criticality"]
        )
        out["osm_source"] = "osmnx"
        return out
    except Exception:
        return _fallback(agg)
