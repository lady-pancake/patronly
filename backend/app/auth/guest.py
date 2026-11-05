"""Guest access for the portfolio: a signed guest pass, no password.

There are no real accounts. Each time someone opens the app we save a guest
row (when they came) and hand back a pass that identifies that row on later
requests.
"""

import hashlib
import time
import uuid

import jwt

from app.config import get_settings

PASS_DAYS = 30
AUDIENCE = "patronly-guest"


def _secret() -> str:
    settings = get_settings()
    if settings.guest_token_secret:
        return settings.guest_token_secret
    if not settings.database_url:
        raise RuntimeError("Guest passes need DATABASE_URL or GUEST_TOKEN_SECRET.")
    # Derived, so no extra setting is needed. Changing the database password signs everyone out.
    return hashlib.sha256(f"patronly-guest-pass:{settings.database_url}".encode()).hexdigest()


def issue_pass(guest_id: uuid.UUID) -> str:
    now = int(time.time())
    claims = {"sub": str(guest_id), "aud": AUDIENCE, "iat": now, "exp": now + PASS_DAYS * 86400}
    return jwt.encode(claims, _secret(), algorithm="HS256")


def read_pass(token: str) -> uuid.UUID | None:
    """The guest id in a valid pass, or None for a missing, forged or expired one."""
    try:
        claims = jwt.decode(token, _secret(), algorithms=["HS256"], audience=AUDIENCE)
        return uuid.UUID(claims["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, RuntimeError):
        return None
