"""
Ledger routes: GET /api/ledger, PUT /api/ledger.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from psycopg2.extras import Json

from server.auth import get_user_id
from server.db import get_cursor

router = APIRouter(prefix="/api", tags=["Ledger"])


class LedgerBody(BaseModel):
    accounts: list[str] = []
    entries: list = []


@router.get("/ledger")
def get_ledger(user_id: str = Depends(get_user_id)):
    with get_cursor() as cur:
        cur.execute(
            "SELECT accounts, entries FROM ledger_data WHERE user_id = %s",
            (user_id,),
        )
        row = cur.fetchone()

    if not row:
        return {"accounts": [], "entries": []}

    return {
        "accounts": row["accounts"] or [],
        "entries": row["entries"] or [],
    }


@router.put("/ledger")
def put_ledger(body: LedgerBody, user_id: str = Depends(get_user_id)):
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO ledger_data (user_id, accounts, entries)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET
                accounts = EXCLUDED.accounts,
                entries = EXCLUDED.entries,
                updated_at = now()
            """,
            (user_id, Json(body.accounts), Json(body.entries)),
        )
    return {"ok": True}
