from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class MeasurementCreate(BaseModel):
    name: str
    short_name: str

class MeasurementUpdate(BaseModel):
    name: str
    short_name: str

class MeasurementResponse(BaseModel):
    id: UUID
    name: str
    short_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)