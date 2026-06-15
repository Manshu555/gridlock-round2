# API Reference

Base URL (local): `http://localhost:8000` — interactive docs at `/docs` (Swagger) and `/redoc`.

All responses are JSON; `/hotspots` returns GeoJSON `FeatureCollection`.

## Endpoints

### `GET /health`
Liveness + data availability.
```json
{ "status": "ok", "version": "0.1.0", "data_available": true, "n_cells": 2528 }
```

### `GET /hotspots`
GeoJSON of all H3 cells (hexagon polygons) with hotspot properties.

| Query param | Type | Default | Description |
|---|---|---|---|
| `significant_only` | bool | `false` | Only Gi* significant (95%) cells |
| `min_score` | float 0–100 | `0` | Minimum `hotspot_score` |

Feature properties: `h3, violations, gi_z, gi_p, hotspot_category, hotspot_score, is_hotspot, pcii, police_station, top_violation`.

### `GET /hotspots/{h3_id}`
Detail for one cell, including a PCII `pcii_breakdown` (weighted factor contributions). `404` if unknown.

### `GET /priority-zones`
Ranked enforcement queue (EPS).

| Query param | Type | Default | Range |
|---|---|---|---|
| `limit` | int | `50` | 1–500 |

Returns a list of `{ priority_rank, h3, police_station, eps, pcii, violations, hotspot_category, road_class, eps_*_component }`.

### `GET /forecast`
LightGBM forecast points + metrics.

| Query param | Type | Default | Description |
|---|---|---|---|
| `h3_id` | str | – | Filter to one cell |
| `limit` | int | `500` | 1–5000 |

```json
{ "available": true,
  "metrics": { "backend": "lightgbm", "mae": 0.78, "rmse": 3.44, "mase_vs_seasonal_naive": 0.88 },
  "points": [ { "h3": "...", "date": "2024-03-01", "violations": 12, "prediction": 11.4 } ] }
```

### `GET /simulation`
What-if: enforce top-K zones by EPS → projected city-impact reduction.

| Query param | Type | Default | Range |
|---|---|---|---|
| `k` | int | `5` | 1–100 |
| `compliance` | float | `0.85` | 0–1 |

```json
{ "k": 5, "ranked_by": "eps", "cells_cleared": 5, "compliance_factor": 0.85,
  "city_impact_before": 14875557.72, "city_impact_after": 12351428.5,
  "absolute_reduction": 2524129.22, "reduction_pct": 16.97,
  "violations_addressed": 40736, "cleared_cell_ids": ["8960145b553ffff", "..."] }
```

### `GET /analytics`
`{ "metrics": {...}, "data_profile": {...} }` — summary metrics + dataset profile for charts.

## Errors
Standard HTTP codes. `404` (unknown cell), `503` (pipeline outputs/EPS not yet computed),
`500` (unhandled — logged, generic body `{ "detail": "Internal server error" }`).

## curl examples
```bash
curl localhost:8000/health
curl "localhost:8000/hotspots?significant_only=true"
curl "localhost:8000/priority-zones?limit=10"
curl "localhost:8000/simulation?k=10&compliance=0.9"
```
