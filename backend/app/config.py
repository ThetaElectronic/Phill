from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = Field("development", alias="ENV")
    app_version: str = Field("dev", alias="APP_VERSION")
    api_host: str = Field("http://localhost:8001", alias="API_HOST")
    frontend_url: str = Field("http://localhost:3000", alias="FRONTEND_URL")

    database_url: str = Field(..., alias="DATABASE_URL")

    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(30, alias="JWT_EXPIRE_MINUTES")
    jwt_refresh_expire_days: int = Field(30, alias="JWT_REFRESH_EXPIRE_DAYS")
    password_reset_expire_minutes: int = Field(30, alias="PASSWORD_RESET_EXPIRE_MINUTES")
    password_pepper: str = Field(..., alias="PASSWORD_PEPPER")

    smtp_host: str | None = Field(None, alias="SMTP_HOST")
    smtp_port: int | None = Field(None, alias="SMTP_PORT")
    smtp_user: str | None = Field(None, alias="SMTP_USER")
    smtp_pass: str | None = Field(None, alias="SMTP_PASS")
    smtp_from: str | None = Field(None, alias="SMTP_FROM")

    s3_enabled: bool = Field(False, alias="S3_ENABLED")
    s3_bucket: str | None = Field(None, alias="S3_BUCKET")
    s3_region: str | None = Field(None, alias="S3_REGION")
    s3_key: str | None = Field(None, alias="S3_KEY")
    s3_secret: str | None = Field(None, alias="S3_SECRET")

    openai_api_key: str | None = Field(None, alias="OPENAI_API_KEY")
    ai_model: str = Field("gpt-5.1", alias="AI_MODEL")
    ai_document_max_bytes: int | None = Field(None, alias="AI_DOCUMENT_MAX_BYTES")

    cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    csp_directives: str | None = Field(None, alias="CSP_DIRECTIVES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
