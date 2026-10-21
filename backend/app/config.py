from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str | None = None
    cors_origins: str = "http://localhost:4200"
    cors_origin_regex: str | None = None
    # GUEST_PASSWORD replaces the built-in guest password (kept hashed in app/auth/guest.py).
    guest_password: str | None = None
    # Signs guest passes. Defaults to a value derived from DATABASE_URL, so it is optional.
    guest_token_secret: str | None = None

    @field_validator("database_url")
    @classmethod
    def use_asyncpg_driver(cls, value: str | None) -> str | None:
        """Accept the plain postgres:// URL Supabase shows and switch it to asyncpg."""
        if not value:
            return None
        for prefix in ("postgresql://", "postgres://"):
            if value.startswith(prefix):
                return "postgresql+asyncpg://" + value[len(prefix) :]
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
