from __future__ import annotations

import os
from pathlib import Path
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def _normalize_database_url(raw_database_url: str) -> str:
    if raw_database_url.startswith("postgres://"):
        return raw_database_url.replace("postgres://", "postgresql+psycopg://", 1)

    if raw_database_url.startswith("postgresql://") and "+psycopg" not in raw_database_url:
        return raw_database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return raw_database_url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL", "sqlite:///./backend/chat_app.db")
)


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def init_db() -> None:
    from . import db_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _run_lightweight_migrations()


def _run_lightweight_migrations() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    migration_statements: list[str] = []

    if "email" not in user_columns:
        migration_statements.append("ALTER TABLE users ADD COLUMN email VARCHAR(255)")
    if "avatar_url" not in user_columns:
        migration_statements.append("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    if "password_hash" not in user_columns:
        migration_statements.append("ALTER TABLE users ADD COLUMN password_hash VARCHAR(512)")
    if "updated_at" not in user_columns:
        migration_statements.append("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP")
        migration_statements.append("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")

    with engine.begin() as connection:
        for statement in migration_statements:
            connection.execute(text(statement))

        if "avatar_url" in user_columns and engine.url.get_backend_name() == "postgresql":
            connection.execute(text("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT"))

        connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email)"))
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_friendship_requests_pair "
                "ON friendship_requests (requester_id, receiver_id)"
            )
        ) if inspector.has_table("friendship_requests") else None


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return True
