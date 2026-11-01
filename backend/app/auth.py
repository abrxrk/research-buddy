from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.config import settings
from app.db import users

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer()


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt limit
    name: str | None = None


def make_token(user_id: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode({"sub": user_id, "exp": exp}, settings.jwt_secret, algorithm="HS256")


def _out(user: dict) -> dict:
    uid = str(user["_id"])
    return {"token": make_token(uid), "user": {"id": uid, "email": user["email"], "name": user.get("name")}}


@router.post("/signup")
async def signup(body: Credentials):
    doc = {
        "email": body.email.lower(),
        "name": body.name,
        "password": bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()),
        "created_at": datetime.now(timezone.utc),
    }
    try:
        res = await users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(409, "Email already registered")
    doc["_id"] = res.inserted_id
    return _out(doc)


@router.post("/login")
async def login(body: Credentials):
    user = await users.find_one({"email": body.email.lower()})
    if not user or not bcrypt.checkpw(body.password.encode(), user["password"]):
        raise HTTPException(401, "Invalid email or password")
    return _out(user)


async def current_user(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    try:
        uid = jwt.decode(cred.credentials, settings.jwt_secret, algorithms=["HS256"])["sub"]
        user = await users.find_one({"_id": ObjectId(uid)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(401, "Invalid token")
    return user


@router.get("/me")
async def me(user: dict = Depends(current_user)):
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name")}
