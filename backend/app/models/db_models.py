"""SQLAlchemy ORM models for Gridlock.

These tables mirror the columns produced by the ML pipeline so that
pipeline outputs can be persisted into PostgreSQL via seed_db.py.
"""
from __future__ import annotations

import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HotspotCell(Base):
    """One H3 hexagonal cell with all computed scores from the ML pipeline.

    Populated by running: python -m scripts.seed_db
    """
    __tablename__ = "hotspot_cells"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Core identifier ────────────────────────────────────────────────────
    h3: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    # ── Getis-Ord Gi* hotspot scores ──────────────────────────────────────
    gi_z: Mapped[float | None] = mapped_column(Float)
    gi_p: Mapped[float | None] = mapped_column(Float)
    is_hotspot: Mapped[bool | None] = mapped_column(Boolean)
    hotspot_score: Mapped[float | None] = mapped_column(Float)
    hotspot_category: Mapped[str | None] = mapped_column(String(50))

    # ── Traffic / violation counts ────────────────────────────────────────
    violations: Mapped[int | None] = mapped_column(Integer)
    top_violation: Mapped[str | None] = mapped_column(String(200))

    # ── PCII (Parking Congestion Impact Index) ────────────────────────────
    pcii: Mapped[float | None] = mapped_column(Float)
    pcii_density: Mapped[float | None] = mapped_column(Float)
    pcii_capacity: Mapped[float | None] = mapped_column(Float)
    pcii_junction: Mapped[float | None] = mapped_column(Float)
    pcii_footprint: Mapped[float | None] = mapped_column(Float)
    pcii_persistence: Mapped[float | None] = mapped_column(Float)

    # ── EPS (Enforcement Priority Score) ─────────────────────────────────
    eps: Mapped[float | None] = mapped_column(Float)
    eps_pcii_component: Mapped[float | None] = mapped_column(Float)
    eps_freq_component: Mapped[float | None] = mapped_column(Float)
    eps_crit_component: Mapped[float | None] = mapped_column(Float)
    priority_rank: Mapped[int | None] = mapped_column(Integer, index=True)

    # ── Road / location metadata ──────────────────────────────────────────
    police_station: Mapped[str | None] = mapped_column(String(200))
    road_class: Mapped[str | None] = mapped_column(String(50))
    road_criticality: Mapped[float | None] = mapped_column(Float)

    # ── Audit timestamps ──────────────────────────────────────────────────
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ForecastRecord(Base):
    """One LightGBM forecast data point per H3 cell per date."""
    __tablename__ = "forecast_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    h3: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    violations: Mapped[float | None] = mapped_column(Float)   # actual (may be NaN for future)
    prediction: Mapped[float | None] = mapped_column(Float)   # model output

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SimulationLog(Base):
    """Records every what-if simulation request + result for audit/analytics."""
    __tablename__ = "simulation_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    k: Mapped[int] = mapped_column(Integer, nullable=False)
    compliance: Mapped[float] = mapped_column(Float, nullable=False)

    # Result snapshot (JSON-serialisable floats)
    city_impact_before: Mapped[float | None] = mapped_column(Float)
    city_impact_after: Mapped[float | None] = mapped_column(Float)
    absolute_reduction: Mapped[float | None] = mapped_column(Float)
    reduction_pct: Mapped[float | None] = mapped_column(Float)
    violations_addressed: Mapped[int | None] = mapped_column(Integer)
    cells_cleared: Mapped[int | None] = mapped_column(Integer)
    cleared_cell_ids: Mapped[str | None] = mapped_column(Text)  # comma-separated h3 ids

    requested_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
