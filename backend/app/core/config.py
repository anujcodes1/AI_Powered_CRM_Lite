from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Powered CRM Lite"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Configuration
    SECRET_KEY: str = "dev_super_secret_key_change_in_production_123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database Configuration (Defaults to SQLite for local dev if Postgres is not running)
    DATABASE_URL: str = "sqlite:///./crm_lite.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
