"""parking_intel — AI-Powered Parking Intelligence core library.

Modules:
    config      Central configuration (paths, weights, H3 resolution, severity maps).
    data        Load + clean the violation dataset.
    h3_index    H3 hexagonal aggregation and feature engineering.
    hotspots    Getis-Ord Gi* hotspot detection (NumPy implementation; PySAL optional).
    osm         OSM road enrichment with offline class-based fallback.
    pcii        Proxy Congestion Impact Index (0-100).
    forecast    LightGBM hotspot-risk forecasting (sklearn GBDT fallback).
    eps         Enforcement Priority Score.
    simulate    What-if enforcement simulation.
    pipeline    End-to-end orchestrator that writes all outputs.
"""

__version__ = "0.1.0"
