from uuid import uuid4
from sqlalchemy import Column, UUID, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.base import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id") ,nullable=False)
    measurement_id = Column(UUID (as_uuid=True), ForeignKey("measurements.id"),nullable=False)
    amount = Column(Float, nullable=False)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # relationships
    product = relationship(
        "Product",
        foreign_keys=[product_id],
        back_populates="inventories"
    )

    measurement = relationship(
        "Measurement",
        foreign_keys=[measurement_id],
        back_populates="inventories"
    )