from uuid import uuid4
from sqlalchemy import UUID, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    name = Column(String, nullable=False, unique=True)
    short_name = Column(String, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # relationships
    products = relationship(
        "Product",
        back_populates="base_measurement"
    )
    conversions_from = relationship(
        "MeasurementConversion",
        foreign_keys="[MeasurementConversion.base_measurement_id]",
        back_populates="base_measurement"
    )

    conversions_to = relationship(
        "MeasurementConversion",
        foreign_keys="[MeasurementConversion.converted_measurement_id]",
        back_populates="converted_measurement"
    )

    inventories = relationship(
        "Inventory",
        foreign_keys="[Inventory.measurement_id]",
        back_populates="measurement"
    )
    