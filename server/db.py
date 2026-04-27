"""
Database connection and initialization for Ledger Book API.
Supports PostgreSQL (production) and SQLite (local dev, no setup needed).
"""
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

_url = os.getenv("DATABASE_URL", "sqlite:///./local.db").strip()
USE_SQLITE = _url.startswith("sqlite") or _url == "" or not _url

if USE_SQLITE:
    # SQLite: use path like sqlite:///./local.db -> ./local.db
    _path = _url.replace("sqlite:///", "").strip() if _url else "local.db"
    if not _path or _path == "sqlite":
        _path = "local.db"
    DB_PATH = str(Path(__file__).resolve().parent.parent / _path)
    DATABASE_URL = None
else:
    import psycopg2
    from psycopg2.extras import RealDictCursor, Json

    DB_PATH = None
    _url = _url.replace("postgres://", "postgresql://", 1) if _url.startswith("postgres://") else _url
    DATABASE_URL = _url


def _sqlite_row_factory(cursor, row):
    return {cursor.description[i][0]: row[i] for i in range(len(row))}


@contextmanager
def get_cursor():
    """Get a database cursor (returns dict rows)."""
    if USE_SQLITE:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = _sqlite_row_factory
        try:
            cur = _SqliteCursor(conn)
            yield cur
            conn.commit()
        finally:
            conn.close()
    else:
        conn = psycopg2.connect(DATABASE_URL)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
                conn.commit()
        finally:
            conn.close()


class _SqliteCursor:
    """Cursor wrapper: accepts %s placeholders, returns dict rows."""

    def __init__(self, conn):
        self.conn = conn
        self._cur = conn.cursor()

    def execute(self, sql, params=None):
        # Replace %s with ? for SQLite
        sql = sql.replace("%s", "?")
        if params:
            self._cur.execute(sql, params)
        else:
            self._cur.execute(sql)
        return self

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        names = [d[0] for d in self._cur.description]
        return dict(zip(names, row))

    def fetchall(self):
        rows = self._cur.fetchall()
        names = [d[0] for d in self._cur.description] if self._cur.description else []
        return [dict(zip(names, r)) for r in rows]


def init_db():
    """Create tables if they don't exist."""
    with get_cursor() as cur:
        if USE_SQLITE:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    name TEXT NOT NULL DEFAULT '',
                    avatar_url TEXT,
                    created_at TEXT DEFAULT (datetime('now'))
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS ledger_data (
                    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    accounts TEXT NOT NULL DEFAULT '[]',
                    entries TEXT NOT NULL DEFAULT '[]',
                    updated_at TEXT DEFAULT (datetime('now'))
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )
            """)
        else:
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
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512)")
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
    print("DB ready" + (" (SQLite)" if USE_SQLITE else ""))


def _json_adapt(val):
    """For SQLite: serialize JSON. For Postgres: use Json()."""
    if USE_SQLITE:
        return json.dumps(val) if val is not None else "[]"
    from psycopg2.extras import Json
    return Json(val) if val is not None else Json([])


def _uuid():
    return str(uuid.uuid4())
