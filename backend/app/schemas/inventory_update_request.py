from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.enums import ApprovalStatus


class InventoryUpdateRequestCreate(BaseModel):
    inventory_id: UUID
    product_id: UUID
    measurement_id: UUID
    amount: float
    requested_by: str


class InventoryUpdateRequestResponse(BaseModel):
    id: UUID
    inventory_id: UUID
    product_id: UUID
    measurement_id: UUID
    amount: float
    status: ApprovalStatus
    requested_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
