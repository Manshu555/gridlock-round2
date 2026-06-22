"""parking_intel — AI-Powered Parking Intelligence core library.

Modules:
    config      Central configuration (paths, weights, H3 resolution, severity maps).
    data        Load + clean the violation dataset (drops rejected/duplicate challans).
    h3_index    H3 hexagonal aggregation and feature engineering.
    debias      Patrol-sampling de-bias (exposure-normalized violation_rate).
    hotspots    Getis-Ord Gi* hotspot detection (NumPy implementation; PySAL optional).
    osm         OSM road enrichment with offline class-based fallback.
    pcii        Proxy Congestion Impact Index (0-100), peak-hour weighted.
    forecast    LightGBM hotspot-risk forecasting (sklearn GBDT fallback).
    eps         Enforcement Priority Score.
    simulate    What-if enforcement simulation (displacement-aware).
    speed_validation  PCII vs traffic-speed correlation (honesty-guarded).
    pipeline    End-to-end orchestrator that writes all outputs.
"""

__version__ = "0.1.0"
