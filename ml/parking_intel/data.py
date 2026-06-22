"""Data loading, cleaning, and profiling for the parking-violation dataset.

Robust to the real anonymized schema (see APPROACH.md §5.1):
    id, latitude, longitude, location, vehicle_number, vehicle_type, description,
    violation_type (JSON array), offence_code (JSON array), created_datetime, ...,
    police_station, junction_name, validation_status, ...
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from .config import BENGALURU_BBOX

RAW_NULLS = {"NULL", "null", "", "NaN", "nan", "None"}


def _parse_json_array(val: object) -> list[str]:
    """Parse a JSON-array string like '["WRONG PARKING","NO PARKING"]' -> list."""
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return []
    s = str(val).strip()
    if s in RAW_NULLS:
        return []
    try:
        parsed = json.loads(s)
        if isinstance(parsed, list):
            return [str(x).strip().upper() for x in parsed]
        return [str(parsed).strip().upper()]
    except (json.JSONDecodeError, TypeError):
        # Fallback: comma-separated
        return [p.strip().upper() for p in s.strip("[]").split(",") if p.strip()]


def load_raw(path: str | Path) -> pd.DataFrame:
    """Load the CSV with safe dtypes."""
    df = pd.read_csv(path, low_memory=False)
    df.columns = [c.strip() for c in df.columns]
    return df


def clean(df: pd.DataFrame, *, keep_unreviewed: bool = True) -> pd.DataFrame:
    """Clean + normalize. Returns one row per violation event with engineered fields.

    Args:
        keep_unreviewed: if True keep rows whose ``validation_status`` is NULL/unreviewed;
            if False keep only explicitly ``approved`` rows. Explicitly ``rejected`` /
            ``duplicate`` challans are always dropped so they never inflate hotspots.
    """
    df = df.copy()

    # --- validation status filter (drop officially-invalid challans) ---
    # Report data mixes approved, rejected and duplicate challans. Counting rejected
    # rows inflates every downstream score, so we exclude them up front.
    if "validation_status" in df.columns:
        status = df["validation_status"].astype(str).str.strip().str.lower()
        is_rejected = status.isin({"rejected", "duplicate"})
        is_approved = status == "approved"
        is_unreviewed = df["validation_status"].isna() | status.isin(
            {s.lower() for s in RAW_NULLS}
        )
        keep = is_approved | (is_unreviewed if keep_unreviewed else False)
        keep = keep & ~is_rejected
        df = df[keep].copy()

    # --- coordinates ---
    for col in ("latitude", "longitude"):
        df[col] = pd.to_numeric(df[col], errors="coerce")
    bb = BENGALURU_BBOX
    in_bbox = (
        df["latitude"].between(bb["min_lat"], bb["max_lat"])
        & df["longitude"].between(bb["min_lon"], bb["max_lon"])
    )
    df = df[in_bbox & df["latitude"].notna() & df["longitude"].notna()].copy()

    # --- timestamps ---
    df["created_datetime"] = pd.to_datetime(
        df["created_datetime"], errors="coerce", utc=True
    )
    df = df[df["created_datetime"].notna()].copy()
    # Convert to IST for temporal features
    ist = df["created_datetime"].dt.tz_convert("Asia/Kolkata")
    df["date"] = ist.dt.date
    df["hour"] = ist.dt.hour
    df["dayofweek"] = ist.dt.dayofweek
    df["is_weekend"] = (df["dayofweek"] >= 5).astype(int)
    df["month"] = ist.dt.tz_localize(None).dt.to_period("M").astype(str)

    # --- categorical normalization ---
    df["vehicle_type"] = (
        df.get("vehicle_type", pd.Series(index=df.index, dtype=object))
        .astype(str).str.strip().str.upper().replace(list(RAW_NULLS), "UNKNOWN")
    )
    df["police_station"] = (
        df.get("police_station", pd.Series(index=df.index, dtype=object))
        .astype(str).str.strip().replace(list(RAW_NULLS), "UNKNOWN")
    )
    df["junction_name"] = (
        df.get("junction_name", pd.Series(index=df.index, dtype=object))
        .astype(str).str.strip().replace(list(RAW_NULLS), "No Junction")
    )

    # --- violation types (multi-label) ---
    df["violation_types"] = df.get("violation_type", "").apply(_parse_json_array)
    df["primary_violation"] = df["violation_types"].apply(
        lambda lst: lst[0] if lst else "UNKNOWN"
    )
    df["near_junction"] = (df["junction_name"] != "No Junction").astype(int)

    return df.reset_index(drop=True)


def profile(df_raw: pd.DataFrame, df_clean: pd.DataFrame) -> dict:
    """Build a data-quality / profiling report (Phase 1 -> data_profile.json)."""
    vt_counts: dict[str, int] = {}
    for lst in df_clean["violation_types"]:
        for v in lst:
            vt_counts[v] = vt_counts.get(v, 0) + 1

    def top(series: pd.Series, n: int = 15) -> dict:
        return {str(k): int(v) for k, v in series.value_counts().head(n).items()}

    # Validation-filter accounting (how many officially-invalid challans were removed)
    rows_rejected = 0
    if "validation_status" in df_raw.columns:
        status_raw = df_raw["validation_status"].astype(str).str.strip().str.lower()
        rows_rejected = int(status_raw.isin({"rejected", "duplicate"}).sum())

    return {
        "rows_raw": int(len(df_raw)),
        "rows_clean": int(len(df_clean)),
        "rows_dropped": int(len(df_raw) - len(df_clean)),
        "validation_filter_applied": "validation_status" in df_raw.columns,
        "rows_rejected_by_validation": rows_rejected,
        "pct_rejected": round(100.0 * rows_rejected / max(len(df_raw), 1), 2),
        "date_min": str(df_clean["created_datetime"].min()),
        "date_max": str(df_clean["created_datetime"].max()),
        "coordinate_completeness_pct": round(
            100.0 * df_raw[["latitude", "longitude"]].notna().all(axis=1).mean(), 2
        ),
        "violation_type_counts": dict(
            sorted(vt_counts.items(), key=lambda kv: kv[1], reverse=True)
        ),
        "vehicle_type_counts": top(df_clean["vehicle_type"]),
        "police_station_counts": top(df_clean["police_station"]),
        "monthly_counts": top(df_clean["month"], 24),
        "validation_status_counts": (
            top(df_raw["validation_status"]) if "validation_status" in df_raw else {}
        ),
        "data_quality_notes": [
            "Coordinates complete; events filtered to Bengaluru bounding box.",
            "created_datetime parsed to UTC then converted to IST for temporal features.",
            "violation_type parsed from JSON array (multi-label).",
            "Report-based data is patrol-sampled: absence of records != absence of violations.",
            "Rejected/duplicate challans excluded via validation_status before scoring.",
        ],
    }
