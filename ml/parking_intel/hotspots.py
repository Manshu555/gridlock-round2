"""Module 1 — Getis-Ord Gi* hotspot detection (Phase 3).

NumPy implementation of the Gi* statistic over an H3 adjacency graph, so the pipeline
runs without PySAL. If `esda`/`libpysal` are installed, `gi_star_pysal` offers a
reference cross-check.

    G_i* = ( Σ_j w_ij x_j - X̄ Σ_j w_ij )
           / ( S * sqrt[ (n Σ_j w_ij² - (Σ_j w_ij)²) / (n-1) ] )

with self-included binary weights (k-ring), X̄ = mean(x), S = population std of x.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

try:
    from scipy.stats import norm
    _NORM_SF = norm.sf
except Exception:  # pragma: no cover - scipy should be present
    import math

    def _NORM_SF(z):  # type: ignore
        z = np.asarray(z, dtype=float)
        return 0.5 * np.array([math.erfc(v / math.sqrt(2)) for v in z.ravel()]).reshape(z.shape)

from .h3_index import neighbor_weights


def gi_star(agg: pd.DataFrame, value_col: str = "violations", z_threshold: float = 1.96) -> pd.DataFrame:
    """Compute Gi* z-scores, p-values and hotspot categories for each H3 cell."""
    cells = agg["h3"].tolist()
    x = agg[value_col].to_numpy(dtype=float)
    n = len(x)
    out = agg.copy()

    if n < 3:
        out["gi_z"] = 0.0
        out["gi_p"] = 1.0
        out["hotspot_category"] = "Not Significant"
        out["hotspot_score"] = _minmax(x) * 100
        return out

    xbar = x.mean()
    s = np.sqrt(max((x**2).mean() - xbar**2, 1e-12))

    idx = {c: i for i, c in enumerate(cells)}
    nbrs = neighbor_weights(cells, k=1)

    z = np.zeros(n)
    for c, neigh in nbrs.items():
        i = idx[c]
        j = np.array([idx[m] for m in neigh])
        wsum = float(len(j))            # binary weights => Σ w = count, Σ w² = count
        lag = x[j].sum()
        denom = s * np.sqrt((n * wsum - wsum**2) / (n - 1))
        z[i] = (lag - xbar * wsum) / denom if denom > 0 else 0.0

    p = 2.0 * _NORM_SF(np.abs(z))       # two-sided
    out["gi_z"] = z
    out["gi_p"] = p
    out["hotspot_category"] = [_category(zi) for zi in z]
    # 0-100 hotspot score: positive z scaled, clipped (cold spots -> low score)
    out["hotspot_score"] = (_minmax(np.clip(z, 0, None)) * 100).round(2)
    out["is_hotspot"] = (z >= z_threshold).astype(int)
    return out


def _category(z: float) -> str:
    if z >= 2.58:
        return "Hot Spot (99%)"
    if z >= 1.96:
        return "Hot Spot (95%)"
    if z >= 1.65:
        return "Hot Spot (90%)"
    if z <= -2.58:
        return "Cold Spot (99%)"
    if z <= -1.96:
        return "Cold Spot (95%)"
    if z <= -1.65:
        return "Cold Spot (90%)"
    return "Not Significant"


def _minmax(a: np.ndarray) -> np.ndarray:
    a = np.asarray(a, dtype=float)
    lo, hi = a.min(), a.max()
    if hi - lo < 1e-12:
        return np.zeros_like(a)
    return (a - lo) / (hi - lo)


def morans_i(agg: pd.DataFrame, value_col: str = "violations") -> dict:
    """Global Moran's I as a clustering-significance check (APPROACH.md §4.1)."""
    cells = agg["h3"].tolist()
    x = agg[value_col].to_numpy(dtype=float)
    n = len(x)
    if n < 3:
        return {"morans_i": 0.0, "z": 0.0, "interpretation": "insufficient data"}
    idx = {c: i for i, c in enumerate(cells)}
    nbrs = neighbor_weights(cells, k=1)
    z = x - x.mean()
    num, w_sum = 0.0, 0.0
    for c, neigh in nbrs.items():
        i = idx[c]
        for m in neigh:
            if m == c:
                continue
            j = idx[m]
            num += z[i] * z[j]
            w_sum += 1.0
    denom = (z**2).sum()
    moran_i = (n / w_sum) * (num / denom) if w_sum > 0 and denom > 0 else 0.0
    expected = -1.0 / (n - 1)
    return {
        "morans_i": round(float(moran_i), 4),
        "expected": round(expected, 4),
        "interpretation": "clustered" if moran_i > expected else "dispersed",
    }


def gi_star_pysal(agg: pd.DataFrame, value_col: str = "violations") -> pd.DataFrame | None:
    """Optional reference Gi* using esda/libpysal if installed; else None."""
    try:
        import libpysal  # noqa: F401
        from esda.getisord import G_Local
        from libpysal.weights import KNN
    except Exception:
        return None
    coords = list(zip(agg["cell_lat"], agg["cell_lon"], strict=False))
    w = KNN.from_array(np.array(coords), k=6)
    g = G_Local(agg[value_col].to_numpy(dtype=float), w, star=True)
    out = agg.copy()
    out["gi_z_pysal"] = g.Zs
    out["gi_p_pysal"] = g.p_sim
    return out
