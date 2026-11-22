import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from backend/.env or current directory
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Notice for local developers
    print(
        "[WARNING] DATABASE_URL is not set in environment or backend/.env! "
        "Please configure your Neon PostgreSQL connection string.",
        file=sys.stderr,
    )

# Normalize connection string for SQLAlchemy with psycopg2 driver
if DATABASE_URL:
    # Neon provides postgresql:// or postgres://; ensure SQLAlchemy uses psycopg2 driver
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+psycopg2://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

# Configure SQLAlchemy engine optimized for Neon serverless PostgreSQL
# pool_pre_ping=True checks connections before checkout, critical for serverless connection drops
# pool_recycle=300 recycles connections every 5 minutes
engine = create_engine(
    DATABASE_URL or "postgresql+psycopg2://localhost/trueforecast_fallback",
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db():
    """FastAPI dependency to yield database session per request with clean rollback on error."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database tables defined in models and apply schema migrations."""
    from models import Account, Deal, SalesRep, Task  # noqa: F401
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE deals ADD COLUMN IF NOT EXISTS next_step VARCHAR;"))
            conn.execute(text("ALTER TABLE deals ADD COLUMN IF NOT EXISTS lead_source VARCHAR;"))
            conn.execute(text("ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS phone VARCHAR;"))
            conn.execute(text("ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS email VARCHAR;"))
            conn.execute(text("ALTER TABLE sales_reps ADD COLUMN IF NOT EXISTS quota_target FLOAT;"))
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                activity_type VARCHAR(64) DEFAULT 'Follow-up',
                deal_id VARCHAR(64) REFERENCES deals(id) ON DELETE SET NULL,
                deal_name VARCHAR(255),
                owner_name VARCHAR(128),
                due_date VARCHAR(32),
                status VARCHAR(32) DEFAULT 'Open',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """))
            conn.commit()
    except Exception as e:
        print(f"[!] Schema migration check warning: {e}", file=sys.stderr)
