from uuid import uuid4
from sqlalchemy import UUID, Column, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base

class MeasurementConversion(Base):
    __tablename__ = "measurement_conversion"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    base_measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=False)
    converted_measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=False)
    base_measurement_to_converted_amount = Column(Float, nullable=False)
    name = Column(String, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # relationships
    base_measurement = relationship(
        "Measurement",
        foreign_keys=[base_measurement_id],
        back_populates="conversions_from"
    )

    converted_measurement = relationship(
        "Measurement",
        foreign_keys=[converted_measurement_id],
        back_populates="conversions_to"
    )