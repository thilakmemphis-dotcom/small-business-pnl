"""
Ledger routes: GET /api/ledger, PUT /api/ledger.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from server.auth import get_user_id
from server.db import get_cursor, _json_adapt, USE_SQLITE

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

    accounts = row["accounts"]
    entries = row["entries"]
    if USE_SQLITE and isinstance(accounts, str):
        import json
        accounts = json.loads(accounts) if accounts else []
        entries = json.loads(entries) if entries else []
    return {
        "accounts": accounts or [],
        "entries": entries or [],
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
                updated_at = """ + ("datetime('now')" if USE_SQLITE else "now()") + """
            """,
            (user_id, _json_adapt(body.accounts), _json_adapt(body.entries)),
        )
    return {"ok": True}
