from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError

from app.core.database import users
from app.core.security import decode_token

bearer = HTTPBearer()


async def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        user = await users.find_one({"_id": ObjectId(decode_token(cred.credentials))})
    except (PyJWTError, InvalidId):
        user = None
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    return user
