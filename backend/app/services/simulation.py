"""What-if enforcement simulation (self-contained; mirrors parking_intel.simulate).

CityImpact = Σ_i PCII_i * violations_i ; enforcing top-k cells removes a `compliance`
fraction of their impact. Kept standalone so the backend deploys without the ml package.
"""
from __future__ import annotations

import pandas as pd


def simulate_top_k(cells: pd.DataFrame, k: int = 5, compliance: float = 0.85,
                   rank_col: str = "eps") -> dict:
    required = {"h3", "pcii", "violations"}
    if not required.issubset(cells.columns):
        raise ValueError(f"cells frame missing columns: {required - set(cells.columns)}")

    rank_col = rank_col if rank_col in cells.columns else "pcii"
    base = float((cells["pcii"] * cells["violations"]).sum())
    top = cells.sort_values(rank_col, ascending=False).head(k)
    cleared = set(top["h3"])

    eff = cells.copy()
    mask = eff["h3"].isin(cleared)
    eff["pcii_eff"] = eff["pcii"]
    eff.loc[mask, "pcii_eff"] = eff.loc[mask, "pcii"] * (1 - compliance)
    after = float((eff["pcii_eff"] * eff["violations"]).sum())

    reduction = base - after
    pct = 100.0 * reduction / base if base > 0 else 0.0
    return {
        "k": int(k),
        "ranked_by": rank_col,
        "cells_cleared": len(cleared),
        "compliance_factor": compliance,
        "city_impact_before": round(base, 2),
        "city_impact_after": round(after, 2),
        "absolute_reduction": round(reduction, 2),
        "reduction_pct": round(pct, 2),
        "violations_addressed": int(cells.loc[cells["h3"].isin(cleared), "violations"].sum()),
        "cleared_cell_ids": top["h3"].tolist(),
    }
