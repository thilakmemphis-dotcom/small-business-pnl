"""
Database connection and initialization for Ledger Book API.
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ledger_book")
# Some providers (e.g. Render) use postgres://; psycopg2 expects postgresql://
DATABASE_URL = _url.replace("postgres://", "postgresql://", 1) if _url.startswith("postgres://") else _url


@contextmanager
def get_cursor():
    """Get a database cursor with RealDictCursor (returns dict rows)."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            yield cur
            conn.commit()
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist."""
    with get_cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL DEFAULT '',
                avatar_url VARCHAR(512),
                created_at TIMESTAMPTZ DEFAULT now()
            )
        """)

        # Add avatar_url if missing (for existing DBs)
        cur.execute("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)
        """)

        # Drop old ledger_data if it has device_id (legacy)
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'ledger_data' AND column_name = 'device_id'
        """)
        if cur.fetchone():
            cur.execute("DROP TABLE IF EXISTS ledger_data CASCADE")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS ledger_data (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                accounts JSONB NOT NULL DEFAULT '[]',
                entries JSONB NOT NULL DEFAULT '[]',
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(64) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL
            )
        """)
    print("DB ready")
