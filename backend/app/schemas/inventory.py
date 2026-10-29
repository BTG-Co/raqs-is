from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import TransactionType
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


class InventoryStockView(BaseModel):
    measurement_id: UUID
    measurement_name: str
    short_name: str
    quantity: float
    is_stock_unit: bool
    is_base_unit: bool


class InventoryLedgerItem(BaseModel):
    id: UUID
    measurement_id: UUID
    transaction_type: TransactionType
    creator: UserCreatedByResponse
    unit_price: float
    quantity: float
    total_price: float
    is_approved: bool
    stock_quantity: float
    signed_stock_delta: float
    running_balance: float | None
    created_at: datetime
    updated_at: datetime


class InventoryDetailResponse(BaseModel):
    inventory: InventoryResponse
    product_id: UUID
    product_name: str
    base_measurement_id: UUID
    stock_views: list[InventoryStockView]
    transactions: list[InventoryLedgerItem]
