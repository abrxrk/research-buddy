from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)  # bcrypt limit
    name: str | None = Field(default=None, max_length=100)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(max_length=72)


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None = None


class AuthOut(BaseModel):
    token: str
    user: UserOut


def user_out(doc: dict) -> UserOut:
    return UserOut(id=str(doc["_id"]), email=doc["email"], name=doc.get("name"))
