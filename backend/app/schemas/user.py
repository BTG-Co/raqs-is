from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.enums import UserRole

class UserCreate(BaseModel):
    username: str
    name: str
    password: str
    role: UserRole = UserRole.STAFF

class UserUpdate(BaseModel):
    username: str
    name: str
    role: UserRole
    password: str

class UserCreatedByResponse(BaseModel):
    username: str
    name: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)
class UserResponse(BaseModel):
    id: UUID
    username: str
    name: str
    role: UserRole
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)