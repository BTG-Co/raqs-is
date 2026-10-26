from pydantic import BaseModel

from app.models.enums import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
    role: UserRole | None = None