from uuid import uuid4
from sqlalchemy import Column, UUID, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID (as_uuid=True), primary_key=True, index=True, default=uuid4)
    name = Column(String, nullable=False, unique=True)
    image = Column(String, nullable=True)
    base_measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # relationships
    base_measurement = relationship(
        "Measurement",
        foreign_keys=[base_measurement_id],
        back_populates="products"
    )

    inventories = relationship(
        "Inventory",
        foreign_keys="[Inventory.product_id]",
        back_populates="product"
    )