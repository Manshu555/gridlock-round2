"""Tests for patrol-sampling de-bias (exposure normalization)."""
from __future__ import annotations

from parking_intel import data as data_mod
from parking_intel import debias as debias_mod
from parking_intel.config import SETTINGS
from parking_intel.h3_index import aggregate, assign_cells


def _agg(synthetic_events):
    clean = data_mod.clean(synthetic_events)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    return aggregate(clean)


def test_exposure_proxy_columns_and_bounds(synthetic_events):
    agg = _agg(synthetic_events)
    out = debias_mod.compute_exposure_proxy(agg)

    assert "patrol_exposure" in out.columns
    assert "violation_rate" in out.columns
    assert (out["patrol_exposure"] >= 1.0).all()
    assert (out["violation_rate"] >= 0).all()


def test_violation_rate_is_not_constant_multiple_of_count(synthetic_events):
    """If rate were just violations * k it would be a no-op; assert genuine debias."""
    agg = _agg(synthetic_events)
    out = debias_mod.compute_exposure_proxy(agg)
    ratio = (out["violation_rate"] / out["violations"].clip(lower=1)).round(6)
    assert ratio.nunique() > 1
