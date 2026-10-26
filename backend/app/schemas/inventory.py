from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserCreatedByResponse
class InventoryCreate(BaseModel):
    product_id: UUID
    measurement_id: UUID
    current_stock: float

class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    measurement_id: UUID
    current_stock: float
    creator: UserCreatedByResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
