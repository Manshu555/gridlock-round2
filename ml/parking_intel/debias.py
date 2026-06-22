"""Module 2.5 — Patrol-sampling de-bias (exposure normalization), Phase 2.5.

Report-based violation data is *patrol-sampled*: a cell's raw count reflects BOTH
the true illegal-parking intensity AND how heavily that beat was patrolled. Ranking
by raw counts therefore mostly ranks *where officers wrote tickets*, not *where
illegal parking is worst* — the central weakness a technical jury attacks.

We correct for this by normalizing each cell's violations by an **exposure proxy**:
the average per-cell violation volume of its dominant police station (enforcement
effort baseline). Cells in heavily-patrolled stations are discounted; cells in
lightly-patrolled stations are boosted. The result, ``violation_rate``, is an
intensity-per-unit-enforcement-effort signal that is NOT a constant multiple of the
raw count, so it reorders the priority queue.

See APPROACH.md §0.3 (patrol-sampling bias).
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def compute_exposure_proxy(agg: pd.DataFrame) -> pd.DataFrame:
    """Add ``patrol_exposure`` and a de-biased ``violation_rate`` to a per-cell frame.

    Args:
        agg: per-H3-cell frame with at least ``violations`` and ``police_station``.

    Returns:
        Copy of ``agg`` with new columns ``patrol_exposure`` and ``violation_rate``.
    """
    out = agg.copy()

    if "police_station" in out.columns:
        station_total = out.groupby("police_station")["violations"].transform("sum")
        station_cells = out.groupby("police_station")["violations"].transform("count")
        # Average violations per cell within the dominant station = exposure baseline.
        exposure = (station_total / station_cells.clip(lower=1)).clip(lower=1.0)
    else:
        exposure = pd.Series(1.0, index=out.index)

    out["patrol_exposure"] = exposure.round(4)

    # Intensity relative to local enforcement effort (dimensionless, > 0).
    rate = out["violations"] / out["patrol_exposure"]

    # Temporal-exposure correction: a cell active on more days has had more chances
    # to be observed, so down-weight subtly by relative coverage.
    if "active_days" in out.columns:
        coverage = (out["active_days"] / max(out["active_days"].max(), 1)).clip(0.1, 1.0)
        rate = rate * coverage

    out["violation_rate"] = rate.replace([np.inf, -np.inf], np.nan).fillna(0.0).round(4)
    return out
