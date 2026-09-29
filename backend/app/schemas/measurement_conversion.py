from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MeasurementConversionCreate(BaseModel):
    base_measurement_id: UUID
    converted_measurement_id: UUID
    base_measurement_to_converted_amount: float
    name: str

class MeasurementConversionUpdate(BaseModel):
    base_measurement_id: UUID
    converted_measurement_id: UUID
    base_measurement_to_converted_amount: float
    name: str

class MeasurementConversionResponse(BaseModel):
    id: UUID
    base_measurement_id: UUID
    converted_measurement_id: UUID
    base_measurement_to_converted_amount: float
    name: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)