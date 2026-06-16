"""Create all database tables.

Run from the backend/ directory:
    python -m scripts.init_db

This is safe to run multiple times — SQLAlchemy uses CREATE TABLE IF NOT EXISTS.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend/ is on the path when run directly
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.core.database import Base, get_engine
from app.models import db_models  # noqa: F401 — registers all ORM models with Base


def main() -> None:
    if not settings.database_url:
        print(
            "ERROR: GRIDLOCK_DATABASE_URL is not set.\n"
            "Add it to backend/.env or export it as an environment variable.\n"
            "Example:\n"
            "  GRIDLOCK_DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require"
        )
        sys.exit(1)

    print(f"Connecting to: {settings.database_url[:40]}...")
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("Tables created (or already exist):")
    for table in Base.metadata.sorted_tables:
        print(f"   * {table.name}")


if __name__ == "__main__":
    main()
