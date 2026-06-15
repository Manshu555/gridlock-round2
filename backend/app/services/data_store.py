"""Loads pipeline outputs and serves them to the API.

Prefers parquet (full fidelity); falls back to the committed GeoJSON/JSON snapshot so the
API works on a fresh deploy even without the raw dataset. Data is cached in memory and
can be hot-reloaded.
"""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path

import pandas as pd

from app.core.config import settings

log = logging.getLogger("gridlock.datastore")


def _read_geojson_to_df(path: Path) -> pd.DataFrame:
    fc = json.loads(path.read_text(encoding="utf-8"))
    rows = [f["properties"] for f in fc.get("features", [])]
    return pd.DataFrame(rows)


class DataStore:
    """In-memory cache of pipeline artifacts."""

    def __init__(self, outputs_dir: Path | None = None) -> None:
        self.dir = Path(outputs_dir or settings.outputs_dir)
        self._cache: dict[str, object] = {}

    # ---- loaders ----
    def _load_cells(self) -> pd.DataFrame:
        pq = self.dir / "priority_zones.parquet"
        if pq.exists():
            return pd.read_parquet(pq)
        gj = self.dir / "hotspots.geojson"
        if gj.exists():
            return _read_geojson_to_df(gj)
        raise FileNotFoundError(
            "No pipeline outputs found. Run: python -m parking_intel.pipeline"
        )

    def cells(self) -> pd.DataFrame:
        if "cells" not in self._cache:
            self._cache["cells"] = self._load_cells()
        return self._cache["cells"]  # type: ignore[return-value]

    def metrics(self) -> dict:
        if "metrics" not in self._cache:
            p = self.dir / "metrics.json"
            self._cache["metrics"] = json.loads(p.read_text()) if p.exists() else {}
        return self._cache["metrics"]  # type: ignore[return-value]

    def data_profile(self) -> dict:
        p = self.dir / "data_profile.json"
        return json.loads(p.read_text()) if p.exists() else {}

    def hotspots_geojson(self) -> dict:
        p = self.dir / "hotspots.geojson"
        return json.loads(p.read_text()) if p.exists() else {"type": "FeatureCollection", "features": []}

    def priority_geojson(self) -> dict:
        p = self.dir / "priority_zones.geojson"
        if p.exists():
            return json.loads(p.read_text())
        return self.hotspots_geojson()

    def forecast(self) -> pd.DataFrame:
        if "forecast" not in self._cache:
            p = self.dir / "forecast_results.parquet"
            self._cache["forecast"] = pd.read_parquet(p) if p.exists() else pd.DataFrame()
        return self._cache["forecast"]  # type: ignore[return-value]

    def reload(self) -> None:
        self._cache.clear()

    @property
    def available(self) -> bool:
        return (self.dir / "metrics.json").exists() or (self.dir / "hotspots.geojson").exists()


@lru_cache(maxsize=1)
def get_store() -> DataStore:
    return DataStore()
