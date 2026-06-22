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
    displacement_rate: float = 0.15,
) -> dict:
    """Project the city-impact reduction from enforcing ``cleared_cells``.

    Enforcement is not free: a fraction of the deterred parking *displaces* to adjacent
    cells rather than disappearing. We model that leakage so the headline figure is a
    realistic NET reduction, not an optimistic gross one.

    Args:
        scored: per-cell frame with ``h3``, ``pcii``, ``violations``.
        cleared_cells: H3 ids to enforce.
        compliance: fraction of impact removed in enforced cells (0..1).
        displacement_rate: fraction of removed impact that spills to adjacent cells (0..1).
    """
    import h3

    base = city_impact(scored)
    cleared = set(cleared_cells)
    mask = scored["h3"].isin(cleared)

    after = scored.copy()
    after["pcii_effective"] = after["pcii"].astype(float)
    all_cells = set(after["h3"])
    pos = {c: i for i, c in zip(after.index, after["h3"])}

    displaced_impact = 0.0
    for cell in cleared:
        if cell not in pos:
            continue
        i = pos[cell]
        original_pcii = float(after.at[i, "pcii"])
        after.at[i, "pcii_effective"] = original_pcii * (1 - compliance)
        deterred = (original_pcii * compliance) * float(after.at[i, "violations"])

        neighbors = [n for n in h3.grid_disk(cell, 1) if n != cell and n in all_cells]
        if neighbors and displacement_rate > 0:
            spill_per_neighbor = (deterred * displacement_rate) / len(neighbors)
            for n in neighbors:
                ni = pos[n]
                n_v = float(after.at[ni, "violations"])
                if n_v > 0:
                    after.at[ni, "pcii_effective"] += spill_per_neighbor / n_v
            displaced_impact += deterred * displacement_rate

    after["pcii_effective"] = after["pcii_effective"].clip(0, 100)
    new_impact = float((after["pcii_effective"] * after["violations"]).sum())

    net_reduction = base - new_impact            # what actually sticks after displacement
    gross_reduction = net_reduction + displaced_impact  # if displacement were ignored
    net_pct = 100.0 * net_reduction / base if base > 0 else 0.0
    gross_pct = 100.0 * gross_reduction / base if base > 0 else 0.0

    return {
        "cells_cleared": len(cleared),
        "compliance_factor": compliance,
        "displacement_rate": displacement_rate,
        "city_impact_before": round(base, 2),
        "city_impact_after": round(new_impact, 2),
        "absolute_reduction": round(net_reduction, 2),
        "reduction_pct": round(net_pct, 2),
        "gross_reduction": round(gross_reduction, 2),
        "gross_reduction_pct": round(gross_pct, 2),
        "violations_addressed": int(scored.loc[mask, "violations"].sum()),
    }


def simulate_top_k(scored: pd.DataFrame, k: int = 5, rank_col: str = "eps",
                   compliance: float = 0.85, displacement_rate: float = 0.15) -> dict:
    """Convenience: enforce the top-k zones by ``rank_col`` (default EPS)."""
    top = scored.sort_values(rank_col, ascending=False).head(k)
    result = simulate_enforcement(scored, top["h3"].tolist(), compliance, displacement_rate)
    result["k"] = k
    result["ranked_by"] = rank_col
    result["cleared_cell_ids"] = top["h3"].tolist()
    return result
