# User Guide

For traffic-police operators and command-centre analysts. No coding required to *use* the dashboard.

## The six screens

### 1. Dashboard
At-a-glance KPIs (violations analyzed, significant hotspots, mean PCII, projected impact reduction
from enforcing the top 5), a city impact map, and the current top-10 enforcement zones.

### 2. Hotspots
The Gi* significance map. Toggle **"Significant only (95%)"** to show only statistically confirmed
hotspots. Switch coloring between **Hotspot score** (where violations cluster) and **Congestion
impact / PCII** (where they hurt traffic most). Click a hexagon to inspect it.

### 3. Forecast
LightGBM forecast of violation intensity for the upcoming window, with model quality metrics
(MAE / RMSE / MASE). The chart overlays predicted vs. actual for the holdout period — use it to
judge how far ahead to trust the model.

### 4. Priority Zones
The ranked enforcement queue (EPS). Each row shows the police station, EPS, PCII, violation count,
road class, and hotspot category. **Work top-down**: row 1 is where the next patrol delivers the
most benefit.

### 5. Simulator
Drag **"Enforce top-K zones"** and **"Compliance factor"** to see the **projected city-wide impact
reduction** and a before/after bar. Use it to justify resourcing: *"Clearing the top 5 zones is
projected to cut parking-induced congestion impact ~17%."*

### 6. Analytics
Descriptive charts: top violation types, busiest police stations, monthly trend — for situational
awareness and reporting.

## How to read the scores

| Score | Range | Meaning |
|---|---|---|
| **Hotspot score / Gi* category** | 0–100 / 90–99% | Statistical confidence this is a real cluster |
| **PCII** | 0–100 | Estimated congestion impact (higher = worse) |
| **EPS** | 0–100 | Enforcement priority (higher = act sooner) |

## Important caveats
- The data is **patrol-collected**: a quiet area on the map may simply be under-patrolled, not
  violation-free.
- **PCII is an estimate**, not a measured speed drop. It is grounded in road geometry and violation
  mix; use it to *rank* and *compare*, validated against on-ground knowledge.
- Use outputs as **decision support**, not as automatic penalties.

## Typical daily workflow
1. Open **Priority Zones** → take the top N for today's patrol capacity.
2. Cross-check on **Hotspots** (significant-only) and click cells for the violation/vehicle mix.
3. Glance at **Forecast** for zones expected to flare up tomorrow.
4. Use **Simulator** in briefings to communicate expected impact.
