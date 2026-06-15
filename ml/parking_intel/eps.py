"""Module 4 — Enforcement Priority Score (EPS) (Phase 7).

EPS = 0.5 * PCII + 0.3 * Violation_Frequency + 0.2 * Road_Criticality   (all 0-100)

Produces a ranked enforcement queue with an explainable factor breakdown.
See APPROACH.md §6.2.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .config import EPSWeights


def _minmax_100(s: pd.Series) -> pd.Series:
    lo, hi = s.min(), s.max()
    if hi - lo < 1e-12:
        return pd.Series(np.zeros(len(s)), index=s.index)
    return 100.0 * (s - lo) / (hi - lo)


def compute(agg: pd.DataFrame, weights: EPSWeights | None = None) -> pd.DataFrame:
    """Compute EPS (0-100) and rank zones. Requires `pcii` and `road_criticality` columns."""
    w = weights or EPSWeights()
    out = agg.copy()

    freq_100 = _minmax_100(out["violations"])
    crit_100 = (out["road_criticality"] * 100).clip(0, 100)
    pcii_100 = out["pcii"].clip(0, 100)

    out["eps_pcii_component"] = (w.pcii * pcii_100).round(2)
    out["eps_freq_component"] = (w.violation_frequency * freq_100).round(2)
    out["eps_crit_component"] = (w.road_criticality * crit_100).round(2)

    out["eps"] = (
        out["eps_pcii_component"] + out["eps_freq_component"] + out["eps_crit_component"]
    ).clip(0, 100).round(2)

    out = out.sort_values("eps", ascending=False).reset_index(drop=True)
    out["priority_rank"] = np.arange(1, len(out) + 1)
    return out
