from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ProductCreate(BaseModel):
    name: str
    image: str | None
    base_measurement_id: UUID

class ProductUpdate(BaseModel):
    name: str
    image: str
    base_measurement_id: UUID

class ProductResponse(BaseModel):
    id: UUID
    name: str
    image: str | None
    base_measurement_id: UUID

    model_config = ConfigDict(from_attributes=True)
