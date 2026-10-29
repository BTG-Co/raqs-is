from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel


class DailySalesProductRow(BaseModel):
    product_id: UUID
    name: str
    kg: float
    total_price: float


class DailySalesReportResponse(BaseModel):
    date: date
    as_of: datetime
    total_kg: float
    total_price: float
    products: list[DailySalesProductRow]
