# Model Card — Gridlock Parking Intelligence

## Overview
A stack of five interpretable models converting parking-violation events into enforcement
intelligence. Designed for transparency and defensibility over black-box accuracy.

## M1 — Hotspot detection (Getis-Ord Gi*)
- **Input:** per-H3-cell violation counts + k-ring adjacency.
- **Output:** z-score, p-value, hotspot category, 0–100 score, binary `is_hotspot` (z ≥ 1.96).
- **Validation:** global **Moran's I = 0.5144** (expected −0.0004) ⇒ clustering is statistically real.
- **On real data:** 2,528 cells, **119 hotspots at 95%**. Top zones reproduce known busy stations
  (Upparpet, City Market, Shivajinagar) — face-valid.
- **Limitations:** subject to patrol sampling bias and the Modifiable Areal Unit Problem (mitigated by H3).

## M2 — Proxy Congestion Impact Index (PCII), 0–100
- **Formula:** `100·(0.35·density + 0.25·capacity_reduction + 0.20·junction + 0.10·footprint + 0.10·persistence)`.
- **Capacity term:** road-physics grounded — ~1 lane lost / available lanes, weighted by severity
  (OSM lane counts, or class-based fallback offline).
- **Nature:** an **estimated** (proxy) impact, NOT measured speed — the dataset has no flow data.
  Every component is stored for explainability (`/hotspots/{id}` returns a factor breakdown).
- **Validation path:** difference-in-differences / external traffic-API calibration (production).

## M3 — Forecasting (LightGBM, sklearn fallback)
- **Target:** next-window daily violation count per cell. **Features:** lags (1/7/14), rolling
  mean/std (7/14), day-of-week, weekend, day, 28-day hotspot history.
- **Eval (temporal 80/20 holdout, real data):** MAE **0.78**, RMSE **3.44**,
  **MASE 0.88** (< 1 ⇒ beats seasonal-naïve). Backend: LightGBM.
- **Explainability:** optional SHAP global importances (`forecast.shap_summary`).
- **Limitations:** ~5-month window limits long-horizon/seasonal capacity; TFT is a documented upgrade.

## M4 — Enforcement Priority Score (EPS)
- **Formula:** `0.5·PCII + 0.3·violation_frequency + 0.2·road_criticality` (each 0–100).
- **Output:** ranked zones with component breakdown. **Top zone (real):** Upparpet, EPS 84.7.

## M5 — What-if enforcement simulation
- **Metric:** `CityImpact = Σ PCII·violations`; enforcing top-K removes a `compliance` fraction.
- **Result (real, top-5, η=0.85):** **16.97%** projected city-impact reduction, 40,736 violations addressed.
- **Interpretation:** a *relative* projection (robust to PCII absolute scale), not a measured outcome.

## Ethical considerations
- Report data reflects **where enforcement already happened** — using it naively can reinforce
  patrol bias. Mitigations: Gi* significance over raw counts, exposure-normalization hooks,
  explicit dashboard disclosure. Outputs are **decision support**, not automated penalties.

## Reproducibility
Deterministic (seed 42), config-driven weights (`ml/parking_intel/config.py`), single-command
pipeline. `requirements.txt` pins the stack; CI enforces lint + 80% test coverage.
