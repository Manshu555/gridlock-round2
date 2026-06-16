"""Backend settings (env-overridable via pydantic-settings)."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="GRIDLOCK_", env_file=".env", extra="ignore")

    app_name: str = "Gridlock Parking Intelligence API"
    version: str = "0.1.0"
    outputs_dir: Path = REPO_ROOT / "outputs"
    # comma-separated origins; "*" allows all (dev default)
    cors_origins: str = "*"
    log_level: str = "INFO"
    # PostgreSQL connection string — set via GRIDLOCK_DATABASE_URL env var
    # Example: postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
    database_url: Optional[str] = None

    @property
    def cors_list(self) -> list[str]:
        return ["*"] if self.cors_origins.strip() == "*" else [
            o.strip() for o in self.cors_origins.split(",") if o.strip()
        ]

    @property
    def db_enabled(self) -> bool:
        """True when a database URL has been configured."""
        return bool(self.database_url)


settings = Settings()
