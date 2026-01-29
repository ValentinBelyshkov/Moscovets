from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL engine configuration
engine = create_engine(
    settings.DATABASE_URL,
    # pool_pre_ping is useful for PostgreSQL to handle disconnected connections
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
