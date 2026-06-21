"""Tests for the forecasting module and the end-to-end pipeline (smoke)."""
from __future__ import annotations

import json

from parking_intel import data as data_mod
from parking_intel import forecast as forecast_mod
from parking_intel.config import SETTINGS
from parking_intel.h3_index import assign_cells
from parking_intel.pipeline import run


def test_build_panel_and_features(synthetic_events):
    clean = data_mod.clean(synthetic_events)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    panel = forecast_mod.build_panel(clean)
    assert set(forecast_mod.FEATURES).issubset(panel.columns)
    assert len(panel) > 0
    assert panel[forecast_mod.FEATURES].notna().all().all()


def test_train_forecast_returns_metrics(synthetic_events):
    clean = data_mod.clean(synthetic_events)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    _, metrics, preds = forecast_mod.train_forecast(clean)
    assert "backend" in metrics
    if "mae" in metrics:
        assert metrics["mae"] >= 0
        assert "prediction" in preds.columns


def test_pipeline_end_to_end(synthetic_events, tmp_path):
    csv = tmp_path / "violations.csv"
    synthetic_events.to_csv(csv, index=False)
    outdir = tmp_path / "out"
    metrics = run(csv, outdir)

    # all key artifacts written
    for fname in [
        "data_profile.json", "aggregated_features.parquet", "hotspots.geojson",
        "pcii_scores.parquet", "priority_zones.parquet", "priority_zones.geojson",
        "forecast_results.parquet", "simulation.json", "metrics.json",
    ]:
        assert (outdir / fname).exists(), f"missing {fname}"

    assert metrics["n_cells"] > 0
    assert metrics["rows_clean"] > 0
    assert "morans_i" in metrics
    sim = json.loads((outdir / "simulation.json").read_text())
    assert sim["reduction_pct"] >= 0
