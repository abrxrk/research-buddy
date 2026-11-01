from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"
TOKEN_TTL = timedelta(days=7)


def hash_password(password: str) -> bytes:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())


def verify_password(password: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(password.encode(), hashed)


def create_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + TOKEN_TTL
    return jwt.encode({"sub": user_id, "exp": exp}, settings.jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> str:
    """Return user id; raises jwt.PyJWTError if invalid or expired."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])["sub"]
