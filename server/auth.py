"""
Auth routes: signup, login, forgot-password, reset-password, me (GET/PATCH).
"""
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from server.db import get_cursor

APP_URL = os.getenv("APP_URL", "http://localhost:5173")
JWT_SECRET = os.getenv("JWT_SECRET", "ledger-book-secret-change-in-production")

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)


class SignupBody(BaseModel):
    email: str = ""
    password: str = ""
    name: str | None = None


class LoginBody(BaseModel):
    email: str = ""
    password: str = ""


class ForgotPasswordBody(BaseModel):
    email: str = ""


class ResetPasswordBody(BaseModel):
    token: str = ""
    newPassword: str = ""


class UpdateProfileBody(BaseModel):
    name: str | None = None
    avatar_url: str | None = None


def get_user_id(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> str:
    """Extract and verify JWT, return user_id."""
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Login required")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload["userId"]
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup")
def signup(body: SignupBody):
    email = (body.email or "").strip().lower()
    password = str(body.password or "")
    name = (body.name or "").strip() or (email.split("@")[0] if email else "")

    if not email or len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Email required and password must be at least 6 characters",
        )

    with get_cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        h = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()
        cur.execute(
            "INSERT INTO users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id, email, name, avatar_url, created_at",
            (email, h, name),
        )
        row = cur.fetchone()
        user_id = str(row["id"])
        user = {
            "id": user_id,
            "email": row["email"],
            "name": row["name"],
            "avatar_url": row["avatar_url"],
        }

    token = jwt.encode(
        {"userId": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"token": token, "user": user}


@router.post("/login")
def login(body: LoginBody):
    email = (body.email or "").strip().lower()
    password = str(body.password or "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    with get_cursor() as cur:
        cur.execute(
            "SELECT id, email, name, password_hash, avatar_url FROM users WHERE email = %s",
            (email,),
        )
        row = cur.fetchone()

    if not row or not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(row["id"])
    token = jwt.encode(
        {"userId": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": row["email"],
            "name": row["name"],
            "avatar_url": row["avatar_url"],
        },
    }


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordBody):
    email = (body.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    with get_cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cur.fetchone()

    if not row:
        return {"ok": True, "message": "If an account exists, you will receive a reset link"}

    user_id = row["id"]
    token = secrets.token_hex(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

    # Check if smtp is configured
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    has_smtp = bool(smtp_host and smtp_user)

    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
            """,
            (user_id, token, expires_at),
        )

    reset_link = f"{APP_URL}/?resetToken={token}"

    if has_smtp:
        _send_reset_email(email, reset_link)
        return {
            "ok": True,
            "message": "If an account exists, check your email for a reset link",
        }
    else:
        print(f"[Password reset] No SMTP configured. Reset link: {reset_link}")
        return {
            "ok": True,
            "message": "Check server console for reset link (SMTP not configured)",
            "resetToken": token,
        }


def _send_reset_email(to_email: str, reset_link: str):
    """Send password reset email via SMTP."""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Ledger Book password"
    msg["From"] = os.getenv("SMTP_FROM") or os.getenv("SMTP_USER", "")
    msg["To"] = to_email

    text = f"Click this link to reset your password (valid for 1 hour):\n{reset_link}"
    html = f'<p>Click <a href="{reset_link}">here</a> to reset your password. Link expires in 1 hour.</p>'

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(
        os.getenv("SMTP_HOST", ""),
        int(os.getenv("SMTP_PORT", "587")),
    ) as server:
        if os.getenv("SMTP_SECURE") == "true":
            server.starttls()
        server.login(os.getenv("SMTP_USER", ""), os.getenv("SMTP_PASS", ""))
        server.sendmail(msg["From"], to_email, msg.as_string())


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody):
    token = (body.token or "").strip()
    password = str(body.newPassword or "")

    if not token or len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Token and password (min 6 characters) required",
        )

    with get_cursor() as cur:
        cur.execute(
            "SELECT user_id FROM password_reset_tokens WHERE token = %s AND expires_at > now()",
            (token,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset link. Request a new one.",
        )

    user_id = row["user_id"]
    h = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=10)).decode()

    with get_cursor() as cur:
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (h, user_id))
        cur.execute("DELETE FROM password_reset_tokens WHERE user_id = %s", (user_id,))

    return {"ok": True, "message": "Password updated. You can now login."}


@router.get("/me")
def get_me(user_id: str = Depends(get_user_id)):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id, email, name, avatar_url, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user": dict(row)}


@router.patch("/me")
def update_me(body: UpdateProfileBody, user_id: str = Depends(get_user_id)):
    updates = []
    values = []

    if body.name is not None:
        updates.append("name = %s")
        values.append((body.name or "").strip() or None)
    if body.avatar_url is not None:
        updates.append("avatar_url = %s")
        values.append((body.avatar_url or "").strip() or None)

    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    values.append(user_id)
    with get_cursor() as cur:
        cur.execute(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, email, name, avatar_url, created_at",
            values,
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user": dict(row)}
