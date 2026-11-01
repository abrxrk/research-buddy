from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.errors import DuplicateKeyError

from app.api.deps import current_user
from app.core.database import users
from app.core.security import create_token, hash_password, verify_password
from app.models.user import AuthOut, LoginIn, SignupIn, UserOut, user_out

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth(doc: dict) -> AuthOut:
    return AuthOut(token=create_token(str(doc["_id"])), user=user_out(doc))


@router.post("/signup", response_model=AuthOut)
async def signup(body: SignupIn):
    doc = {
        "email": body.email.lower(),
        "name": body.name,
        "password": hash_password(body.password),
        "created_at": datetime.now(timezone.utc),
    }
    try:
        doc["_id"] = (await users.insert_one(doc)).inserted_id
    except DuplicateKeyError:
        raise HTTPException(409, "Email already registered")
    return _auth(doc)


@router.post("/login", response_model=AuthOut)
async def login(body: LoginIn):
    user = await users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    return _auth(user)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(current_user)):
    return user_out(user)
