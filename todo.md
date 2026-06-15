# Gridlock — TODO / Next Tasks

Status snapshot (current): **deployed & working end-to-end.**
Frontend (Vercel) → `https://gridlock-round2.vercel.app` · Backend (Render) → `https://gridlock-backend.onrender.com`
ML pipeline M1–M5 runs on 298K real records · 17 tests / 84% cov · CI green.

Legend: `[ ]` todo · `[~]` optional/nice-to-have · effort = S/M/L

---

## P0 — Submission-critical (do first)
- [ ] **Demo video / screen recording** (2–3 min) walking the 5 modules — judges love this. (M)
- [ ] **Pitch deck** from `docs/HACKATHON_PITCH.md` (slides: problem → data → 5 modules → live demo → impact). (M)
- [ ] **Decide on the `Co-Authored-By: Claude` trailer** in commit history — keep or strip from all commits (force-push). (S)
- [ ] **Warm the Render backend before judging** — free tier sleeps after ~15 min idle (~50s cold start). Hit `/health` right before the demo, or add an UptimeRobot ping every 10 min. (S)
- [ ] **Smoke-test the live site fresh** (incognito): every page loads data, map renders, simulator slider works. (S)

## P1 — Product & UX
- [ ] **Hotspot detail page/drawer** — the `GET /hotspots/{id}` endpoint (with PCII factor breakdown) exists but no UI consumes it. Wire up click-to-inspect on the map. (M)
- [ ] **Loading / empty / error states** across pages (skeletons + friendly messages instead of blank). (M)
- [ ] **Forecast page: per-cell selector** — let users pick an H3 cell and see its forecast (API already supports `?h3_id=`). (M)
- [ ] **Legend + color scale** on the map (what cyan→magenta means for PCII/hotspot score). (S)
- [ ] **Tasteful visual polish** (the cyberpunk attempt was reverted) — subtle accent, spacing, typography; keep data legible. (M)
- [ ] **Mobile/responsive pass** — sidebar collapse, grid stacking. (M)
- [~] Add a favicon + `public/` assets + social preview image. (S)

## P2 — ML & model upgrades (from APPROACH.md §8, all optional/bonus)
- [ ] **Enable real OSM enrichment** — currently runs in offline fallback (class-based road defaults). Run `osmnx` once with internet so PCII's capacity term uses real lane counts. (M)
- [ ] **HDBSCAN** street-segment clusters layered on Gi* hotspots. (M)
- [ ] **SHAP** explanations surfaced in the forecast UI (`forecast.shap_summary` already implemented). (M)
- [ ] **TFT** multi-horizon quantile forecasting (interpretable intervals). (L)
- [ ] **Difference-in-Differences** causal validation of impact using enforcement actions as treatment. (L)
- [~] **External traffic-API calibration** (HERE/TomTom) for measured "X% slower" headlines — cached, off the live path. (L)
- [~] **RL / ILP patrol allocation** under capacity + travel-time constraints. (L)
- [~] **SUMO micro-sim** digital twin of one real hotspot. (L)

## P3 — Infra & hardening
- [ ] **Tighten CORS** — set `GRIDLOCK_CORS_ORIGINS` on Render to the exact Vercel domain (currently `*`). (S)
- [ ] **Custom domain** on Vercel (optional, looks pro). (S)
- [ ] **Scheduled pipeline refresh** — cron/Prefect job to regenerate `outputs/` and redeploy. (M)
- [ ] **Supabase/PostGIS data layer** — load `outputs/` into the schema in `deployment/supabase_schema.sql`, point backend at `DATABASE_URL`. (L)
- [ ] **Frontend tests** (Playwright/RTL) — currently none; backend has 17. (M)
- [ ] **Monitoring** — UptimeRobot on `/health` + frontend root; wire backend JSON logs to a viewer. (S)

## Tech debt / cleanup
- [ ] Decide whether to commit the 3 gitignored derived parquets (`aggregated_features`, `pcii_scores`, `road_features`) or keep them regenerable. (S)
- [ ] Pin/refresh deps flagged by npm (Next.js security update, recharts v3). (S)
- [ ] Remove unused `accent-sky-400` / leftover theme classes if any after polish. (S)

---

## ✅ Done (reference)
- M1 Gi* hotspots (+ Moran's I), M2 PCII, M3 LightGBM forecast, M4 EPS, M5 what-if simulator
- FastAPI backend (7 endpoints, OpenAPI, logging, CORS) + 17 tests / 84% cov
- Next.js + MapLibre (free, no-token) + Recharts dashboard, 6 pages
- Docs: README, APPROACH, ARCHITECTURE, API, DEPLOYMENT, DATA_DICTIONARY, MODEL_CARD, USER_GUIDE, HACKATHON_PITCH
- Deployed: Vercel (frontend) + Render (backend), CORS verified, API wired
- Repo on GitHub `Manshu555/gridlock-round2`, all commits authored by Manshu, tagged `v1.0.0`
