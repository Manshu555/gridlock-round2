"""Tests for the honesty-guarded PCII speed validation."""
from __future__ import annotations

import pandas as pd

from parking_intel import speed_validation as sv


def _scored() -> pd.DataFrame:
    return pd.DataFrame([
        {"h3": f"cell{i}", "pcii": float(p), "cell_lat": 12.97 + i * 0.001,
         "cell_lon": 77.59 + i * 0.001}
        for i, p in enumerate([90, 80, 70, 60, 50, 40, 30, 20])
    ])


def test_synthetic_is_not_promoted_as_validation():
    """Without a key/cache the result must be clearly labelled synthetic, not a validation."""
    res = sv.validate_pcii_vs_speed(_scored(), api_key=None, n_points=8, cache_path=None)
    assert res["status"] == "success"
    assert res["validation_source"] == "synthetic"
    assert res["is_validation"] is False
    assert "pearson_r" in res


def test_too_few_points_fails_gracefully():
    res = sv.validate_pcii_vs_speed(_scored().head(2), api_key=None, cache_path=None)
    assert res["status"] == "failed"
    assert res["is_validation"] is False
