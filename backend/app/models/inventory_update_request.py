from uuid import uuid4
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String, UUID, func
from app.db.base import Base
from app.models.enums import ApprovalStatus


class InventoryUpdateRequest(Base):
    __tablename__ = "inventory_update_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid4)
    inventory_id = Column(UUID(as_uuid=True), ForeignKey("inventory.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    measurement_id = Column(UUID(as_uuid=True), ForeignKey("measurements.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    requested_by = Column(String, nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
