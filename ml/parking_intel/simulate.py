"""Module 5 — What-If Enforcement Simulation (Phase 10).

City-level aggregate impact is the exposure-weighted PCII over all cells:

    CityImpact = Σ_i  PCII_i * violations_i

Enforcing (clearing) a set K of zones reduces their contribution by a compliance factor
η (partial deterrence); recompute and report the % reduction. See APPROACH.md §6.2.
"""
from __future__ import annotations

import pandas as pd


def city_impact(scored: pd.DataFrame) -> float:
    """Exposure-weighted aggregate city impact."""
    return float((scored["pcii"] * scored["violations"]).sum())


def simulate_enforcement(
    scored: pd.DataFrame,
    cleared_cells: list[str],
    compliance: float = 0.85,
) -> dict:
    """Project the city-impact reduction from enforcing `cleared_cells`.

    Args:
        scored: per-cell frame with `h3`, `pcii`, `violations`.
        cleared_cells: H3 ids to enforce.
        compliance: fraction of impact removed in enforced cells (0..1).
    """
    base = city_impact(scored)
    cleared = set(cleared_cells)
    mask = scored["h3"].isin(cleared)

    after = scored.copy()
    after.loc[mask, "pcii_effective"] = after.loc[mask, "pcii"] * (1 - compliance)
    after["pcii_effective"] = after.get("pcii_effective", after["pcii"]).fillna(after["pcii"])
    new_impact = float((after["pcii_effective"] * after["violations"]).sum())

    reduction = base - new_impact
    pct = 100.0 * reduction / base if base > 0 else 0.0
    return {
        "cells_cleared": len(cleared),
        "compliance_factor": compliance,
        "city_impact_before": round(base, 2),
        "city_impact_after": round(new_impact, 2),
        "absolute_reduction": round(reduction, 2),
        "reduction_pct": round(pct, 2),
        "violations_addressed": int(scored.loc[mask, "violations"].sum()),
    }


def simulate_top_k(scored: pd.DataFrame, k: int = 5, rank_col: str = "eps",
                   compliance: float = 0.85) -> dict:
    """Convenience: enforce the top-k zones by `rank_col` (default EPS)."""
    top = scored.sort_values(rank_col, ascending=False).head(k)
    result = simulate_enforcement(scored, top["h3"].tolist(), compliance)
    result["k"] = k
    result["ranked_by"] = rank_col
    result["cleared_cell_ids"] = top["h3"].tolist()
    return result
