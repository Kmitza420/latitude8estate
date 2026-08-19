"""
Application configuration loaded from environment variables.

All settings are read from the process environment (or a ``.env`` file in the
project root).  Required variables that have no default will cause a
``ValidationError`` at import time if they are missing.

Usage::

    from core.settings import settings
    print(settings.DATABASE_HOST)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # Runtime environment
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_NAME: str = "crm_db"
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_RECYCLE: int = 1800

    # MinIO — private bucket (documents, legacy cover images)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_EXTERNAL_ENDPOINT: str = ""
    MINIO_EXTERNAL_SECURE: bool = False
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "latitude8estate-files"
    MINIO_SECURE: bool = False

    # MinIO — public media bucket
    # MINIO_PUBLIC_BASE_URL: browser reachable base URL for the public bucket,
    #   e.g. "https://yourdomain.com/media" (via nginx proxy) or
    #        "http://your-vps-ip:9000/latitude8estate-media" (direct MinIO).
    # Leave empty to fall back to http://{MINIO_ENDPOINT}/{MINIO_PUBLIC_BUCKET}.
    MINIO_PUBLIC_BUCKET: str = "latitude8estate-media"
    MINIO_PUBLIC_BASE_URL: str = ""

    # Authentication
    AUTH_JWT_SECRET_KEY: str = "$uper$ecretK3y"
    AUTH_JWT_ALGORITHM: str = "HS256"
    AUTH_JWT_EXPIRATION_MINUTES: int = 60

    # CORS — comma-separated origins; defaults to "*" for local dev
    CORS_ORIGINS: str = "*"

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def is_production(self) -> bool:
        """Return *True* when running in the production environment."""
        return self.ENVIRONMENT.lower() == "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
