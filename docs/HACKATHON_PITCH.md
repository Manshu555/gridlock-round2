# Hackathon Pitch — Gridlock

## The problem
On-street illegal parking near markets, metros, schools and hospitals silently chokes Bengaluru's
carriageways. Enforcement today is **reactive and blind**: no view of *where* the worst hotspots are,
*how much* they hurt traffic, *when* the next one forms, or *which* to enforce first.

## What we built
An end-to-end **Parking Intelligence Platform** that turns 298,450 real violation records into a
ranked, forecasted, impact-weighted enforcement plan — and lets officers *simulate* the payoff before
sending a single patrol.

## The five answers (one platform)
1. **WHERE** — Getis-Ord Gi* finds **119 statistically significant hotspots** (Moran's I = 0.51,
   clustering is real, not noise).
2. **HOW MUCH** — a transparent, road-physics-grounded **Proxy Congestion Impact Index (0–100)** —
   honest about being an *estimate*, with a clear path to measured impact.
3. **WHEN** — **LightGBM** forecast of the next hotspot window: **MASE 0.88** (beats seasonal-naïve).
4. **WHICH FIRST** — **Enforcement Priority Score** ranks zones; #1 is Upparpet (EPS 84.7).
5. **WHAT IF** — clearing the **top-5 zones is projected to cut city-wide impact ~17%** (40,736
   violations addressed) — a digital-twin feel with zero simulator setup.

## Why we win
- **Most teams stop at a heatmap.** We close the full loop: detect → quantify → forecast → prioritize
  → simulate → act, on a live GIS dashboard.
- **Grounded in the real dataset**, with real, defensible metrics — not a toy demo.
- **Intellectually honest** about the data's biggest gap (no traffic-flow data) and engineered a
  credible proxy + validation path around it. Judges reward teams that know what their data can justify.
- **Production-shaped, not a notebook**: FastAPI + Next.js + Docker + CI + 84% test coverage +
  deploy configs for Render/Vercel/Supabase.

## 90-second demo script
1. **Dashboard** — "298K violations, 119 significant hotspots, here's the city in one view."
2. **Hotspots** — toggle *significant-only*; "Gi*, validated by Moran's I — these reds are real."
3. **Forecast** — "LightGBM predicts next week, MASE 0.88, beats the naïve baseline."
4. **Priority Zones** — "Objective ranked queue — Upparpet is tomorrow's #1."
5. **Simulator** — drag to top-5: "**enforcing these five is projected to cut impact 17%.**"
6. Close: "Detect, quantify, forecast, prioritize, simulate — deployed, tested, documented."

## Tech at a glance
H3 · Getis-Ord Gi* · OSMnx · LightGBM/SHAP · FastAPI · Next.js + MapLibre GL (free basemap) · PostGIS · Docker · GitHub Actions.

## What's next
External traffic-API calibration (measured "X% slower"), TFT multi-horizon forecasting, DiD causal
validation, RL-based patrol allocation, live streaming ingest. See `APPROACH.md` §8.
