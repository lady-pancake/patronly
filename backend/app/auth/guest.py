"""Guest access for the portfolio: one shared password, then a signed guest pass.

There are no real accounts. Each time someone gets past the password gate we
save a guest row (their name and when they came) and hand back a pass that
identifies that row on later requests.
"""

import hashlib
import hmac
import time
import uuid

import jwt

from app.config import get_settings

# scrypt hash of the password Juliette gives out. GUEST_PASSWORD overrides it.
PASSWORD_HASH = (
    "scrypt$8cffcc5ae9f9cbf985ccf5e1c009e5b5$"
    "deaa7f100386cf61effbf8b47b90d9aa96690854e9a2d288e5948192ceed4e06"
)
PASS_DAYS = 30
AUDIENCE = "patronly-guest"


def check_password(password: str) -> bool:
    override = get_settings().guest_password
    if override:
        return hmac.compare_digest(password.encode(), override.encode())
    _, salt, expected = PASSWORD_HASH.split("$")
    actual = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32
    )
    return hmac.compare_digest(actual.hex(), expected)


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
