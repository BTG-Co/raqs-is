from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import TransactionType
from app.schemas.user import UserCreatedByResponse

class TransactionCreate(BaseModel):
    inventory_id: UUID
    measurement_id: UUID
    transaction_type: TransactionType
    unit_price: float
    quantity: float

class TransactionApprove(BaseModel):
    ids: list[UUID]

class TransactionResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    measurement_id: UUID
    transaction_type: TransactionType
    creator: UserCreatedByResponse
    unit_price: float
    quantity: float
    total_price: float
    is_approved: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)