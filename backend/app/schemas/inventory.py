from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class InventoryCreate(BaseModel):
    product_id: UUID
    measurement_id: UUID
    amount: float

class InventoryUpdate(BaseModel):
    product_id: UUID
    measurement_id: UUID
    amount: float

class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    measurement_id: UUID
    amount: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
