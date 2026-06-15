"""Unit tests for the ML/GIS core (M1-M5)."""
from __future__ import annotations

import pandas as pd

from parking_intel import data as data_mod
from parking_intel import eps as eps_mod
from parking_intel import hotspots as hotspots_mod
from parking_intel import osm as osm_mod
from parking_intel import pcii as pcii_mod
from parking_intel import simulate as sim_mod
from parking_intel.config import SETTINGS
from parking_intel.h3_index import aggregate, assign_cells


def _agg(synthetic_events: pd.DataFrame) -> pd.DataFrame:
    clean = data_mod.clean(synthetic_events)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    return aggregate(clean)


def test_clean_drops_invalid_and_parses(synthetic_events):
    clean = data_mod.clean(synthetic_events)
    assert len(clean) > 0
    assert clean["violation_types"].apply(lambda x: isinstance(x, list)).all()
    assert clean["latitude"].between(12.7, 13.25).all()


def test_aggregate_produces_cells(synthetic_events):
    agg = _agg(synthetic_events)
    assert {"h3", "violations", "severity_mean", "temporal_persistence"} <= set(agg.columns)
    assert (agg["violations"] > 0).all()


def test_gi_star_and_morans(synthetic_events):
    agg = hotspots_mod.gi_star(_agg(synthetic_events))
    assert {"gi_z", "gi_p", "hotspot_category", "hotspot_score", "is_hotspot"} <= set(agg.columns)
    assert agg["hotspot_score"].between(0, 100).all()
    moran = hotspots_mod.morans_i(agg)
    # clustered synthetic data -> positive autocorrelation
    assert moran["morans_i"] > moran["expected"]


def test_pcii_range_and_weights(synthetic_events):
    agg = osm_mod.enrich(_agg(synthetic_events))
    scored = pcii_mod.compute(agg, SETTINGS.pcii_weights)
    assert scored["pcii"].between(0, 100).all()
    w = SETTINGS.pcii_weights
    assert abs(sum(w.as_dict().values()) - 1.0) < 1e-9


def test_eps_ranking(synthetic_events):
    agg = osm_mod.enrich(_agg(synthetic_events))
    agg = pcii_mod.compute(agg)
    scored = eps_mod.compute(agg)
    assert scored["eps"].between(0, 100).all()
    assert scored["priority_rank"].iloc[0] == 1
    # ranking is monot, descending by eps
    assert scored["eps"].is_monotonic_decreasing


def test_simulation_reduces_impact(synthetic_events):
    agg = osm_mod.enrich(_agg(synthetic_events))
    agg = pcii_mod.compute(agg)
    scored = eps_mod.compute(agg)
    res = sim_mod.simulate_top_k(scored, k=3, rank_col="eps")
    assert res["reduction_pct"] > 0
    assert res["city_impact_after"] < res["city_impact_before"]
    assert res["cells_cleared"] == 3
