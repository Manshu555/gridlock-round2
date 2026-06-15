# APPROACH.md — AI-Driven Parking Intelligence for Congestion Visibility

**Problem Statement:** *Poor Visibility on Parking-Induced Congestion*
**Context:** National-level Smart-City / Intelligent-Transportation-Systems (ITS) hackathon
**Dataset:** `jan to may police violation_anonymized791b166.csv` — 298,450 anonymized Bengaluru
Traffic-Police parking-violation records (Nov 2023 → Apr 2024)
**Document type:** Research-backed, implementation-ready architecture specification

> This is the engineering source-of-truth. A team of 3–5 can implement directly from it. Every
> design decision is justified with mathematical reasoning, tradeoff analysis, and the constraints
> of the *actual* dataset (profiled below, not assumed).

---

## Table of Contents

0. [Executive Summary](#0-executive-summary)
1. [Problem Decomposition](#1-problem-decomposition)
2. [Academic Literature Review](#2-academic-literature-review)
3. [Industry Systems Review](#3-industry-systems-review)
4. [Method Comparison & Selection](#4-method-comparison--selection)
5. [Dataset Analysis Framework](#5-dataset-analysis-framework)
6. [Proposed Solution Architecture](#6-proposed-solution-architecture)
7. [Implementation Plan (7 Phases)](#7-implementation-plan-7-phases)
8. [Hackathon Strategy](#8-hackathon-strategy)
9. [Tech Stack & Rationale](#9-tech-stack--rationale)
10. [Evaluation & KPIs](#10-evaluation--kpis)
11. [Appendix](#11-appendix)

---

## 0. Executive Summary

### 0.1 The problem in one paragraph

On-street illegal and spillover parking near commercial strips, metro/transit hubs, markets,
schools, hospitals, and event venues **reduces effective carriageway width**, which collapses road
capacity non-linearly and produces bottlenecks and intersection spillback. Enforcement today is
**patrol-based, reactive, and blind**: authorities cannot see *where* violations cluster, *how much*
traffic they actually degrade, *when* the next hotspot will form, or *which* zone to send the next
patrol to. The result is wasted enforcement capacity and persistent, avoidable congestion.

### 0.2 What we are building

A **five-module parking-intelligence platform** that turns a stream of geocoded violation records
into prioritized, explainable enforcement action:

| Module | Capability | Core technique | Output |
|---|---|---|---|
| **M1 Hotspot Detection** | *Where* are illegal-parking hotspots? | H3 binning + **Getis-Ord Gi\*** (primary); HDBSCAN optional bonus | Statistically-significant hotspot polygons/cells |
| **M2 Congestion Impact** | *How much* do they degrade traffic? | **OSM-grounded Proxy Impact Index** (0–100) + **what-if enforcement simulation**; causal/DiD for validation | Per-hotspot impact score + projected reduction |
| **M3 Forecasting** | *When/where* will hotspots form next? | **LightGBM** (MVP) → **Temporal Fusion Transformer** (advanced) | Next-window risk per cell |
| **M4 Prioritization** | *Where* to enforce first? | Multi-factor weighted **Enforcement Priority Score (EPS)** | Ranked enforcement queue |
| **M5 Visualization** | *Show* authorities | Kepler.gl / deck.gl + Streamlit/React, time-slider | Interactive operational dashboard |

### 0.3 The single most important design decision — and our headline differentiator

**The dataset contains *no* traffic-flow, speed, density, or travel-time fields.** It is a
*violation event log*, not a traffic-sensor feed. Therefore **congestion impact cannot be
*measured* directly — it must be *modeled***. Most competing teams will either (a) ignore impact and
only build a violation heatmap (solving the easy half of the problem), or (b) silently fabricate an
"impact score" with no defensible basis.

**Our differentiator is intellectual honesty plus a defensible, *grounded* proxy:** we build a
transparent, road-physics-grounded **Proxy Congestion Impact Index (PCII)** from signals that *are*
present (violation density, violation *type* severity, junction proximity, vehicle footprint,
temporal persistence) **and enrich it with OpenStreetMap road geometry (lane count, road width,
functional class, intersection density) so the capacity-reduction term is physically anchored, not
guessed.** We then make the score *actionable* with a lightweight **what-if enforcement simulation**
("clear the top-K hotspots → recompute → aggregate city impact falls X%") that delivers a
digital-twin feel with zero traffic-simulator setup, and we reserve **difference-in-differences**
(enforcement as natural-experiment treatment) and **optional external traffic APIs** for causal
validation. Judges reward teams that know exactly what their data can and cannot justify — this
framing converts a dataset weakness into a credibility advantage.

> **On "expected vs. measured" impact (anticipating the judge's challenge):** PCII is an *estimated*
> impact, and we say so plainly. Its defensibility comes from three layers: (1) **OSM-grounded
> capacity physics** instead of arbitrary weights; (2) a **what-if simulation** that quantifies the
> *relative* benefit of enforcement (robust to absolute-scale uncertainty); (3) a **DiD / external-
> API validation path** that upgrades to *measured* impact the moment flow data is available. We do
> not claim to measure speed we cannot see — we claim a transparent, validated estimate with a clear
> route to ground truth.

### 0.4 Headline recommendations

- **Hotspot detection:** H3 hexagonal aggregation → **Getis-Ord Gi\*** for *statistically significant*
  hotspots (not just dense ones) as the **primary, judge-legible output** (red significant cells).
  KDE for smooth visualization, **Moran's I** to validate clustering is real. **HDBSCAN is an
  optional bonus** (captures street-segment clusters that hex cells can split) — not on the MVP path.
- **Congestion impact (hackathon):** transparent **OSM-grounded Proxy Impact Index** +
  **what-if enforcement simulation** for actionable, relative impact; **LightGBM** as an optional
  learnable refinement. **Production:** difference-in-differences / Spatio-Temporal GNN, and an
  optional external traffic-API pull to convert estimates into *measured* before/after speed.
- **Forecasting (hackathon):** **LightGBM** on engineered spatio-temporal features. **Advanced:**
  **Temporal Fusion Transformer (TFT)** for multi-horizon, multi-cell, interpretable forecasts.
- **Computer vision:** *Not required by this dataset* (no video), but specified as a drop-in
  extension — **RT-DETR / YOLOv11** detection + **ByteTrack** tracking + dwell-time logic +
  **SAM2** lane-mask for obstruction quantification.
- **Stack:** Python + DuckDB/PostGIS + H3 + scikit-learn/LightGBM + FastAPI + Kepler.gl/Streamlit.

---

## 1. Problem Decomposition

The operational goal decomposes into five answerable questions, each mapped to a module, a method
family, and a concrete deliverable:

```
                         ┌─────────────────────────────────────────────┐
                         │   Parking-violation event stream (geocoded)  │
                         └───────────────────────┬─────────────────────┘
                                                 │
   Q1 WHERE are hotspots?            ──►  M1  Spatial statistics (Gi*, HDBSCAN, KDE)
   Q2 HOW MUCH do they hurt flow?    ──►  M2  Proxy impact index + capacity model + causal val.
   Q3 WHEN/WHERE next?               ──►  M3  Spatio-temporal forecasting (LightGBM/TFT)
   Q4 WHERE to enforce first?        ──►  M4  Multi-criteria prioritization (EPS)
   Q5 HOW to act on it?              ──►  M5  Geospatial dashboard + recommendations
```

| # | Question | Why hard today | Module | Primary output |
|---|---|---|---|---|
| Q1 | Where are illegal-parking hotspots? | No spatial intelligence; raw points are unreadable | M1 | Significant hotspot cells + clusters |
| Q2 | How much congestion do they cause? | No flow data; no causal link established | M2 | Impact score 0–100 / hotspot |
| Q3 | Where will hotspots form next? | Enforcement is reactive, never predictive | M3 | Risk forecast per cell per time-window |
| Q4 | Which zone to enforce first? | No objective ranking; gut-feel deployment | M4 | Ranked enforcement queue + patrol plan |
| Q5 | How do authorities consume this? | Spreadsheets, not maps | M5 | Live dashboard with time-slider |

**Design principle — separation of concerns:** each module has a clean typed interface
(GeoDataFrame in → GeoDataFrame/score out) so modules can be built and tested in parallel by
different team members and swapped (e.g., LightGBM → TFT) without touching the others.

---

## 2. Academic Literature Review

For each methodology family we give: **core idea · mathematical intuition · inputs · outputs ·
strengths · weaknesses · scalability · suitability** for *this* problem.

### 2.1 Illegal-parking detection

- **Core idea.** Detect vehicles parked where/when prohibited. Two schools: **vision-based** (CCTV →
  object detection + dwell-time reasoning, e.g., parked > τ seconds in a no-parking polygon) and
  **report/sensor-based** (officer-issued tickets, crowd reports, magnetometer/curb sensors — *our
  dataset is the report-based class*).
- **Math intuition.** Vision: a detection $d=(bbox, cls, t)$ becomes a *violation* if its track's
  spatial centroid stays within a prohibited polygon $P$ for dwell $\Delta t > \tau$ and $cls \in
  \{vehicle\}$. Report-based: each record is already a labeled violation event $(x, y, t, type)$;
  the task shifts from *detection* to *spatial-temporal aggregation and inference*.
- **Inputs.** Vision: video frames + zone masks. Report: geocoded tickets (what we have).
- **Outputs.** Per-event violation labels with location/time/type.
- **Strengths.** Report data is *already validated* by officers → high label precision; no perception
  error. **Weaknesses.** Patrol-sampled → **spatial/temporal sampling bias** (you only see violations
  where officers went); no negative samples (no record ≠ no violation).
- **Scalability.** Report data scales trivially (rows). Vision scales with camera count × GPU.
- **Suitability.** **High** — our dataset is exactly this, so M1–M4 build on report events; vision is
  an optional future sensor that removes sampling bias.

### 2.2 Smart parking systems (occupancy sensing & guidance)

- **Core idea.** Instrument bays/curbs (magnetometers, ultrasonic, cameras, payment data) to know
  real-time occupancy and guide drivers / price dynamically (e.g., SFpark demand-responsive pricing).
- **Math intuition.** Occupancy $o_b(t)\in\{0,1\}$ per bay; block-level occupancy
  $O(t)=\frac{1}{|B|}\sum_b o_b(t)$; pricing controllers target $O^{*}\approx 0.85$ (one free space per
  block) by adjusting tariff via feedback control.
- **Inputs.** Sensor/payment streams. **Outputs.** Occupancy, availability, dynamic price.
- **Strengths.** Ground-truth occupancy; proven congestion/cruising reduction. **Weaknesses.** High
  capex; covers *legal* bays, not *illegal* on-street parking (our problem).
- **Scalability.** Capex-bound; city-block granularity. **Suitability.** **Low-direct** (different
  problem) but **conceptually borrowed**: the "0.85 occupancy → breakdown" idea motivates our
  capacity-degradation impact model.

### 2.3 Traffic congestion prediction

- **Core idea.** Forecast speed/flow/occupancy on links from historical + real-time sensor data.
- **Math intuition.** Classical: speed $v(t)$ as time series → ARIMA/SARIMA. Modern: road network as
  graph $G=(V,E)$, signal $X\in\mathbb{R}^{N\times T\times F}$, learned by **ST-GNN**
  ($H^{(l+1)}=\sigma(\tilde A H^{(l)} W^{(l)})$ stacked with temporal conv/attention; e.g.,
  DCRNN, Graph WaveNet, STGCN).
- **Inputs.** Loop detectors / probe / GPS speeds. **Outputs.** Future link speed/flow/level-of-service.
- **Strengths.** Mature, accurate where sensors exist. **Weaknesses.** *Requires flow data we do not
  have.* **Scalability.** ST-GNN scales to city graphs on GPU. **Suitability.** **Indirect** — we
  *borrow* the graph/spatio-temporal framing for M3 and reserve ST-GNN for the production roadmap when
  flow data is added.

### 2.4 Urban-mobility analytics

- **Core idea.** Mine large mobility logs (taxis, tickets, GPS) for demand patterns, OD flows, anomaly
  detection. **Math intuition.** Spatial binning (grid/H3/geohash) + temporal aggregation + matrix
  factorization / clustering / tensor decomposition over (space × time × type).
- **Inputs/Outputs.** Event logs → patterns, anomalies, demand surfaces.
- **Strengths.** Directly applicable to event logs like ours; no extra sensors. **Weaknesses.**
  Descriptive unless paired with a causal/predictive layer. **Scalability.** Excellent (columnar/OLAP).
- **Suitability.** **Very high** — this is the methodological backbone of M1/M3.

### 2.5 Geospatial hotspot detection

- **Core idea.** Identify locations where event intensity is *significantly* higher than expected
  under spatial randomness — distinct from merely "dense."
- **Math intuition.** Point-process intensity $\lambda(s)$ estimated by **KDE**
  $\hat\lambda(s)=\frac{1}{nh^2}\sum_i K\!\left(\frac{s-s_i}{h}\right)$; significance via
  **Getis-Ord Gi\*** z-scores and **Moran's I** global autocorrelation (Section 4.1).
- **Inputs.** Point events (x,y[,weight]). **Outputs.** Hot/cold significant zones with p-values.
- **Strengths.** Statistically principled; interpretable; lightweight. **Weaknesses.** Sensitive to
  bandwidth/cell size (MAUP — Modifiable Areal Unit Problem). **Scalability.** Excellent.
- **Suitability.** **Very high** — core of M1. Gi\* gives *defensible* hotspots, not arbitrary clusters.

### 2.6 Traffic digital twins

- **Core idea.** A calibrated virtual replica (micro/meso simulation, e.g., SUMO/Aimsun) that mirrors
  the network and supports "what-if" experiments (e.g., *remove* illegal parking on a link → measure
  throughput gain). **Math intuition.** Car-following + lane-change models; macroscopic
  fundamental diagram $q = v\cdot k$ (flow = speed × density), capacity drop when lanes blocked.
- **Inputs.** Network geometry, demand (OD), control. **Outputs.** Simulated speeds/flows under
  scenarios. **Strengths.** Enables *counterfactual* impact estimation without real flow sensors.
  **Weaknesses.** Calibration-heavy; demand data needed. **Scalability.** Compute-bound per scenario.
- **Suitability.** **High as a stretch differentiator** — a SUMO micro-sim of one real hotspot
  ("close the blocked lane → +X% throughput") is a standout demo (Section 8.3).

### 2.7 Intelligent Transportation Systems (ITS)

- **Core idea.** The umbrella: integrated sensing, communication, control (ATMS/ATIS, adaptive
  signals, incident management) for network-wide operations. **Suitability.** Our platform is an **ITS
  decision-support sub-system** — it feeds the enforcement and traffic-management workflow rather than
  controlling signals directly. Framing the solution as an ITS module signals domain maturity to judges.

### 2.8 Parking-occupancy forecasting

- **Core idea.** Predict future occupancy/availability per facility/block. **Math intuition.** Time
  series per location (ARIMA/Prophet) or global ML (LightGBM) or sequence models (LSTM/TFT) with
  calendar + weather + event covariates. **Inputs.** Historical occupancy. **Outputs.** Forecast
  availability. **Suitability.** **Methodologically transferable** — we replace "occupancy" with
  "violation intensity per H3 cell," reusing the exact forecasting toolkit for M3.

### 2.9 Traffic bottleneck analysis

- **Core idea.** Locate and rank recurrent bottlenecks (where demand > capacity) and attribute causes.
  **Math intuition.** Bottleneck activation when arrival rate $A(t) >$ capacity $C$; queue length
  $Q(t)=\int_0^t [A(\tau)-C]^+ d\tau$ (deterministic queueing); a parked vehicle lowers $C$ by removing
  a lane/partial-lane. **Suitability.** **High** — supplies the *physics* behind M2's impact model:
  illegal parking is modeled as a **capacity-reduction event** at a link, and queueing theory converts
  that capacity drop into a delay/impact estimate.

### 2.10 Literature synthesis → what we adopt

| Need | Adopted from literature | Module |
|---|---|---|
| Defensible hotspots | Geospatial hotspot detection (Gi*, KDE, Moran's I) | M1 |
| Impact without flow sensors | Bottleneck/queueing capacity-drop physics + digital-twin counterfactual | M2 |
| Predict next hotspot | Occupancy-forecasting toolkit re-targeted to violation intensity | M3 |
| Spatio-temporal modeling | Urban-mobility analytics + ST-GNN framing (production) | M3 |
| Operational integration | ITS decision-support framing | M5 |

---

## 3. Industry Systems Review

### 3.1 Representative systems

| System / Class | Operator type | What it does | Method | What works | Gaps for *our* problem |
|---|---|---|---|---|---|
| **SFpark** (San Francisco) | City + transit agency | Demand-responsive pricing of metered bays | Sensor occupancy + price feedback | Reduced cruising/double-parking | Legal bays only; no illegal-parking impact scoring |
| **ANPR/CCTV enforcement** (e.g., UK red-routes, India e-challan) | Traffic police | Auto-detect & ticket violations | ANPR + zone rules | Scales ticketing; deters | Detects events, never *quantifies congestion impact* |
| **HERE / TomTom / Google traffic** | Mobility data vendors | Real-time/historic speed & congestion | Probe/GPS aggregation | Network-wide flow truth | Commercial API; no parking-violation linkage |
| **Esri ArcGIS / GIS dashboards** | Municipal GIS | Map & hotspot crime/incident data | Gi*, KDE, spatial joins | Strong geospatial stats & viz | Descriptive; not predictive or impact-aware |
| **Traffic Management Centres (ATMS)** | Transport agency | Incident mgmt, signal control, VMS | Sensor fusion + SCADA | Real-time ops | Parking is a blind spot; reactive |
| **Smart-city parking analytics** (Bosch, Cisco, Kerb, AppyParking) | Vendors / cities | Occupancy + guidance apps | IoT sensors + apps | Driver guidance | Capex-heavy; legal parking; weak on enforcement ROI |
| **Predictive policing platforms** (e.g., hotspot patrol tools) | Police | Forecast crime hotspots, allocate patrols | KDE/risk-terrain + ST models | Proven patrol-allocation framework | Bias risk; not transport-tuned |

### 3.2 What works vs. the persistent gap

**Works:** geospatial hotspot stats (Gi*/KDE) are production-proven; ANPR scales detection; probe
data gives flow truth where licensed; demand-responsive pricing reduces cruising.

**The unfilled gap (our wedge):** **no widely-deployed system closes the loop
violation → quantified congestion impact → prediction → prioritized enforcement.** Detection systems
stop at "a violation occurred." Traffic systems see congestion but never attribute it to parking.
GIS dashboards are descriptive, not predictive. **Our platform's novelty is the *impact attribution +
predictive prioritization* layer that sits between them** — explicitly turning violations into a
ranked, forecasted, impact-weighted enforcement plan.

---

## 4. Method Comparison & Selection

### 4.1 Hotspot detection

**Candidates, mathematics, and tradeoffs.**

| Method | Core math | Output | Noise robustness | Complexity | Pros | Cons |
|---|---|---|---|---|---|---|
| **DBSCAN** | Density reachability: core point if $\lvert N_\varepsilon(p)\rvert \ge minPts$ | Clusters + noise | High (labels noise) | $O(n\log n)$ w/ index | Simple, no #clusters, finds noise | Single global $\varepsilon$ fails on variable density |
| **HDBSCAN** | DBSCAN over all $\varepsilon$ via mutual-reachability MST + condensed cluster tree; persistence-based extraction | Clusters + noise + membership prob. | Very high | $\approx O(n\log n)$ | Variable density, few params (`min_cluster_size`), soft scores | Heavier; less intuitive |
| **OPTICS** | Reachability plot ordering (no single $\varepsilon$) | Ordering → clusters | High | $O(n\log n)$ | Multi-scale structure | Plot extraction fiddly; slower |
| **KDE** | $\hat\lambda(s)=\frac{1}{nh^2}\sum_i K(\frac{s-s_i}{h})$ | Continuous density surface | Smooths noise | $O(n\cdot g)$ grid | Beautiful heatmaps, continuous | Bandwidth $h$ sensitive; no significance test |
| **Getis-Ord Gi\*** | $G_i^{*}=\frac{\sum_j w_{ij}x_j - \bar X\sum_j w_{ij}}{S\sqrt{\frac{n\sum_j w_{ij}^2-(\sum_j w_{ij})^2}{n-1}}}$ → z-score | Per-cell hot/cold significance (p) | High (statistical) | $O(n\cdot \bar k)$ | **Significance, not just density**; map-ready | Needs areal units (MAUP); weight choice |
| **Moran's I** | $I=\frac{n}{\sum_{ij}w_{ij}}\frac{\sum_{ij}w_{ij}(x_i-\bar x)(x_j-\bar x)}{\sum_i (x_i-\bar x)^2}$ | One global autocorrelation stat | n/a | $O(n\cdot \bar k)$ | Confirms clustering is real | Global only (use Local Moran/LISA for local) |

**Recommendation (decision) — MVP core vs. bonus:**
1. **[CORE] Aggregate events to H3 hexagons** (resolution 8–9 ≈ 460 m / 175 m edge) → fixes point
   sparsity, gives uniform areal units, controls MAUP, and is the spatial primitive everywhere downstream.
2. **[CORE] Getis-Ord Gi\*** on H3 cell counts → *statistically significant* hotspots (z-score,
   p-value). **This is THE primary hotspot output.** It answers "significantly more than random,"
   which a judge/officer reads instantly as **red significant cells** — far more legible than a
   density blob, and it carries a p-value they can trust.
3. **[CORE] KDE** → smooth heatmap layer for the dashboard (visual only).
4. **[CORE] Moran's I (global) + Local Moran/LISA** → validate that clustering is statistically real
   and locate High-High clusters; cheap credibility check.
5. **[BONUS] HDBSCAN** on raw `(lat, lon)` (haversine) → event-level clusters at native resolution to
   capture **street-segment hotspots that hex cells can split**, with soft membership for ranking.
   Valuable, but *not on the MVP critical path* — add it only after M1–M5 work end-to-end.

> **Design note (hackathon vs. research).** Gi\* on H3 alone is enough to *win*: it is rigorous,
> map-ready, and instantly interpretable. HDBSCAN is academically excellent and stays in the toolbox,
> but layering both on the MVP risks confusing judges with two overlapping "hotspot" definitions.
> **Lead with Gi\* significant cells; present HDBSCAN as a refinement, not a competing answer.**
>
> **Why not just DBSCAN?** Bengaluru violation density varies enormously (City Market vs. suburb); a
> single $\varepsilon$ either shatters dense cores or merges everything. HDBSCAN's multi-scale
> handling is strictly better when clustering *is* used; Gi\* adds the significance layer DBSCAN lacks.

### 4.2 Congestion-impact estimation

| Method | Idea | Needs flow data? | Accuracy | Practicality | Interpretability |
|---|---|---|---|---|---|
| Statistical correlation | corr(violations, congestion) | **Yes** | Low (no causation) | High | High |
| Linear/Poisson regression | impact ~ features | Yes (for target) | Medium | High | High |
| **XGBoost / LightGBM / CatBoost** | GBDT impact ~ features | Yes (for target) | High | **Very high** | Medium (+SHAP) |
| **Causal inference / DiD** | Compare treated vs control over time | Partial | High (causal) | Medium | High |
| Counterfactual (digital twin) | Simulate "no parking" scenario | No (simulated) | Scenario-dependent | Medium | High |
| **GNN / ST-GNN** | Learn network spatio-temporal effects | **Yes (heavy)** | **Highest** | Low (data+GPU) | Low |

**The honest constraint:** we have **no measured congestion target**. So a supervised regressor has
*nothing to fit* unless we (a) inject an external flow proxy or (b) define a transparent index.

**Recommendation (decision) — a 3-tier defensibility ladder:**

- **Tier 1 [CORE, hackathon] → OSM-grounded Proxy Congestion Impact Index (PCII, 0–100).** The
  capacity-reduction term is anchored in **real road geometry pulled from OpenStreetMap via OSMnx**
  (lane count, road width, functional class, intersection density), so the score is
  `Violation Density × Road-Capacity-Reduction × Junction Importance` — *physically defensible*, not
  arbitrary weights. **This is the single most important upgrade to credibility** and runs offline
  after a one-time OSM download. Paired with the **what-if enforcement simulation** (§6.2), it turns
  "expected impact" into an *actionable, relative* statement judges accept.
- **Tier 2 [BONUS, even stronger if time/keys allow] → external traffic-API calibration.** Sample
  **HERE / TomTom / Google** speed at the top-K hotspots to produce headline claims like *"Hotspot A
  sees ~17% lower average speed at peak."* **Two honest caveats, stated up front:** (a) free tiers
  rarely expose *retroactive historical* before/after speed, and a live API adds a demo dependency
  that can fail on stage — so keep it off the critical path and cache any pulled numbers; (b) a raw
  before/after gap is **correlational, not causal** — attribute it via the DiD design below, never as
  a bare "parking caused X%."
- **Tier 3 [PRODUCTION] → Difference-in-Differences** (enforcement action as treatment: did
  speeds/complaints improve on enforced links vs. matched controls?) for *causal* impact, escalating
  to **ST-GNN** once link-level flow sensors exist.
- **Most accurate (if flow data existed):** ST-GNN. **Most practical now:** OSM-grounded PCII +
  what-if simulation (+ optional LightGBM refinement / API calibration).

### 4.3 Forecasting (future hotspot formation)

| Model | Class | Multi-series? | Covariates? | Horizon | Notes |
|---|---|---|---|---|---|
| ARIMA | Linear stat | No (per cell) | Hard | Short | Baseline; per-cell fitting costly at scale |
| SARIMA | + seasonality | No | Hard | Short | Captures weekly/daily seasonality |
| Prophet | Decomposition | No | Yes (holidays) | Med | Robust, fast, interpretable; weak cross-series learning |
| **XGBoost/LightGBM** | GBDT (global) | **Yes** | **Yes** | Any (recursive/direct) | **Best MVP**: one model all cells, fast, strong w/ lag features |
| LSTM | RNN | Yes | Yes | Med-long | Needs data/tuning; no built-in interpretability |
| **TFT** | Attention seq2seq | **Yes** | **Yes (static+known+observed)** | **Multi-horizon** | **Best advanced**: quantiles + variable importance |
| Informer | Sparse attn transformer | Yes | Yes | Long | Long-horizon efficiency; heavier |
| PatchTST | Patch transformer | Yes | Limited | Long | SOTA long-horizon univariate-ish |

**Recommendation (decision):**
- **MVP → LightGBM** global model: target = violation count (or hotspot binary) per H3 cell per
  time-window; features = lags, rolling means, calendar, cell static attributes. One model, trains in
  seconds, naturally multi-series, handles covariates, SHAP-explainable.
- **Advanced → Temporal Fusion Transformer (TFT):** multi-horizon **quantile** forecasts (gives
  prediction intervals → risk, not just point), native handling of static/known-future/observed
  covariates, and built-in **variable-importance + attention** interpretability (great for judges).
- **Production →** TFT (or PatchTST/Informer for long horizons) in an ensemble with LightGBM;
  retrain on schedule.

### 4.4 Computer vision (extension — *no video in this dataset*)

Specified for completeness and as a future sensor that removes patrol sampling bias. Compared:

| Model | Role | Strengths | Tradeoffs |
|---|---|---|---|
| **YOLOv11** | Detector | Real-time, edge-deployable, strong small-object | Anchor/NMS tuning; license (AGPL) |
| **RT-DETR** | Detector (DETR) | NMS-free, real-time transformer, clean training | Heavier than YOLO at equal FPS |
| **Grounding DINO** | Open-vocab detector | Text-prompt ("scooter on footpath") zero-shot | Slow; not real-time |
| **SAM2** | Segmentation | Precise masks + video propagation | Compute; needs prompts |
| **DeepSORT** | Tracker | Appearance + motion ReID | Slower; ID switches under occlusion |
| **ByteTrack** | Tracker | Fast, SOTA MOTA, uses low-conf boxes | Motion-only (no appearance ReID) |

**Recommended CV pipelines:**

```
Vehicle detection :  frame → RT-DETR/YOLOv11 → {bbox, class, conf}
Illegal parking   :  detections → ByteTrack (tracks) → dwell-time τ in no-parking polygon → violation
Parking duration  :  per track: duration = t_last_in_zone − t_first_in_zone
Road obstruction  :  SAM2/SegFormer lane mask ∩ parked-vehicle mask → % lane blocked → feeds M2 capacity drop
```

- **Detection:** **YOLOv11** for edge/real-time on RTSP camera feeds; **RT-DETR** where NMS-free
  cleanliness and crowded scenes matter. **Tracking:** **ByteTrack** (speed + handles low-confidence
  boxes in dense traffic). **Open-vocab (Grounding DINO)** only for rapid prototyping of new
  violation classes without retraining. **SAM2** to *measure lane blockage %*, which is the **direct
  physical input to M2's capacity-drop model** — closing the loop from pixels to congestion impact.

---

## 5. Dataset Analysis Framework

> Grounded in the **actual** profiled dataset (298,450 rows, Nov 2023 → Apr 2024), not assumptions.

### 5.1 Real data dictionary & feature-class mapping

The file has 24 columns. We classify each into the four feature families the problem expects
(Parking / Traffic / Road-network / Context) and mark each as present (✅), partial (◐), or
**absent (❌, needs enrichment)**.

| Column | Example | Feature family | Status | Use |
|---|---|---|---|---|
| `id` | `FKID000000` | — | ✅ | Primary key |
| `latitude`, `longitude` | `12.9255, 77.6186` | Parking (spatial) | ✅ 100% present | H3 indexing, clustering, all geo joins |
| `location` | "18th Main Rd, Koramangala…" | Context | ✅ | Reverse-geocode sanity; geofence labels |
| `vehicle_number` / `updated_vehicle_number` | `FKN00GL0000` | Parking | ✅ (anon) | Repeat-offender counts (anonymized) |
| `vehicle_type` / `updated_vehicle_type` | `CAR`, `SCOOTER` | Parking | ✅ | Vehicle-footprint weight in M2 |
| `description` | `NULL` | — | mostly NULL | Ignore / free-text NLP (optional) |
| `violation_type` | `["WRONG PARKING","NO PARKING"]` | Parking | ✅ (JSON array) | Severity weighting; multi-label |
| `offence_code` | `[112,104]` | Parking | ✅ | Canonical code for severity map |
| `created_datetime` | `2023-11-20 00:28:46+00` | Parking (temporal) | ✅ | Event time → all temporal features |
| `closed_datetime` | `NULL` | Enforcement | ◐ partial | Resolution-latency (where present) |
| `modified_datetime` | timestamp | Enforcement | ✅ | Processing lag |
| `action_taken_timestamp` | `NULL`/ts | Enforcement | ◐ partial | Enforcement-latency feature |
| `validation_timestamp` | ts | Enforcement | ◐ | Validation lag |
| `validation_status` | `approved`/`rejected`/`NULL` | Enforcement | ✅ | Quality filter; precision of zone |
| `device_id`, `created_by_id` | `FKDEV/FKUSR` | Context | ✅ | Patrol-effort/exposure proxy (bias control) |
| `center_code` | `9` | Context | ✅ | Admin aggregation |
| `police_station` | `Madiwala`, `Upparpet` | Context (admin zone) | ✅ | Enforcement-zone rollup (M4) |
| `data_sent_to_scita`(+`_timestamp`) | `TRUE` | Enforcement | ✅ | Pipeline flag |
| `junction_name` | `BTP051 - Safina Plaza Jn` | Road-network | ◐ ~50% | **Junction-proximity proxy** (M2) |
| **Speed / flow / density / travel-time** | — | **Traffic** | **❌ ABSENT** | **Must proxy/enrich (see 5.4)** |
| **Lanes / road width / functional class** | — | **Road-network** | **❌ ABSENT** | **Enrich via OSM (see 5.4)** |
| **Weather / events / POI** | — | **Context** | **❌ ABSENT** | **Enrich via APIs (see 5.4)** |

### 5.2 Real distributions (profiled — embed in dashboard & report)

**Violation types** (multi-label JSON; counts of label occurrences):

| Violation type | Count | Share | Congestion severity (M2 weight, see 6.2) |
|---|---:|---:|:--:|
| WRONG PARKING | 164,977 | 47.4% | High |
| NO PARKING | 139,050 | 39.9% | High |
| PARKING IN A MAIN ROAD | 23,943 | 6.9% | **Very High** (carriageway) |
| DEFECTIVE NUMBER PLATE | 7,848 | 2.3% | Low (non-spatial) |
| PARKING ON FOOTPATH | 3,757 | 1.1% | Medium (pedestrian safety) |
| PARKING NEAR BUSTOP/SCHOOL/HOSPITAL | 2,403 | 0.7% | **Very High** (safety) |
| DOUBLE PARKING | 2,037 | 0.6% | **Very High** (lane block) |
| PARKING NEAR ROAD CROSSING | 1,687 | 0.5% | Very High |
| PARKING NEAR TRAFFIC LIGHT/ZEBRA | 525 | 0.15% | Very High |

**Vehicle types:** SCOOTER 94,856 · CAR 88,870 · MOTOR CYCLE 40,811 · PASSENGER AUTO 37,813 ·
MAXI-CAB 11,372 · LGV 8,255 · GOODS AUTO 2,934 … → **footprint weighting**: 2-wheelers block less
carriageway than CAR/LGV/MAXI-CAB, a direct M2 input.

**Top enforcement zones (police_station):** Upparpet 34,468 · Shivajinagar 28,044 · Malleshwaram
22,200 · HAL Old Airport 20,819 · City Market 17,646 · Vijayanagara 14,652 · Rajajinagar 10,998 …
→ these are the *empirical* hotspot regions M1 must reproduce statistically and M4 must rank.

**Monthly volume:** 2023-11: 44,119 · 2023-12: 63,555 · 2024-01: 65,813 · 2024-02: 54,650 ·
2024-03: 55,231 · 2024-04: 15,082 (partial month).

**Validation status:** approved 115,400 · rejected 49,754 · NULL 125,254 · created1 7,044 ·
processing 678 · duplicate 320.

**Junctions:** ~147,880 "No Junction"; named hotspots include Safina Plaza, KR Market, Elite, Sagar
Theatre, Central Street junctions.

### 5.3 Cleaning, missing-value handling, feature generation, aggregation

**Cleaning**
- Parse `violation_type` / `offence_code` JSON arrays → explode to multi-label boolean columns.
- Normalize timestamps to a single tz (IST), drop tz-aware/naive mismatches; derive `hour`,
  `dayofweek`, `is_weekend`, `month`, `is_holiday` (Indian calendar).
- Validate coordinates inside Bengaluru bounding box; drop/flag out-of-bounds.
- De-duplicate on `(vehicle_number, location, created_datetime)`; respect `validation_status=duplicate`.
- **Data-quality flags (must be documented):** (i) filename says "jan to may" but `created_datetime`
  spans **Nov 2023 → Apr 2024** — reconcile or relabel; (ii) `validation_status` NULL on 125,254 rows
  → treat as "unverified," analyze approved-only vs all in parallel; (iii) `closed/action_taken`
  largely NULL → enforcement-latency available only on the labeled subset.

**Missing values**
- Spatial: none (lat/lon complete). Categorical (`junction_name`="No Junction"): keep as explicit
  category (it is informative — mid-block vs. junction). Enforcement timestamps: model
  missingness explicitly (missing-indicator features), never impute a fake latency.

**Feature generation** (per event, then aggregated to H3 cell × time-window)
- *Temporal:* hour, dow, weekend, month, holiday, peak/off-peak flag, time-since-last-violation in cell.
- *Spatial:* `h3_index` (res 8 & 9), cluster id (HDBSCAN), distance-to-nearest-junction, neighbor-cell counts.
- *Severity:* per-violation weight $w_{type}$ (table 5.2) and vehicle footprint $f_{veh}$.
- *Enforcement:* validation rate, rejection rate, latency (where present), patrol-exposure proxy
  (`device_id`/`created_by_id` activity) to **debias** intensity (see 5.5).
- *Recurrence:* rolling 7/14/28-day violation counts per cell; persistence ratio.

**Aggregation grain:** primary analytical unit = **(H3 res-9 cell × 1-hour or 1-day bin)**. Rollups to
res-8, police_station, and junction for reporting.

### 5.4 External-context integration strategy (enrichment — optional, improves M2/M3)

| Layer | Source | Join key | Feeds |
|---|---|---|---|
| Road network (lanes, width, functional class, geometry) | **OpenStreetMap via OSMnx** | nearest-edge spatial join to (lat,lon) | M2 capacity model, road-criticality (M4) |
| POI (metro, schools, hospitals, markets, malls) | OSM / city open data | distance features | Context risk, M2 safety weight, M4 |
| Events (rallies, festivals, matches) | City calendar / news scrape | date + geofence | M3 covariate, anomaly explanation |
| Weather (rain) | IMD / OpenWeather | timestamp | M3 covariate (rain ↑ violations/impact) |
| Real traffic speed (validation only) | HERE/TomTom/Google sampled | link + time | **M2 causal calibration / DiD** |

All enrichment is **strictly optional**: the MVP runs fully offline on the CSV. Enrichment is the
"advanced" upgrade path and is where external traffic data (if later provided) plugs in.

### 5.5 Sampling-bias caveat (must be stated)

Report-based data is **patrol-sampled**: absence of records ≠ absence of violations; high counts may
reflect *more enforcement*, not *more violation*. We mitigate by (a) normalizing intensity by a
patrol-exposure proxy (`device_id`/officer activity per cell), (b) reporting Gi\* significance rather
than raw counts, and (c) flagging this explicitly in the dashboard. This caveat is a credibility
signal, not a weakness to hide.

---

## 6. Proposed Solution Architecture

### 6.1 System diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA & FEATURE LAYER                                       │
│  violations.csv ──► Ingest/Clean (pandas/DuckDB) ──► H3 index (res 8/9) ──► Feature     │
│   + OSM roads (CORE: lanes/width/class)   [BONUS: POI, events, weather, API speed]  Store│
└───────────────┬───────────────────────────────────────────────────────────┬──────────┘
                │                                                             │
   ┌────────────▼───────────┐   ┌──────────────────────────┐   ┌─────────────▼──────────┐
   │ M1 HOTSPOT DETECTION    │   │ M2 CONGESTION IMPACT      │   │ M3 FORECASTING          │
   │ H3 + Getis-Ord Gi* (core)──►│ OSM-grounded PCII (0–100) │   │ LightGBM (MVP)          │
   │ + KDE + Moran           │   │ + WHAT-IF sim (enforce K) │   │ → TFT (bonus)           │
   │ [bonus: HDBSCAN]        │   │ [bonus: DiD/API validate] │   │ OUT: per-cell risk t+1  │
   │ OUT: significant cells  │   │ OUT: impact + Reduction%  │   │                         │
   └────────────┬───────────┘   └────────────┬─────────────┘   └─────────────┬──────────┘
                │                             │                               │
                └──────────────┬──────────────┴───────────────┬──────────────┘
                               ▼                              ▼
                    ┌──────────────────────────┐   (forecast feeds priority)
                    │ M4 ENFORCEMENT PRIORITY   │◄──────────────────────────────┐
                    │ EPS = weighted(freq,      │                               │
                    │   impact, road-crit,      │   feedback: enforcement       │
                    │   safety, recurrence,     │   outcomes → DiD → recalibrate │
                    │   forecast risk)          │───────────────────────────────┘
                    │ OUT: ranked patrol queue  │
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────────────────────────┐
                    │ M5 VISUALIZATION (Kepler.gl/deck.gl + API)     │
                    │ heatmaps · risk maps · impact · time-slider ·  │
                    │ ranked recommendations · drill-down            │
                    └──────────────────────────────────────────────┘
```

The diagram above is the **production superset**. For the **hackathon**, build this **linear MVP
spine** first and add bonuses only once it runs end-to-end:

```
   ┌─────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐
   │ Dataset │──►│ Cleaning │──►│ H3 Aggregation│──►│ Gi* Hotspot   │──►│ OSM Enrichment   │
   │  (CSV)  │   │  + parse │   │  (res 8/9)    │   │ Detection     │   │ lanes/width/class│
   └─────────┘   └──────────┘   └──────────────┘   └──────────────┘   └────────┬─────────┘
                                                                                 ▼
   ┌──────────────────┐   ┌──────────────────────┐   ┌──────────────────┐   ┌──────────────────────┐
   │ Interactive       │◄──│ Enforcement Priority │◄──│ LightGBM         │◄──│ Proxy Congestion     │
   │ Dashboard         │   │ Score (EPS) + ranked │   │ Forecasting      │   │ Impact (PCII) +      │
   │ + What-If slider  │   │ patrol queue         │   │ (next window risk)│   │ what-if simulation   │
   └──────────────────┘   └──────────────────────┘   └──────────────────┘   └──────────────────────┘

   [BONUS layers, add after MVP works]:  HDBSCAN clusters · TFT forecasting ·
                                         SUMO digital-twin · external traffic-API calibration · DiD causal
```

> **Why this ordering wins:** every box is a small, demoable deliverable; the spine alone answers
> *where → how much → when → act → show*. Bonuses are strictly additive — none is on the critical
> path, so a 3–5 person team always has a complete system to present even if time runs out.

### 6.2 Module-by-module specification

---

#### Module 1 — Illegal-Parking Hotspot Detection

- **Input.** Cleaned violation events `(id, lat, lon, t, violation_type[], vehicle_type, weights)`.
- **Processing.**
  1. Index every event to **H3 res-9** (and res-8 for coarse view).
  2. Aggregate weighted counts per cell per time-window: $x_i=\sum_{e\in i} w_{type}(e)\,f_{veh}(e)$.
  3. Build spatial weights $W$ (H3 k-ring adjacency, $k{=}1$).
  4. Compute **Getis-Ord Gi\*** z-score & p per cell (Section 4.1 formula) → FDR-correct (Benjamini-Hochberg).
  5. Run **HDBSCAN** (haversine, `min_cluster_size≈25`) on raw points for street-segment clusters.
  6. **KDE** surface for the heatmap; **Moran's I / Local Moran** for global+local validation.
- **Output.** GeoJSON of (a) significant **hot cells** (Gi\* z>1.96, p<0.05) with intensity, (b)
  HDBSCAN cluster polygons with membership strength, (c) KDE raster.
- **Algorithms.** H3 · Getis-Ord Gi\* · HDBSCAN · KDE · (Local) Moran's I.
- **Evaluation.** Spatial **stability** (cluster overlap across train/holdout months via Jaccard);
  **reproduction** of known empirical zones (does Gi\* light up Upparpet/City Market/Shivajinagar?);
  Moran's I significance (p<0.001 expected); silhouette for HDBSCAN.

---

#### Module 2 — Congestion-Impact Quantification (Proxy Impact Index, 0–100)

- **Input.** Hotspot cells (M1) + per-cell violation mix + **OSM road attributes (core)** + junction proximity.
- **OSM enrichment (core, not optional).** Pull the road network once with **OSMnx** for the
  Bengaluru bounding box; spatial-join each violation/cell to its nearest road edge to obtain
  **lane count, road width, functional class (motorway→residential), and intersection density**.
  This is what makes the capacity term *physically grounded* rather than a guessed constant — the
  highest-leverage credibility upgrade in the whole system. Where an edge attribute is missing, fall
  back to **class-based defaults** (e.g., arterial = 2 lanes/direction) and flag it.
- **Feature engineering.** For cell $i$: violation density $\rho_i$ (per km road or per cell), severity
  mix, vehicle-footprint mix, junction proximity, temporal persistence, road functional class &
  lane count (OSM, core), % lane blocked (CV/SAM2 if available).
- **Impact-score formula (PCII).** A transparent, monotone, road-physics-motivated composite,
  each sub-term normalized to [0,1]:

$$
\text{PCII}_i = 100 \cdot \Big( w_1\,\tilde\rho_i + w_2\,\tilde S_i + w_3\,\tilde F_i + w_4\,\tilde J_i + w_5\,\tilde C_i + w_6\,\tilde P_i \Big)
$$

  where
  $\tilde\rho_i$ = normalized violation density,
  $\tilde S_i=\frac{\sum_e w_{type}(e)}{\max}$ severity mix,
  $\tilde F_i$ = vehicle-footprint mix (CAR/LGV > 2-wheeler),
  $\tilde J_i$ = junction/zebra/bus-stop proximity factor,
  $\tilde C_i = 1-\frac{\text{lanes}-\text{blocked}}{\text{lanes}}$ capacity-loss (from OSM lanes ±
  CV blockage; defaults by road class when OSM absent),
  $\tilde P_i$ = temporal persistence (fraction of windows the cell is active),
  and $\sum w_k = 1$ (default $w=[0.25,0.20,0.15,0.15,0.15,0.10]$, tunable / learnable).

- **Capacity-drop grounding (why this is physical, not arbitrary).** From queueing/bottleneck theory,
  a parked vehicle removes effective width; if capacity drops $C \to C'=C(1-\tilde C_i)$ and arrivals
  $A$ persist, delay grows as $D \propto \frac{1}{C'-A}$ near saturation — so impact rises sharply
  when a near-capacity link loses a lane. PCII's $\tilde C_i$, $\tilde\rho_i$, $\tilde J_i$ terms
  encode exactly these drivers. **Optional learnable refinement:** fit **LightGBM** to predict a
  measured proxy (sampled HERE speed drop, or simulated SUMO delay) from these features, then blend:
  $\text{Impact}_i = \alpha\,\text{PCII}_i + (1-\alpha)\,\widehat{\text{LGBM}}_i$.
- **What-If Enforcement Simulation (core differentiator — the "digital-twin feel" without SUMO).**
  Define a **city-level aggregate impact** as exposure-weighted PCII over all hotspot cells:

$$
\text{CityImpact} = \sum_{i} \text{PCII}_i \cdot v_i
\qquad\text{($v_i$ = violation volume / exposure in cell $i$)}
$$

  Simulate enforcing (clearing) a candidate set $K$ of zones — e.g., the **top-K by EPS** (Module 4).
  Clearing a zone zeroes its violation-driven contribution (optionally apply a realistic
  *compliance factor* $\eta\in[0,1]$ for partial deterrence and a *spillover factor* for displaced
  parking), then recompute:

$$
\text{CityImpact}' = \sum_{i\notin K} \text{PCII}_i\, v_i \;+\; (1-\eta)\sum_{i\in K}\text{PCII}_i\, v_i,
\qquad
\text{Reduction\%} = 100\cdot\frac{\text{CityImpact}-\text{CityImpact}'}{\text{CityImpact}}.
$$

  The dashboard exposes a **"enforce top-K" slider** → live "*projected city-wide impact ↓ X%*"
  read-out. This is robust to absolute-scale uncertainty in PCII (it reports a *relative* benefit),
  directly answers the operational question "what do we gain by acting here?", and *feels* like a
  traffic digital twin while needing only a re-summation. **SUMO micro-simulation (§8.3) is optional
  polish on top of this**, not a prerequisite.
- **Causal validation (production).** **Difference-in-Differences:** treat enforcement actions as
  treatment; compare before/after speed (or complaint volume) on enforced cells vs. matched control
  cells: $\hat\tau = (\bar Y^{post}_{treat}-\bar Y^{pre}_{treat}) - (\bar Y^{post}_{ctrl}-\bar Y^{pre}_{ctrl})$.
  This is also how any **external-API "X% slower" claim** must be attributed — never as a bare
  before/after, which confounds time-of-day, events, and weather.
- **Output.** Impact score 0–100 per hotspot + contributing-factor breakdown (explainability) +
  projected `Reduction%` for the chosen enforcement set.
- **Evaluation.** Face validity vs. known choke points; **rank correlation** (Spearman) with any
  external congestion sample; ablation of weight sensitivity; what-if monotonicity/sanity checks;
  DiD significance where applicable.

---

#### Module 3 — Future Hotspot Forecasting

- **Input.** Historical per-cell time series (H3 × time-window) + calendar/weather/event covariates.
- **Training pipeline.** Build supervised frame: target $y_{i,t+h}$ = violation count (regression) or
  hotspot flag (classification) for cell $i$ horizon $h$; features = lags (1,7,14,28-day), rolling
  means/std, calendar, cell static attrs, neighbor activity. **Time-series CV** (expanding window, no
  leakage). **MVP:** LightGBM (one global model). **Advanced:** TFT (quantile loss → P10/P50/P90).
- **Prediction pipeline.** Score all cells for next window(s) → risk = P(hotspot) or expected count;
  threshold/rank → **predicted risk zones**.
- **Output.** Per-cell forecast + prediction interval + risk class for next hour/day/week.
- **Evaluation.** Regression: **MAE, RMSE, MASE** (vs. seasonal-naïve). Classification of "will be
  hotspot": **PR-AUC, F1, Precision@K**, and **hotspot hit-rate** (did top-K predicted cells contain
  next period's true hotspots?). Calibration (reliability curve) for risk probabilities.

---

#### Module 4 — Enforcement Prioritization Engine

- **Goal.** Convert all signals into one ranked, actionable queue under limited patrol capacity.
- **Enforcement Priority Score (EPS).** For cell/zone $i$, each component min-max normalized to [0,1]:

$$
\text{EPS}_i = 100\cdot\big(\beta_1 \tilde V_i + \beta_2 \tilde I_i + \beta_3 \tilde R_i + \beta_4 \tilde S_i + \beta_5 \tilde H_i + \beta_6 \tilde \Phi_i\big)
$$

  | Term | Meaning | Source |
  |---|---|---|
  | $\tilde V_i$ | Violation frequency (recent intensity) | M1 |
  | $\tilde I_i$ | Congestion impact (PCII) | M2 |
  | $\tilde R_i$ | Road criticality (functional class, arterial, bus route) | OSM/M2 |
  | $\tilde S_i$ | Public-safety risk (school/hospital/zebra/bus-stop proximity & violation types) | 5.2/5.4 |
  | $\tilde H_i$ | Historical recurrence/persistence | M1/M3 |
  | $\tilde \Phi_i$ | **Forecast risk** for next window | M3 |
  | weights | default $\beta=[0.25,0.25,0.15,0.15,0.10,0.10]$, policy-tunable, $\sum\beta=1$ | governance |

- **Patrol allocation (advanced).** Given $K$ patrols and travel costs, solve a **budgeted maximum-
  coverage / weighted set-cover** ILP to pick the EPS-maximizing set of zones reachable per shift; or
  an **RL** agent (state = current hotspot/forecast map, action = patrol assignment, reward = impact-
  weighted violations averted) for adaptive allocation.
- **Output.** Ranked enforcement queue with EPS + factor breakdown + suggested time-of-day windows
  (from M3 temporal profile) + recommended patrol routing.
- **Evaluation.** **Precision@K / coverage** (share of next-period high-impact violations captured by
  top-K EPS zones), and a **DiD feedback loop** measuring violation/impact reduction in enforced zones.

---

#### Module 5 — Visualization Layer

- **Design.**
  - **Heatmap** (KDE / H3 choropleth) of violation intensity.
  - **Congestion-impact map** (PCII choropleth, red = high impact).
  - **Predicted-risk map** (M3 forecast, with confidence shading).
  - **Enforcement-recommendation panel:** ranked EPS list, factor breakdown bars, suggested time
    windows, patrol routes on map.
  - **Time-slider** to animate hotspot evolution across hours/days/months.
  - **Drill-down:** click a cell → violation mix, vehicle mix, trend, validation rate, nearby POI.
  - **Filters:** violation type, vehicle type, police station, time range, weekday/weekend.
- **Tech.** MVP = **Streamlit + pydeck/Kepler.gl + Folium**; Advanced = **React + deck.gl + Mapbox**
  front end on a **FastAPI** backend serving precomputed GeoJSON/tiles from PostGIS.
- **Why.** Authorities consume *maps and ranked lists*, not tables; the time-slider makes the
  "predictive, not reactive" story tangible in a live demo.

---

## 7. Implementation Plan (7 Phases)

Effort in **person-hours** for a 3–5 person team; phases overlap where dependencies allow.

### Phase 1 — Data Understanding & EDA
- **Tasks.** Load CSV (DuckDB/pandas); parse `violation_type`/`offence_code` JSON; profile
  distributions (reproduce Section 5.2); timestamp/tz normalization; coordinate bounds check;
  document the data-quality flags (date-range mismatch, NULL validation, patrol bias).
- **Deliverables.** `01_eda.ipynb`, data dictionary, quality report, cleaned `events.parquet`.
- **Dependencies.** None (entry point).
- **Effort.** 6–8 h.

### Phase 2 — Feature Engineering & Spatial Indexing
- **Tasks.** H3 indexing (res 8/9); temporal features; severity & footprint weights; rolling
  recurrence features; (optional) OSM road + POI spatial joins; patrol-exposure debias feature;
  build the **(cell × time-window)** analytical table.
- **Deliverables.** `features.parquet`, reusable `featurize.py`, feature catalog.
- **Dependencies.** Phase 1.
- **Effort.** 8–12 h (+4–6 h if OSM enrichment).

### Phase 3 — Hotspot Detection (M1)
- **Tasks.** **[CORE]** Gi\* on H3 cells (+FDR); KDE surface; Moran's I/LISA validation; export
  GeoJSON layers; stability check across months. **[BONUS]** HDBSCAN on points for street-segment clusters.
- **Deliverables.** `hotspots.geojson`, `m1_hotspots.py`, validation notebook.
- **Dependencies.** Phase 2.
- **Effort.** 6–8 h (core Gi\*) / +2–3 h (HDBSCAN bonus).

### Phase 4 — Congestion-Impact Modeling (M2)
- **Tasks.** **[CORE]** OSM enrichment (lanes/width/class via OSMnx) → capacity term; implement PCII
  formula + normalization (severity/footprint/junction/capacity); weight config; **what-if
  enforcement simulation** (CityImpact + Reduction%). **[BONUS]** LightGBM refinement vs. sampled
  external proxy; SUMO/DiD validation.
- **Deliverables.** `m2_impact.py`, per-hotspot impact table + factor breakdown, what-if module, sensitivity report.
- **Dependencies.** Phase 3 (+ OSM from Phase 2).
- **Effort.** 8–12 h (incl. OSM + what-if).

### Phase 5 — Forecasting (M3)
- **Tasks.** Build supervised frame; time-series CV; train LightGBM (MVP); evaluate MAE/MASE/PR-AUC/
  Precision@K; (advanced) TFT with quantiles; generate next-window risk per cell.
- **Deliverables.** `m3_forecast.py`, model artifact, forecast GeoJSON, eval report.
- **Dependencies.** Phase 2 (history); informs M4.
- **Effort.** 10–14 h (LightGBM) / +8–12 h (TFT).

### Phase 6 — Prioritization Engine (M4) + Dashboard (M5)
- **Tasks.** Implement EPS; combine M1/M2/M3 + road-criticality + safety; (advanced) ILP/RL patrol
  allocation. Build Streamlit/Kepler.gl dashboard: heatmap, impact map, forecast map, ranked queue,
  time-slider, drill-down, filters.
- **Deliverables.** `m4_priority.py`, `app.py` (dashboard), demo script.
- **Dependencies.** Phases 3–5.
- **Effort.** EPS 4–6 h; dashboard 10–16 h.

### Phase 7 — Deployment & Packaging
- **Tasks.** FastAPI service exposing layers/scores; containerize (Docker); scheduled retrain
  (cron/Prefect); README + reproducibility; (production) PostGIS + tiling + monitoring.
- **Deliverables.** `Dockerfile`, `api/`, deployment doc, recorded demo.
- **Dependencies.** All.
- **Effort.** 6–10 h (MVP) / more for production.

| Phase | Critical path? | Parallelizable with | Owner role |
|---|---|---|---|
| 1 EDA | Yes | — | Data eng |
| 2 Features | Yes | 1 (tail) | Data eng |
| 3 Hotspots | Yes | 4 partial | Geo/ML |
| 4 Impact | No (parallel) | 5 | ML/traffic |
| 5 Forecast | Yes | 4 | ML |
| 6 EPS+Dashboard | Yes | — | Full-stack |
| 7 Deploy | No | 6 (tail) | DevOps |

---

## 8. Hackathon Strategy

### 8.1 MVP — the smallest system that can *win* (target ~24 h, the linear spine of §6.1)
1. **EDA + cleaned features** (Phases 1–2, H3 res-9, weights, calendar).
2. **M1 hotspots [CORE]:** **Gi\* significant cells** + KDE heatmap + Moran's I validation.
   *(HDBSCAN is a bonus — skip until the spine works.)*
3. **M2 impact [CORE]:** **OSM-grounded PCII (0–100)** with factor breakdown **+ what-if enforcement
   simulation** ("enforce top-K → city impact ↓ X%"). One-time OSM download, then fully offline.
4. **M3 forecast [CORE]:** **LightGBM** next-day/next-week hotspot risk + Precision@K.
5. **M4 EPS [CORE]:** ranked enforcement queue with explainable factor bars.
6. **M5 dashboard [CORE]:** Streamlit + Kepler.gl — heatmap, impact map, forecast map, ranked list,
   time-slider, **what-if slider**. **This is the demo.**

> Why this wins: it is *complete end-to-end* (where→how much→when→act), grounded in real Bengaluru
> data **and real OSM road geometry**, honest about the impact-proxy, and the **what-if simulation
> makes impact actionable** — most teams will deliver only steps 1–2 (a bare heatmap).

### 8.2 Advanced version (target 48–72 h) — additive bonuses
- **HDBSCAN** street-segment clusters layered on the Gi\* hotspots.
- **TFT** multi-horizon quantile forecasting (risk intervals) with variable-importance plots.
  *(Note: at ~298K records, expect LightGBM to match or beat TFT — TFT is for the interpretable
  quantiles and the "we tried SOTA" story, not necessarily accuracy.)*
- **DiD causal validation** of impact using enforcement actions as treatment.
- **External traffic-API calibration** (HERE/TomTom/Google) on top-K hotspots for measured "X% slower"
  headlines — cached, off the live demo path, and attributed via DiD (see §4.2 caveats).
- **ILP/RL patrol allocation** under capacity + travel-time constraints.
- **React + deck.gl** production-grade dashboard on a FastAPI/PostGIS backend.

### 8.3 Stretch / research-grade differentiators (pick 1–2 for "wow")
- **What-if enforcement simulation** *(now CORE, not stretch)* — the cheapest, highest-impact
  differentiator; gives a "digital-twin feel" with only a re-summation of PCII.
- **Digital-twin micro-simulation (SUMO):** *optional polish on top of the what-if* — simulate one
  real hotspot with/without the blocked lane → *quantified* throughput/delay gain. High appeal, but
  only attempt after the what-if + everything else is solid.
- **Explainable AI:** SHAP on M2/M3 + EPS factor decomposition → every recommendation is justified.
- **RL-based enforcement allocation:** adaptive patrol policy maximizing impact-weighted violations averted.
- **Agent-based / real-time simulation:** stream replay of events with live hotspot/forecast updates.
- **Sampling-bias correction layer:** patrol-exposure normalization shown as a toggle (rare, sophisticated).

### 8.4 Demo narrative (90 seconds)
"Here are *real* Bengaluru hotspots (Gi\*, validated by Moran's I). Here's *how much* each chokes
traffic — an **OSM-grounded** impact index, every factor explained. Here's *where it'll flare up next
week* (LightGBM forecast). Here's the *ranked patrol plan* for tomorrow — and watch: when we
**enforce the top 3 zones, projected city-wide parking-congestion impact drops ~X%**." End on the
time-slider animation showing hotspots evolving month to month.

---

## 9. Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| **Language** | Python 3.11 | Ecosystem for geo + ML; team familiarity |
| **Data/ETL** | **DuckDB** + pandas/Polars; Parquet | In-process OLAP over 298K+ rows; zero-server; fast groupbys; columnar |
| **Geospatial** | **H3** (Uber), **GeoPandas**, **Shapely**, **OSMnx**, scikit-learn **HDBSCAN** | H3 = uniform hex units (fixes MAUP, easy adjacency); GeoPandas/Shapely for joins; OSMnx for road net |
| **Spatial stats** | Getis-Ord Gi\*, Moran's I (PySAL/esda *optional* or hand-rolled), scikit-learn KDE/HDBSCAN | Significance-based hotspots; no heavy deps required for MVP |
| **ML / forecasting** | **LightGBM** (core), **scikit-learn**; **PyTorch-Forecasting/Darts (TFT)** advanced; **SHAP** | LightGBM = fast, strong tabular, multi-series; TFT = interpretable multi-horizon |
| **Causal / sim** | **statsmodels** (DiD), **SUMO** (digital twin) — stretch | Causal validation + counterfactual throughput |
| **Computer vision** (extension) | **Ultralytics YOLOv11 / RT-DETR**, **ByteTrack**, **SAM2** | Real-time detection + tracking + lane-blockage measurement |
| **Backend/API** | **FastAPI** + Uvicorn | Async, typed, auto-docs; serves GeoJSON/scores |
| **Frontend** | MVP **Streamlit** + **pydeck/Kepler.gl/Folium**; Adv **React + deck.gl + Mapbox** | Streamlit = fastest path to a map demo; deck.gl = production-grade large-geo rendering |
| **Database** | MVP files/Parquet/DuckDB; Prod **PostgreSQL + PostGIS** | PostGIS = spatial indexing/queries at scale |
| **Deployment** | **Docker**; **Prefect/cron** for retrain; cloud VM/container | Reproducible; scheduled scoring |
| **Streaming** (prod) | **Kafka** (or Redis streams) | Ingest live violation feeds for real-time hotspots |
| **Monitoring** (prod) | **Prometheus + Grafana**, **MLflow/Evidently** | Service health + data/model drift on forecasts |

**Rationale themes:** zero-server analytics (DuckDB/H3) keeps the MVP fast and laptop-friendly;
LightGBM maximizes accuracy-per-hour of dev time; the same H3/GeoJSON contracts let MVP components
upgrade to production (PostGIS/deck.gl/TFT) without rewrites.

---

## 10. Evaluation & KPIs

### 10.1 Hotspot-detection metrics (M1)
- **Spatial autocorrelation:** Moran's I with permutation p-value (clustering is statistically real).
- **Gi\* significance:** fraction of cells at p<0.05 after FDR; hot/cold map stability.
- **Cluster quality:** HDBSCAN silhouette / DBCV; cluster **persistence** (Jaccard overlap of hotspot
  sets across consecutive months — target > 0.6).
- **Empirical reproduction:** do top Gi\* zones match known high-violation stations (Upparpet, City
  Market, Shivajinagar)? (sanity ground truth).

### 10.2 Forecasting metrics (M3)
- **Regression:** MAE, RMSE, **MASE** (< 1 beats seasonal-naïve).
- **Hotspot classification:** **PR-AUC**, F1, **Precision@K**, **hotspot hit-rate** (top-K predicted
  ⊇ next-period true hotspots).
- **Probabilistic:** quantile/pinball loss (TFT), reliability/calibration curve.

### 10.3 Congestion-impact metrics (M2)
- **Construct validity:** Spearman rank-correlation of PCII vs. any external congestion sample (where
  available); ablation/sensitivity of weights; **DiD treatment effect** $\hat\tau$ significance.
- **Explainability:** per-hotspot factor decomposition present for 100% of scored cells.

### 10.4 Business / city KPIs
- Reduction in violation recurrence in enforced top-K zones (period-over-period).
- Estimated throughput/delay recovered (digital-twin or DiD-based).
- Coverage: % of high-impact violations addressed by deployed patrols.

### 10.5 Operational KPIs
- Enforcement-response latency (created → action_taken) before vs. after deployment.
- Patrol efficiency: impact-weighted violations addressed per patrol-hour.
- Forecast lead time and dashboard refresh latency.

### 10.6 Enforcement KPIs
- **Precision@K / coverage** of the EPS queue (share of next-period high-impact violations in top-K).
- Repeat-offender capture; zone "cool-down" (time for an enforced hotspot to drop below threshold).

---

## 11. Appendix

### 11.1 Assumptions & honest caveats
- **No traffic-flow/speed data** in the dataset → congestion impact is **modeled (proxy), not
  measured**; PCII assumptions are explicit and validated via DiD/sim in the production path.
- **Patrol sampling bias:** records reflect *where officers patrolled*; mitigated via exposure
  normalization, Gi\* significance, and dashboard disclosure.
- **Date-range note:** filename says "jan to may" but `created_datetime` spans **Nov 2023 → Apr 2024**
  — reconcile labeling before publishing figures.
- **Validation NULLs (125,254):** analyses run on both all-records and approved-only subsets.

### 11.2 Reproducibility
- Pin environment (`requirements.txt`/`environment.yml`); set seeds; version data snapshots (Parquet
  + hash); deterministic H3 resolution; config-driven weights ($w$, $\beta$) in one YAML.
- One command rebuilds everything: `make all` → EDA → features → M1 → M2 → M3 → M4 → dashboard.

### 11.3 Future scalability
- **Real-time:** Kafka ingest → streaming H3 aggregation → online Gi\* / incremental forecast.
- **Multi-city:** H3 + OSM are city-agnostic; retrain per city, share architecture.
- **Sensor fusion:** add CV camera feeds (YOLOv11/ByteTrack/SAM2) to remove sampling bias and feed
  measured lane-blockage into PCII; add probe/loop flow data to switch M2 from proxy to ST-GNN causal.
- **Closed loop:** enforcement outcomes → DiD recalibration → continuously improving impact weights
  and EPS.

### 11.4 Selected references (method anchors)
- Getis & Ord (1992/1995) — *Gi\** local spatial statistics.
- Anselin (1995) — Local Indicators of Spatial Association (LISA / Local Moran's I).
- Campello, Moulavi, Sander (2013) — **HDBSCAN**.
- Ester et al. (1996) — DBSCAN; Ankerst et al. (1999) — OPTICS.
- Ke et al. (2017) — **LightGBM**. Lim et al. (2021) — **Temporal Fusion Transformer**.
- Li et al. (2018) DCRNN; Wu et al. (2019) Graph WaveNet — **ST-GNN** traffic forecasting.
- Uber — **H3** hierarchical hexagonal spatial index.
- SFpark — demand-responsive parking pricing field trial.

---

*End of APPROACH.md — implementation-ready. Companion deliverables (repo scaffold, model pipeline,
feature catalog, pitch deck) can be generated directly from this specification on request.*

