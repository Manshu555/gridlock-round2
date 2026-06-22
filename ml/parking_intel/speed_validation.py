"""Module 6 — PCII speed validation (Phase 11).

The problem statement's central verb is "quantify impact on traffic flow". PCII is a
*proxy* until it is correlated against an external traffic measurement. This module
fetches real congestion (speed-deficit) data at the top-N hotspot centroids from a
traffic API (TomTom Flow by default) and reports the Pearson/Spearman correlation
between PCII and observed speed deficit.

Honesty guardrail
-----------------
When no API key and no real cache are available, the function returns a clearly-labelled
``validation_source == "synthetic"`` result that the pipeline MUST NOT promote into the
headline metrics. A made-up correlation is worse than none.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import pandas as pd

log = logging.getLogger("parking_intel.speed_validation")


def _correlate(pcii: pd.Series, deficit: pd.Series) -> dict:
    import scipy.stats

    pearson_r, pearson_p = scipy.stats.pearsonr(pcii, deficit)
    spearman_r, spearman_p = scipy.stats.spearmanr(pcii, deficit)
    return {
        "pearson_r": round(float(pearson_r), 4),
        "pearson_p": float(pearson_p),
        "spearman_r": round(float(spearman_r), 4),
        "spearman_p": float(spearman_p),
        "is_significant": bool(pearson_p < 0.05),
    }


def _fetch_tomtom(top: pd.DataFrame, api_key: str) -> list[dict]:
    import time

    import requests

    results: list[dict] = []
    for _, row in top.iterrows():
        lat, lon = row["cell_lat"], row["cell_lon"]
        url = (
            "https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"
            f"?key={api_key}&point={lat},{lon}"
        )
        try:
            resp = requests.get(url, timeout=5)
            if resp.status_code != 200:
                continue
            flow = resp.json().get("flowSegmentData", {})
            cur = float(flow.get("currentSpeed", 0) or 0)
            free = float(flow.get("freeFlowSpeed", 0) or 0)
            deficit = 1.0 - (cur / free) if free > 0 else 0.0
            results.append({
                "h3": row["h3"],
                "lat": float(lat),
                "lon": float(lon),
                "pcii": round(float(row["pcii"]), 2),
                "current_speed": cur,
                "free_flow_speed": free,
                "speed_deficit": round(deficit, 4),
            })
            time.sleep(0.2)  # be polite to the API
        except Exception as e:  # pragma: no cover - network dependent
            log.warning("speed fetch failed for %s,%s: %s", lat, lon, e)
    return results


def validate_pcii_vs_speed(
    scored_df: pd.DataFrame,
    api_key: str | None = None,
    n_points: int = 50,
    cache_path: Path | None = None,
) -> dict:
    """Correlate PCII against observed traffic speed deficit at top-N hotspots.

    Resolution order: real cache (``validation_source="cached"``) -> live TomTom API
    (``"tomtom"``) -> labelled synthetic demo data (``"synthetic"``, never headline).
    """
    api_key = api_key or os.environ.get("TOMTOM_API_KEY")
    top = scored_df.nlargest(n_points, "pcii").copy()

    points: list[dict] = []
    source = "synthetic"

    # 1. Real cached measurements (committed for reproducible offline demos)
    if cache_path and Path(cache_path).exists():
        cached = json.loads(Path(cache_path).read_text())
        if cached.get("validation_source") in {"tomtom", "cached"}:
            points = cached.get("points", [])
            source = "cached"

    # 2. Live API
    if not points and api_key:
        points = _fetch_tomtom(top, api_key)
        if points:
            source = "tomtom"
            if cache_path:
                Path(cache_path).parent.mkdir(parents=True, exist_ok=True)
                Path(cache_path).write_text(
                    json.dumps({"validation_source": "tomtom", "points": points}, indent=2)
                )

    # 3. Labelled synthetic fallback (NOT a real validation)
    if not points:
        import numpy as np

        log.warning("No TomTom key/cache: emitting SYNTHETIC speed data (not a validation).")
        rng = np.random.default_rng(42)
        deficit = (top["pcii"].to_numpy() / 150.0 + rng.normal(0, 0.1, len(top))).clip(0, 0.95)
        points = [
            {"h3": r["h3"], "pcii": round(float(r["pcii"]), 2), "speed_deficit": round(float(d), 4)}
            for (_, r), d in zip(top.iterrows(), deficit)
        ]

    pts = pd.DataFrame(points)
    if len(pts) < 3:
        return {"status": "failed", "validation_source": source,
                "is_validation": False, "reason": "Not enough points for correlation"}

    corr = _correlate(pts["pcii"], pts["speed_deficit"])
    is_validation = source in {"tomtom", "cached"}
    return {
        "status": "success",
        "validation_source": source,
        "is_validation": is_validation,
        "n_points": int(len(pts)),
        **corr,
        "points": points,
    }
