"""GeoJSON serialization for H3 cells (no geopandas dependency required)."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from .h3_index import cell_polygon


def cells_to_geojson(df: pd.DataFrame, property_cols: list[str]) -> dict:
    """Build a FeatureCollection of H3 hexagons with selected properties."""
    features = []
    for _, row in df.iterrows():
        props = {}
        for c in property_cols:
            if c in row:
                v = row[c]
                # JSON-safe
                props[c] = (
                    v.item() if hasattr(v, "item") else
                    (None if pd.isna(v) else v)
                )
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [cell_polygon(row["h3"])]},
                "properties": props,
            }
        )
    return {"type": "FeatureCollection", "features": features}


def write_geojson(df: pd.DataFrame, property_cols: list[str], path: str | Path) -> int:
    fc = cells_to_geojson(df, property_cols)
    Path(path).write_text(json.dumps(fc), encoding="utf-8")
    return len(fc["features"])
