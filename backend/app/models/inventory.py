from uuid import uuid4
from sqlalchemy import Column, UUID, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.base import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id") ,nullable=False)
    measurement_id = Column(UUID (as_uuid=True), ForeignKey("measurements.id"),nullable=False)
    current_stock = Column(Float, nullable=False)
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
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

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="inventories"
    )