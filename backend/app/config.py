from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = Field("development", alias="ENV")
    database_url: str = Field(..., alias="DATABASE_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(30, alias="JWT_EXPIRE_MINUTES")
    jwt_refresh_expire_days: int = Field(30, alias="JWT_REFRESH_EXPIRE_DAYS")
    password_pepper: str = Field(..., alias="PASSWORD_PEPPER")
    frontend_url: str = Field("http://localhost:3000", alias="FRONTEND_URL")
    api_host: str = Field("http://localhost:8001", alias="API_HOST")
    openai_api_key: str = Field(..., alias="OPENAI_API_KEY")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
