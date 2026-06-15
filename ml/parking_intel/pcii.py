"""Module 2 — Proxy Congestion Impact Index (PCII), 0-100 (Phase 5).

PCII = 100 * ( 0.35 * violation_density
             + 0.25 * road_capacity_reduction
             + 0.20 * junction_importance
             + 0.10 * vehicle_footprint
             + 0.10 * temporal_persistence )

Each sub-term is normalized to [0, 1]. The capacity-reduction term is road-physics grounded:
a parked vehicle removes ~1 effective lane, so reduction ≈ 1 / lanes, scaled by severity.
See APPROACH.md §6.2.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import PCIIWeights


def _minmax(s: pd.Series) -> pd.Series:
    lo, hi = s.min(), s.max()
    if hi - lo < 1e-12:
        return pd.Series(np.zeros(len(s)), index=s.index)
    return (s - lo) / (hi - lo)


def compute(agg: pd.DataFrame, weights: PCIIWeights | None = None) -> pd.DataFrame:
    """Compute PCII (0-100) and store each normalized component for explainability."""
    w = weights or PCIIWeights()
    out = agg.copy()

    # 1. Violation density (per-day intensity), log-damped then normalized
    density = np.log1p(out["violations_per_day"].clip(lower=0))
    t_density = _minmax(density)

    # 2. Road capacity reduction: ~1 lane lost / available lanes, weighted by severity
    lanes = out["lanes"].clip(lower=1)
    capacity_loss = (1.0 / lanes) * out["severity_mean"]
    t_capacity = _minmax(capacity_loss)

    # 3. Junction importance (share of violations near junctions)
    t_junction = out["near_junction_share"].clip(0, 1)

    # 4. Vehicle footprint mix
    t_footprint = out["footprint_mean"].clip(0, 1)

    # 5. Temporal persistence
    t_persistence = out["temporal_persistence"].clip(0, 1)

    out["pcii_density"] = t_density
    out["pcii_capacity"] = t_capacity
    out["pcii_junction"] = t_junction
    out["pcii_footprint"] = t_footprint
    out["pcii_persistence"] = t_persistence

    score = (
        w.violation_density * t_density
        + w.road_capacity_reduction * t_capacity
        + w.junction_importance * t_junction
        + w.vehicle_footprint * t_footprint
        + w.temporal_persistence * t_persistence
    )
    out["pcii"] = (100.0 * score).clip(0, 100).round(2)
    return out


def factor_breakdown(row: pd.Series, weights: PCIIWeights | None = None) -> dict[str, float]:
    """Per-cell contribution of each weighted factor to the PCII score (explainability)."""
    w = (weights or PCIIWeights()).as_dict()
    comps = {
        "violation_density": row["pcii_density"],
        "road_capacity_reduction": row["pcii_capacity"],
        "junction_importance": row["pcii_junction"],
        "vehicle_footprint": row["pcii_footprint"],
        "temporal_persistence": row["pcii_persistence"],
    }
    return {k: round(100.0 * w[k] * v, 2) for k, v in comps.items()}
