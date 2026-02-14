from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://swarmchat:swarmchat_dev_password@postgres:5432/swarmchat"
    REDIS_URL: str = "redis://redis:6379/0"
    LLM_PROVIDER: str = "gemini"  # gemini | openai | anthropic | mistral | openai-compatible
    LLM_BASE_URL: str = ""  # only needed for openai-compatible
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3-flash-preview"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:80"
    SUBGROUP_SIZE: int = 5
    CME_INTERVAL_SECONDS: int = 20
    SURROGATE_INTERVAL_SECONDS: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
