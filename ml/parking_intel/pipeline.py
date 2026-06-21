"""End-to-end pipeline orchestrator.

Runs all phases on the violation dataset and writes every artifact the API/dashboard
consume:

    data_profile.json          (Phase 1)
    aggregated_features.parquet (Phase 2)
    hotspots.geojson           (Phase 3)
    road_features.parquet      (Phase 4)
    pcii_scores.parquet        (Phase 5)
    forecast_results.parquet   (Phase 6)
    priority_zones.parquet / .geojson  (Phase 7)
    simulation.json            (Phase 10)
    metrics.json               (summary metrics)

Usage:
    python -m parking_intel.pipeline --input datasets/violations.csv --outdir outputs
"""
from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from . import data as data_mod
from . import eps as eps_mod
from . import forecast as forecast_mod
from . import hotspots as hotspots_mod
from . import osm as osm_mod
from . import pcii as pcii_mod
from . import simulate as sim_mod
from .config import DEFAULT_INPUT, DEFAULT_OUTDIR, SETTINGS
from .geojson_utils import write_geojson
from .h3_index import aggregate, assign_cells

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("parking_intel.pipeline")


def _write_json(obj: dict, path: Path) -> None:
    path.write_text(json.dumps(obj, indent=2, default=str), encoding="utf-8")


def run(input_path: str | Path = DEFAULT_INPUT, outdir: str | Path = DEFAULT_OUTDIR) -> dict:
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    metrics: dict = {}

    # ---- Phase 1: load + clean + profile ----
    log.info("Phase 1: loading + cleaning %s", input_path)
    raw = data_mod.load_raw(input_path)
    clean = data_mod.clean(raw)
    prof = data_mod.profile(raw, clean)
    _write_json(prof, outdir / "data_profile.json")
    log.info("  rows: raw=%d clean=%d", prof["rows_raw"], prof["rows_clean"])

    # ---- Phase 2: H3 aggregation ----
    log.info("Phase 2: H3 aggregation (res=%d)", SETTINGS.h3_resolution)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    agg = aggregate(clean)
    agg.to_parquet(outdir / "aggregated_features.parquet", index=False)
    log.info("  cells: %d", len(agg))

    # ---- Phase 3: Gi* hotspot detection ----
    log.info("Phase 3: Getis-Ord Gi* hotspot detection")
    agg = hotspots_mod.gi_star(agg, z_threshold=SETTINGS.hotspot_z_threshold)
    moran = hotspots_mod.morans_i(agg)
    metrics["morans_i"] = moran
    n_hot = int(agg["is_hotspot"].sum())
    log.info("  hotspots(95%%): %d | Moran's I: %s", n_hot, moran)

    # ---- Phase 4: OSM enrichment (offline fallback safe) ----
    log.info("Phase 4: OSM road enrichment")
    agg = osm_mod.enrich(agg)
    agg.to_parquet(outdir / "road_features.parquet", index=False)
    log.info("  road source: %s", agg["osm_source"].iat[0] if len(agg) else "n/a")

    # ---- Phase 5: PCII ----
    log.info("Phase 5: PCII")
    agg = pcii_mod.compute(agg, SETTINGS.pcii_weights)
    agg.to_parquet(outdir / "pcii_scores.parquet", index=False)

    # ---- Phase 7: EPS (needs pcii + road_criticality) ----
    log.info("Phase 7: EPS enforcement priority")
    scored = eps_mod.compute(agg, SETTINGS.eps_weights)
    scored.to_parquet(outdir / "priority_zones.parquet", index=False)

    # hotspots.geojson + priority_zones.geojson
    hot_cols = [
        "h3", "violations", "gi_z", "gi_p", "hotspot_category", "hotspot_score",
        "is_hotspot", "pcii", "police_station", "top_violation",
    ]
    n_feat = write_geojson(scored, hot_cols, outdir / "hotspots.geojson")
    pri_cols = hot_cols + [
        "eps", "priority_rank", "road_class", "road_criticality",
        "eps_pcii_component", "eps_freq_component", "eps_crit_component",
    ]
    write_geojson(scored.head(200), pri_cols, outdir / "priority_zones.geojson")
    log.info("  geojson features: %d", n_feat)

    # ---- Phase 6: forecasting ----
    log.info("Phase 6: forecasting")
    _, fc_metrics, fc_pred = forecast_mod.train_forecast(clean)
    fc_pred.to_parquet(outdir / "forecast_results.parquet", index=False)
    metrics["forecast"] = fc_metrics
    log.info("  forecast backend=%s metrics=%s", fc_metrics.get("backend"), fc_metrics)

    # ---- Phase 10: what-if simulation (enforce top-5 by EPS) ----
    log.info("Phase 10: what-if enforcement simulation (top-5 EPS)")
    sim = sim_mod.simulate_top_k(scored, k=5, rank_col="eps")
    _write_json(sim, outdir / "simulation.json")
    metrics["simulation_top5"] = sim
    log.info("  projected city-impact reduction: %.2f%%", sim["reduction_pct"])

    # ---- summary metrics ----
    metrics.update(
        {
            "rows_clean": prof["rows_clean"],
            "h3_resolution": SETTINGS.h3_resolution,
            "n_cells": int(len(scored)),
            "n_hotspots_95": n_hot,
            "pcii_mean": round(float(scored["pcii"].mean()), 2),
            "pcii_max": round(float(scored["pcii"].max()), 2),
            "top_priority_zones": scored.head(10)[
                ["h3", "police_station", "eps", "pcii", "violations", "hotspot_category"]
            ].to_dict(orient="records"),
        }
    )
    _write_json(metrics, outdir / "metrics.json")
    log.info("Pipeline complete. Outputs -> %s", outdir)
    return metrics


def main() -> None:
    ap = argparse.ArgumentParser(description="Parking Intelligence pipeline")
    ap.add_argument("--input", default=str(DEFAULT_INPUT))
    ap.add_argument("--outdir", default=str(DEFAULT_OUTDIR))
    args = ap.parse_args()
    run(args.input, args.outdir)


if __name__ == "__main__":
    main()
